import { validateScene, type Scene } from '$lib/contracts';
import type { AiConfig } from '$lib/server/ai/config';
import { assertImagePromptGuardrails } from '$lib/server/ai/guardrails';
import {
	AiProviderError,
	type AiProvider,
	type GenerateImageInput,
	type GenerateSceneInput,
	type GeneratedImage,
	type ProviderProbeResult,
	isRetryableStatus
} from '$lib/server/ai/provider.interface';
import { evaluateStorySanity } from '$lib/server/ai/sanity';
import { emitAiServerTelemetry } from '$lib/server/ai/telemetry';
import { normalizeSceneCandidate } from '$lib/server/ai/providers/grok/sceneNormalizer';
import { parseSceneCandidate, type SceneCandidate } from '$lib/server/ai/providers/grok/sceneParser';
import { executeRequestWithTimeoutAndRetry } from '$lib/server/ai/providers/grok/transport';
import { getActiveStoryCartridge } from '$lib/stories';

const XAI_CHAT_URL = 'https://api.x.ai/v1/chat/completions';
const XAI_IMAGE_URL = 'https://api.x.ai/v1/images/generations';

interface ChatChoice {
	message?: { content?: string | null };
}

interface ChatResponse {
	choices?: ChatChoice[];
	usage?: Record<string, unknown>;
}

interface ChatCallResult {
	text: string;
	usage?: Record<string, unknown>;
	retryCount: number;
	latencyMs: number;
}

function getCartridgePrompts() {
	const prompts = getActiveStoryCartridge().prompts;
	return {
		SYSTEM_PROMPT: prompts.systemPrompt,
		getOpeningPrompt: prompts.getOpeningPrompt,
		getContinuePromptFromContext: prompts.getContinuePromptFromContext,
		getRecoveryPrompt: prompts.getRecoveryPrompt
	};
}

function buildScenePrompt(input: GenerateSceneInput, mode: 'opening' | 'next'): string {
	const { getOpeningPrompt, getContinuePromptFromContext } = getCartridgePrompts();
	if (mode === 'opening') {
		return getOpeningPrompt();
	}

	if (!input.narrativeContext) {
		throw new AiProviderError('Narrative context is required for non-opening scene generation', {
			code: 'invalid_response',
			retryable: false
		});
	}
	return getContinuePromptFromContext(input.narrativeContext, null);
}

export class GrokAiProvider implements AiProvider {
	readonly name = 'grok' as const;
	private readonly config: AiConfig;
	private readonly fetchImpl: typeof fetch;

	constructor(config: AiConfig, fetchImpl: typeof fetch = fetch) {
		this.config = config;
		this.fetchImpl = fetchImpl;
	}

	private async callChatRaw(prompt: string): Promise<ChatCallResult> {
		const request = await executeRequestWithTimeoutAndRetry<{ text: string; usage?: Record<string, unknown> }>({
			fetchImpl: this.fetchImpl,
			url: XAI_CHAT_URL,
			requestInit: {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
					authorization: `Bearer ${this.config.xaiApiKey}`
				},
				body: JSON.stringify({
					model: this.config.grokTextModel,
					messages: [
						{ role: 'system', content: getCartridgePrompts().SYSTEM_PROMPT },
						{ role: 'user', content: prompt }
					],
					max_tokens: this.config.maxOutputTokens,
					temperature: 0.8
				})
			},
			timeoutMs: this.config.requestTimeoutMs,
			maxRetries: this.config.maxRetries,
			retryBackoffMs: this.config.retryBackoffMs,
			execute: async (response) => {
				if (!response.ok) {
					const status = response.status;
					throw new AiProviderError(`xAI chat request failed (${status})`, {
						code:
							status === 401 || status === 403
								? 'auth'
								: status === 429
									? 'rate_limit'
									: 'provider_down',
						retryable: isRetryableStatus(status),
						status
					});
				}

				const payload = (await response.json()) as ChatResponse;
				const text = payload.choices?.[0]?.message?.content;
				if (!text || typeof text !== 'string') {
					throw new AiProviderError('xAI chat returned empty content', {
						code: 'invalid_response',
						retryable: false
					});
				}
				return { text, usage: payload.usage };
			},
			timeoutError: () => new AiProviderError('xAI request timed out', { code: 'timeout', retryable: true }),
			fallbackError: () => new AiProviderError('xAI request failed', { code: 'unknown', retryable: false })
		});

		return {
			text: request.result.text,
			usage: request.result.usage,
			retryCount: request.retryCount,
			latencyMs: request.latencyMs
		};
	}

	private async callChat(prompt: string): Promise<{ scene: SceneCandidate; usage?: Record<string, unknown> }> {
		const first = await this.callChatRaw(prompt);

		try {
			const parsed = parseSceneCandidate(first.text);
			emitAiServerTelemetry('provider_chat', {
				requestId: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
				provider: this.name,
				model: this.config.grokTextModel,
				latencyMs: first.latencyMs,
				retryCount: first.retryCount,
				parseAttempts: 1,
				tokenUsage: first.usage ?? null
			});
			return { scene: parsed, usage: first.usage };
		} catch (error) {
			emitAiServerTelemetry('parse_fail', { level: 1, sample: first.text.slice(0, 300), error: String(error) });
		}

		const recoveryPrompt = getCartridgePrompts().getRecoveryPrompt(first.text);
		const recovery = await this.callChatRaw(recoveryPrompt);
		try {
			const parsed = parseSceneCandidate(recovery.text);
			emitAiServerTelemetry('provider_chat', {
				requestId: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
				provider: this.name,
				model: this.config.grokTextModel,
				latencyMs: first.latencyMs + recovery.latencyMs,
				retryCount: first.retryCount + recovery.retryCount,
				parseAttempts: 2,
				tokenUsage: recovery.usage ?? first.usage ?? null
			});
			return { scene: parsed, usage: recovery.usage ?? first.usage };
		} catch (error) {
			emitAiServerTelemetry('parse_fail', { level: 2, sample: recovery.text.slice(0, 300), error: String(error) });
		}

		throw new AiProviderError('Unable to parse scene from provider response', {
			code: 'invalid_response',
			retryable: false
		});
	}

	private async generateScene(input: GenerateSceneInput, mode: 'opening' | 'next'): Promise<Scene> {
		const prompt = buildScenePrompt(input, mode);
		const maxSanityAttempts = 2;
		let attempt = 0;
		let lastSanityIssues: string[] = [];

		while (attempt < maxSanityAttempts) {
			const { scene } = await this.callChat(prompt);
			const fallbackSceneId =
				mode === 'opening' ? 'opening' : `scene_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
			const normalized = normalizeSceneCandidate(scene, fallbackSceneId);

			if (!validateScene(normalized)) {
				throw new AiProviderError('xAI scene failed contract validation', {
					code: 'invalid_response',
					retryable: false
				});
			}

			const sanity = evaluateStorySanity(normalized);
			lastSanityIssues = sanity.issues;
			if (sanity.ok) return normalized;

			const canRetryForDrift =
				sanity.blockingIssues.length === 0 && sanity.retryableIssues.length > 0 && attempt < maxSanityAttempts - 1;
			if (!canRetryForDrift) break;
			attempt += 1;
		}

		throw new AiProviderError(`xAI scene failed sanity checks: ${lastSanityIssues.join(',')}`, {
			code: 'invalid_response',
			retryable: false
		});
	}

	async getOpeningScene(input: GenerateSceneInput): Promise<Scene> {
		return this.generateScene(input, 'opening');
	}

	async getNextScene(input: GenerateSceneInput): Promise<Scene> {
		return this.generateScene(input, 'next');
	}

	async generateImage(input: GenerateImageInput): Promise<GeneratedImage> {
		if (!this.config.enableGrokImages) {
			throw new AiProviderError('Grok image generation disabled by config', {
				code: 'provider_down',
				retryable: false
			});
		}

		assertImagePromptGuardrails(input.prompt);

		const request = await executeRequestWithTimeoutAndRetry<GeneratedImage>({
			fetchImpl: this.fetchImpl,
			url: XAI_IMAGE_URL,
			requestInit: {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
					authorization: `Bearer ${this.config.xaiApiKey}`
				},
				body: JSON.stringify({
					model: this.config.grokImageModel,
					prompt: input.prompt
				})
			},
			timeoutMs: this.config.requestTimeoutMs,
			maxRetries: this.config.maxRetries,
			retryBackoffMs: this.config.retryBackoffMs,
			execute: async (response) => {
				if (!response.ok) {
					const status = response.status;
					throw new AiProviderError(`xAI image request failed (${status})`, {
						code:
							status === 401 || status === 403
								? 'auth'
								: status === 429
									? 'rate_limit'
									: 'provider_down',
						retryable: isRetryableStatus(status),
						status
					});
				}

				const payload = (await response.json()) as {
					data?: Array<{ url?: string; b64_json?: string }>;
				};
				const image = payload.data?.[0];
				if (!image || (!image.url && !image.b64_json)) {
					throw new AiProviderError('xAI image response missing data', {
						code: 'invalid_response',
						retryable: false
					});
				}

				return {
					url: typeof image.url === 'string' ? image.url : undefined,
					b64: typeof image.b64_json === 'string' ? image.b64_json : undefined
				};
			},
			timeoutError: () =>
				new AiProviderError('xAI image request timed out', {
					code: 'timeout',
					retryable: true,
					status: 504
				}),
			fallbackError: () =>
				new AiProviderError('xAI image request failed', {
					code: 'unknown',
					retryable: false
				})
		});

		return request.result;
	}

	async probe(): Promise<ProviderProbeResult> {
		const started = Date.now();
		try {
			await this.callChat(
				'Respond with {"sceneText":"probe","choices":[{"id":"ok","text":"ok"},{"id":"wait","text":"wait"}],"lessonId":null,"imageKey":"hotel_room","isEnding":false,"endingType":null}'
			);
			return {
				provider: this.name,
				model: this.config.grokTextModel,
				modelAvailable: true,
				authValid: true,
				latencyMs: Date.now() - started
			};
		} catch (error) {
			const authFail = error instanceof AiProviderError && error.code === 'auth';
			return {
				provider: this.name,
				model: this.config.grokTextModel,
				modelAvailable: false,
				authValid: !authFail,
				latencyMs: Date.now() - started
			};
		}
	}

	isAvailable(): boolean {
		return this.config.xaiApiKey.length > 0;
	}
}
