import { loadAiConfig, type AiConfig } from '$lib/server/ai/config';
import { createProviderRegistry, selectImageProvider } from '$lib/server/ai/providers';
import { AiProviderError, type AiErrorCode, type GeneratedImage } from '$lib/server/ai/provider.interface';

export type ImageGenerationState = 'queued' | 'running' | 'success' | 'failed';
export type CreatorImageAction =
	| 'generate'
	| 'regenerate'
	| 'accept'
	| 'reject'
	| 'fallback_to_static';

export type ImageRetryReasonCode =
	| AiErrorCode
	| 'network_error'
	| 'aborted'
	| 'invalid_prompt'
	| 'image_disabled';

export interface ImageRetryAttempt {
	attempt: number;
	reasonCode: ImageRetryReasonCode;
	retryable: boolean;
	message: string;
	timestamp: string;
}

export interface ImageRequestRecord {
	requestId: string;
	prompt: string;
	cacheKey: string;
	status: ImageGenerationState;
	action: CreatorImageAction;
	createdAt: string;
	updatedAt: string;
	retry: {
		attemptCount: number;
		maxAttempts: number;
		reasons: ImageRetryAttempt[];
	};
	result: GeneratedImage | null;
	error: {
		reasonCode: ImageRetryReasonCode;
		message: string;
	} | null;
	decision: 'accepted' | 'rejected' | 'fallback_to_static' | null;
	cacheHit: boolean;
}

export interface ImagePipelineSummary {
	inFlight: number;
	totalRequests: number;
	successCount: number;
	failedCount: number;
	cacheEntries: number;
	lastUpdatedAt: string | null;
	recentRequests: ImageRequestRecord[];
	configError?: string | null;
}

interface ImagePipelineDependencies {
	config?: AiConfig;
	generateImage?: (prompt: string) => Promise<GeneratedImage>;
	now?: () => number;
}

const MAX_HISTORY = 120;

function nextRequestId(now: number): string {
	return `img_${now}_${Math.random().toString(36).slice(2, 8)}`;
}

function toIso(now: number): string {
	return new Date(now).toISOString();
}

function hashPrompt(value: string): string {
	let hash = 0;
	for (let i = 0; i < value.length; i += 1) {
		hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
	}
	return hash.toString(16).padStart(8, '0');
}

export function buildImageCacheKey(prompt: string, modelHint: string): string {
	const normalizedPrompt = prompt.trim().replace(/\s+/g, ' ').toLowerCase();
	return `img:${modelHint}:${hashPrompt(normalizedPrompt)}`;
}

function mapReasonCode(error: unknown): ImageRetryReasonCode {
	if (error instanceof AiProviderError) return error.code;
	if (error instanceof Error && error.name === 'AbortError') return 'aborted';
	if (error instanceof Error && /network|fetch|econn|enotfound/i.test(error.message)) {
		return 'network_error';
	}
	return 'unknown';
}

function isRetryable(error: unknown): boolean {
	if (error instanceof AiProviderError) return error.retryable;
	if (error instanceof Error && error.name === 'AbortError') return true;
	return false;
}

export function toGuardrailSafeImageMessage(reasonCode: ImageRetryReasonCode): string {
	switch (reasonCode) {
		case 'guardrail':
			return 'Image request blocked by safety guardrails. Adjust the prompt and try again.';
		case 'auth':
			return 'Image generation is unavailable due to provider authentication issues.';
		case 'rate_limit':
			return 'Image generation is temporarily rate-limited. Try again shortly.';
		case 'timeout':
		case 'aborted':
			return 'Image generation timed out before completion. Try again.';
		case 'provider_down':
			return 'Image generation provider is unavailable right now.';
		case 'invalid_response':
			return 'Image provider returned an invalid response. Please retry.';
		case 'image_disabled':
			return 'Dynamic image generation is disabled. Use fallback-to-static.';
		case 'network_error':
			return 'Image generation could not reach the provider network endpoint.';
		case 'invalid_prompt':
			return 'Image prompt is required.';
		default:
			return 'Image generation failed due to an unexpected provider error.';
	}
}

export class ImagePipeline {
	private readonly config: AiConfig;
	private readonly configError: string | null;
	private readonly generateImage: (prompt: string) => Promise<GeneratedImage>;
	private readonly now: () => number;
	private readonly requests = new Map<string, ImageRequestRecord>();
	private readonly requestOrder: string[] = [];
	private readonly cache = new Map<string, string>();

	constructor(deps: ImagePipelineDependencies = {}) {
		if (deps.config) {
			this.config = deps.config;
			this.configError = null;
		} else {
			try {
				this.config = loadAiConfig();
				this.configError = null;
			} catch (error) {
				this.config = {
					provider: 'grok',
					enableGrokText: true,
					enableGrokImages: false,
					enableProviderProbe: false,
					aiAuthBypass: false,
					outageMode: 'hard_fail',
					xaiApiKey: '',
					grokTextModel: 'grok-4-1-fast-reasoning',
					grokImageModel: 'grok-imagine-image',
					maxOutputTokens: 1800,
					requestTimeoutMs: 20000,
					maxRetries: 2,
					retryBackoffMs: [400, 1200]
				};
				this.configError = error instanceof Error ? error.message : 'Invalid AI config';
			}
		}
		if (deps.generateImage) {
			this.generateImage = deps.generateImage;
		} else {
			this.generateImage = async (prompt: string) => {
				const provider = selectImageProvider(this.config, createProviderRegistry(this.config));
				if (!provider.generateImage) {
					throw new Error('Selected image provider does not implement generateImage');
				}
				return provider.generateImage({ prompt });
			};
		}
		this.now = deps.now ?? (() => Date.now());
	}

	private modelHint(): string {
		return this.config.grokImageModel || 'image-model';
	}

	private touchRecord(record: ImageRequestRecord): void {
		record.updatedAt = toIso(this.now());
	}

	private addRecord(record: ImageRequestRecord): void {
		this.requests.set(record.requestId, record);
		this.requestOrder.unshift(record.requestId);
		if (this.requestOrder.length > MAX_HISTORY) {
			const dropped = this.requestOrder.pop();
			if (dropped) this.requests.delete(dropped);
		}
	}

	private getFromCache(cacheKey: string): ImageRequestRecord | null {
		const requestId = this.cache.get(cacheKey);
		if (!requestId) return null;
		const cached = this.requests.get(requestId);
		if (!cached || cached.status !== 'success') return null;
		return cached;
	}

	private createQueuedRecord(prompt: string, cacheKey: string, action: CreatorImageAction): ImageRequestRecord {
		const now = this.now();
		const record: ImageRequestRecord = {
			requestId: nextRequestId(now),
			prompt,
			cacheKey,
			status: 'queued',
			action,
			createdAt: toIso(now),
			updatedAt: toIso(now),
			retry: {
				attemptCount: 0,
				maxAttempts: this.config.maxRetries + 1,
				reasons: []
			},
			result: null,
			error: null,
			decision: null,
			cacheHit: false
		};
		this.addRecord(record);
		return record;
	}

	private clone(record: ImageRequestRecord): ImageRequestRecord {
		return {
			...record,
			retry: {
				...record.retry,
				reasons: [...record.retry.reasons]
			},
			result: record.result ? { ...record.result } : null,
			error: record.error ? { ...record.error } : null
		};
	}

	private async runGeneration(record: ImageRequestRecord): Promise<ImageRequestRecord> {
		record.status = 'running';
		this.touchRecord(record);

		for (let attempt = 1; attempt <= record.retry.maxAttempts; attempt += 1) {
			record.retry.attemptCount = attempt;
			try {
				const image = await this.generateImage(record.prompt);
				record.status = 'success';
				record.result = image;
				record.error = null;
				this.cache.set(record.cacheKey, record.requestId);
				this.touchRecord(record);
				return this.clone(record);
			} catch (error) {
				const reasonCode = mapReasonCode(error);
				const retryable = isRetryable(error);
				record.retry.reasons.push({
					attempt,
					reasonCode,
					retryable,
					message: toGuardrailSafeImageMessage(reasonCode),
					timestamp: toIso(this.now())
				});
				if (!retryable || attempt >= record.retry.maxAttempts) {
					record.status = 'failed';
					record.error = {
						reasonCode,
						message: toGuardrailSafeImageMessage(reasonCode)
					};
					record.result = null;
					this.touchRecord(record);
					return this.clone(record);
				}
			}
		}

		record.status = 'failed';
		record.error = {
			reasonCode: 'unknown',
			message: toGuardrailSafeImageMessage('unknown')
		};
		this.touchRecord(record);
		return this.clone(record);
	}

	async generate(prompt: string, action: 'generate' | 'regenerate' = 'generate'): Promise<ImageRequestRecord> {
		const normalizedPrompt = prompt.trim();
		if (!normalizedPrompt) {
			const now = this.now();
			return {
				requestId: nextRequestId(now),
				prompt: normalizedPrompt,
				cacheKey: '',
				status: 'failed',
				action,
				createdAt: toIso(now),
				updatedAt: toIso(now),
				retry: { attemptCount: 0, maxAttempts: 0, reasons: [] },
				result: null,
				error: {
					reasonCode: 'invalid_prompt',
					message: toGuardrailSafeImageMessage('invalid_prompt')
				},
				decision: null,
				cacheHit: false
			};
		}

		if (!this.config.enableGrokImages) {
			const now = this.now();
			return {
				requestId: nextRequestId(now),
				prompt: normalizedPrompt,
				cacheKey: buildImageCacheKey(normalizedPrompt, this.modelHint()),
				status: 'failed',
				action,
				createdAt: toIso(now),
				updatedAt: toIso(now),
				retry: { attemptCount: 0, maxAttempts: 0, reasons: [] },
				result: null,
				error: {
					reasonCode: 'image_disabled',
					message: toGuardrailSafeImageMessage('image_disabled')
				},
				decision: 'fallback_to_static',
				cacheHit: false
			};
		}

		const cacheKey = buildImageCacheKey(normalizedPrompt, this.modelHint());
		if (action === 'generate') {
			const cached = this.getFromCache(cacheKey);
			if (cached) {
				const copy = this.clone(cached);
				copy.cacheHit = true;
				return copy;
			}
		}

		const queued = this.createQueuedRecord(normalizedPrompt, cacheKey, action);
		return this.runGeneration(queued);
	}

	applyDecision(requestId: string, decision: 'accepted' | 'rejected' | 'fallback_to_static'): ImageRequestRecord | null {
		const record = this.requests.get(requestId);
		if (!record) return null;
		record.decision = decision;
		this.touchRecord(record);
		return this.clone(record);
	}

	getRequest(requestId: string): ImageRequestRecord | null {
		const record = this.requests.get(requestId);
		return record ? this.clone(record) : null;
	}

	summary(limit = 25): ImagePipelineSummary {
		const ordered = this.requestOrder
			.slice(0, limit)
			.map((id) => this.requests.get(id))
			.filter((record): record is ImageRequestRecord => Boolean(record));
		const recent = ordered.map((record) => this.clone(record));
		const successCount = [...this.requests.values()].filter((record) => record.status === 'success').length;
		const failedCount = [...this.requests.values()].filter((record) => record.status === 'failed').length;
		const inFlight = [...this.requests.values()].filter(
			(record) => record.status === 'queued' || record.status === 'running'
		).length;
		return {
			inFlight,
			totalRequests: this.requests.size,
			successCount,
			failedCount,
			cacheEntries: this.cache.size,
			lastUpdatedAt: recent[0]?.updatedAt ?? null,
			recentRequests: recent,
			configError: this.configError
		};
	}
}

let singleton: ImagePipeline | null = null;

export function getImagePipeline(): ImagePipeline {
	if (!singleton) {
		singleton = new ImagePipeline();
	}
	return singleton;
}
