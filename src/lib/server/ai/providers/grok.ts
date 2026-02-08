import { validateEndingType, validateScene, type Scene, type StoryThreads } from '$lib/contracts';
import type { AiConfig } from '$lib/server/ai/config';
import {
	SYSTEM_PROMPT,
	getContinuePrompt,
	getContinuePromptFromContext,
	getOpeningPrompt,
	getRecoveryPrompt
} from '$lib/server/ai/narrative';
import { evaluateStorySanity } from '$lib/server/ai/sanity';
import {
	AiProviderError,
	type AiProvider,
	type GenerateImageInput,
	type GenerateSceneInput,
	type GeneratedImage,
	type ProviderProbeResult,
	isRetryableStatus
} from '$lib/server/ai/provider.interface';
import { emitAiServerTelemetry } from '$lib/server/ai/telemetry';

const XAI_CHAT_URL = 'https://api.x.ai/v1/chat/completions';
const XAI_IMAGE_URL = 'https://api.x.ai/v1/images/generations';

interface ChatChoice {
	message?: { content?: string | null };
}

interface ChatResponse {
	choices?: ChatChoice[];
	usage?: Record<string, unknown>;
}

interface SceneCandidate {
	sceneText?: unknown;
	choices?: Array<{ id?: unknown; text?: unknown; outcome?: unknown }>;
	lessonId?: unknown;
	imageKey?: unknown;
	imagePrompt?: unknown;
	isEnding?: unknown;
	endingType?: unknown;
	mood?: unknown;
	storyThreadUpdates?: Partial<StoryThreads> | null;
}

interface ChatCallResult {
	text: string;
	usage?: Record<string, unknown>;
	retryCount: number;
	latencyMs: number;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractJsonObject(text: string): string {
	const trimmed = text.trim();
	if (!trimmed) throw new Error('Empty provider response');

	const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
	if (fencedMatch?.[1]) return fencedMatch[1].trim();

	const first = trimmed.indexOf('{');
	const last = trimmed.lastIndexOf('}');
	if (first === -1 || last === -1 || last <= first) {
		throw new Error('No JSON object found in provider response');
	}
	return trimmed.slice(first, last + 1);
}

function normalizeChoiceId(text: string, index: number): string {
	const normalized = text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, 64);
	return normalized || `choice_${index + 1}`;
}

function normalizeScene(candidate: SceneCandidate, fallbackSceneId: string): Scene {
	const choices = Array.isArray(candidate.choices)
		? candidate.choices
				.map((choice, index) => {
					const text = typeof choice?.text === 'string' ? choice.text.trim() : '';
					if (!text) return null;
					const id =
						typeof choice.id === 'string' && /^[a-z0-9_-]{1,80}$/i.test(choice.id)
							? choice.id
							: normalizeChoiceId(text, index);
					return {
						id,
						text,
						outcome: typeof choice.outcome === 'string' ? choice.outcome : undefined
					};
				})
				.filter((value): value is NonNullable<typeof value> => value !== null)
		: [];

	const isEnding = Boolean(candidate.isEnding);
	const endingType = isEnding ? validateEndingType(candidate.endingType) : null;

	return {
		sceneId:
			typeof (candidate as { sceneId?: unknown }).sceneId === 'string'
				? ((candidate as { sceneId: string }).sceneId || fallbackSceneId)
				: fallbackSceneId,
		sceneText: typeof candidate.sceneText === 'string' ? candidate.sceneText.trim() : '',
		choices,
		lessonId: typeof candidate.lessonId === 'number' ? candidate.lessonId : null,
		imageKey: typeof candidate.imageKey === 'string' ? candidate.imageKey : 'hotel_room',
		imagePrompt: typeof candidate.imagePrompt === 'string' ? candidate.imagePrompt : undefined,
		isEnding,
		endingType,
		mood:
			typeof candidate.mood === 'string' &&
			['neutral', 'tense', 'hopeful', 'dark', 'triumphant'].includes(candidate.mood)
				? (candidate.mood as Scene['mood'])
				: undefined,
		storyThreadUpdates:
			candidate.storyThreadUpdates && typeof candidate.storyThreadUpdates === 'object'
				? candidate.storyThreadUpdates
				: null
	};
}

function buildScenePrompt(input: GenerateSceneInput, mode: 'opening' | 'next'): string {
	if (mode === 'opening') {
		return getOpeningPrompt();
	}

	if (input.narrativeContext) {
		return getContinuePromptFromContext(input.narrativeContext, null);
	}

	const lastChoice = input.gameState.history[input.gameState.history.length - 1];
	const previousScenes = (input.gameState.sceneLog || []).map((entry) =>
		entry.viaChoiceText ? `[Choice: ${entry.viaChoiceText}]\n${entry.sceneText}` : entry.sceneText
	);

	return getContinuePrompt(
		previousScenes,
		lastChoice?.choiceText || input.choiceId || '',
		input.gameState.sceneCount,
		null,
		input.gameState.storyThreads
	);
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
		let attempt = 0;
		const maxAttempts = this.config.maxRetries + 1;
		let lastError: unknown = null;

		while (attempt < maxAttempts) {
			const started = Date.now();
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);
			try {
				const response = await this.fetchImpl(XAI_CHAT_URL, {
					method: 'POST',
					headers: {
						'content-type': 'application/json',
						authorization: `Bearer ${this.config.xaiApiKey}`
					},
					body: JSON.stringify({
						model: this.config.grokTextModel,
						messages: [
							{ role: 'system', content: SYSTEM_PROMPT },
							{ role: 'user', content: prompt }
						],
						max_tokens: this.config.maxOutputTokens,
						temperature: 0.8
					}),
					signal: controller.signal
				});

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

				return {
					text,
					usage: payload.usage,
					retryCount: attempt,
					latencyMs: Date.now() - started
				};
			} catch (error) {
				lastError = error;
				const retryable =
					error instanceof AiProviderError
						? error.retryable
						: error instanceof Error && error.name === 'AbortError';
				if (!retryable || attempt >= maxAttempts - 1) break;
				const backoff = this.config.retryBackoffMs[Math.min(attempt, this.config.retryBackoffMs.length - 1)];
				await sleep(backoff);
			} finally {
				clearTimeout(timeout);
			}
			attempt += 1;
		}

		if (lastError instanceof AiProviderError) throw lastError;
		if (lastError instanceof Error && lastError.name === 'AbortError') {
			throw new AiProviderError('xAI request timed out', { code: 'timeout', retryable: true });
		}
		throw new AiProviderError('xAI request failed', { code: 'unknown', retryable: false });
	}

	private parseSceneCandidate(text: string): SceneCandidate {
		const json = extractJsonObject(text);
		return JSON.parse(json) as SceneCandidate;
	}

	private async callChat(prompt: string): Promise<{ scene: SceneCandidate; usage?: Record<string, unknown> }> {
		const first = await this.callChatRaw(prompt);
		try {
			const parsed = this.parseSceneCandidate(first.text);
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
		} catch {
			const recoveryPrompt = getRecoveryPrompt(first.text);
			const recovery = await this.callChatRaw(recoveryPrompt);
			try {
				const parsed = this.parseSceneCandidate(recovery.text);
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
			} catch {
				throw new AiProviderError('xAI chat parse recovery failed', {
					code: 'invalid_response',
					retryable: false
				});
			}
		}
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
			const normalized = normalizeScene(scene, fallbackSceneId);

			if (!validateScene(normalized)) {
				throw new AiProviderError('xAI scene failed contract validation', {
					code: 'invalid_response',
					retryable: false
				});
			}

			const sanity = evaluateStorySanity(normalized);
			lastSanityIssues = sanity.issues;
			if (sanity.ok) {
				return normalized;
			}

			const canRetryForDrift =
				sanity.blockingIssues.length === 0 && sanity.retryableIssues.length > 0 && attempt < maxSanityAttempts - 1;
			if (!canRetryForDrift) {
				break;
			}
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
		const lowerPrompt = input.prompt.toLowerCase();
		if (/oswaldo/.test(lowerPrompt) && /(face|bare skin|shirtless|nude|naked|skin exposed)/.test(lowerPrompt)) {
			throw new AiProviderError('Image prompt violates Oswaldo guardrail', {
				code: 'guardrail',
				retryable: false,
				status: 422
			});
		}
		if (!input.prompt.trim()) {
			throw new AiProviderError('Image prompt is empty', {
				code: 'invalid_response',
				retryable: false,
				status: 400
			});
		}

		let attempt = 0;
		const maxAttempts = this.config.maxRetries + 1;
		let lastError: unknown = null;

		while (attempt < maxAttempts) {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);
			try {
				const response = await this.fetchImpl(XAI_IMAGE_URL, {
					method: 'POST',
					headers: {
						'content-type': 'application/json',
						authorization: `Bearer ${this.config.xaiApiKey}`
					},
					body: JSON.stringify({
						model: this.config.grokImageModel,
						prompt: input.prompt
					}),
					signal: controller.signal
				});

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
			} catch (error) {
				lastError = error;
				const retryable =
					error instanceof AiProviderError
						? error.retryable
						: error instanceof Error && error.name === 'AbortError';
				if (!retryable || attempt >= maxAttempts - 1) break;
				const backoff = this.config.retryBackoffMs[Math.min(attempt, this.config.retryBackoffMs.length - 1)];
				await sleep(backoff);
			} finally {
				clearTimeout(timeout);
			}
			attempt += 1;
		}

		if (lastError instanceof AiProviderError) throw lastError;
		if (lastError instanceof Error && lastError.name === 'AbortError') {
			throw new AiProviderError('xAI image request timed out', {
				code: 'timeout',
				retryable: true,
				status: 504
			});
		}
		throw new AiProviderError('xAI image request failed', {
			code: 'unknown',
			retryable: false
		});
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
