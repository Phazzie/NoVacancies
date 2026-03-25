import type { GameState, NarrativeContext, Scene } from '$lib/contracts';
import type { StoryConfig } from '$lib/contracts/story';

export type AiProviderName = 'grok';
export type AiErrorCode =
	| 'timeout'
	| 'auth'
	| 'rate_limit'
	| 'provider_down'
	| 'invalid_response'
	| 'guardrail'
	| 'unknown';

export interface ProviderProbeResult {
	provider: AiProviderName;
	model: string;
	modelAvailable: boolean;
	authValid: boolean;
	latencyMs: number;
}

export interface GenerateSceneInput {
	currentSceneId: string | null;
	choiceId: string | null;
	gameState: GameState;
	narrativeContext?: NarrativeContext | null;
	storyConfig: StoryConfig;
}

export interface GenerateImageInput {
	prompt: string;
}

export interface GeneratedImage {
	url?: string;
	b64?: string;
}

export interface AiProvider {
	readonly name: AiProviderName;
	getOpeningScene(input: GenerateSceneInput): Promise<Scene>;
	getNextScene(input: GenerateSceneInput): Promise<Scene>;
	generateImage?(input: GenerateImageInput): Promise<GeneratedImage>;
	probe?(): Promise<ProviderProbeResult>;
	isAvailable?(): boolean;
}

export class AiProviderError extends Error {
	readonly code: AiErrorCode;
	readonly retryable: boolean;
	readonly status?: number;

	constructor(message: string, options: { code: AiErrorCode; retryable: boolean; status?: number }) {
		super(message);
		this.name = 'AiProviderError';
		this.code = options.code;
		this.retryable = options.retryable;
		this.status = options.status;
	}
}

export function isRetryableStatus(status: number): boolean {
	return status === 408 || status === 429 || status >= 500;
}
