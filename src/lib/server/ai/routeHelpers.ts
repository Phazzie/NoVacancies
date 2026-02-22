import { json, type RequestEvent } from '@sveltejs/kit';
import { createGameState, type GameState, type NarrativeContext, type RuntimeFeatureFlags } from '$lib/contracts';
import { loadAiConfig } from '$lib/server/ai/config';
import { createProviderRegistry, selectImageProvider, selectTextProvider } from '$lib/server/ai/providers';
import { AiProviderError, type GenerateSceneInput } from '$lib/server/ai/provider.interface';
import { emitAiServerTelemetry, sanitizeForErrorMessage } from '$lib/server/ai/telemetry';
import { NO_VACANCIES_STORY } from '$lib/data/defaultStory';
import type { StoryConfig } from '$lib/contracts/story';

export interface NextRoutePayload {
	currentSceneId?: string;
	choiceId?: string;
	gameState?: GameState;
	narrativeContext?: NarrativeContext | null;
	storyId?: string;
	storyConfig?: StoryConfig;
}

/**
 * Normalize an arbitrary value into a Partial<RuntimeFeatureFlags>.
 *
 * @param value - The value to validate and cast; may be any type.
 * @returns The input cast as `Partial<RuntimeFeatureFlags>` when `value` is an object, otherwise an empty object.
 */
function safeFeatureFlags(value: unknown): Partial<RuntimeFeatureFlags> {
	if (!value || typeof value !== 'object') return {};
	return value as Partial<RuntimeFeatureFlags>;
}

/**
 * Resolve the StoryConfig to use for generation, preferring an explicit config and falling back to the default story.
 *
 * @param storyId - Optional story identifier (currently unused; reserved for future DB/file lookup).
 * @param config - Optional StoryConfig to use directly.
 * @returns The provided `config` if present; otherwise the default `NO_VACANCIES_STORY`.
 */
function resolveStoryConfig(storyId?: string, config?: StoryConfig): StoryConfig {
	if (config) return config;
	// Future: look up storyId in DB/File system
	// For now, always return default
	return NO_VACANCIES_STORY;
}

/**
 * Build the initial GenerateSceneInput for starting a story session.
 *
 * @param payload - Options used to create the opening input.
 * @param payload.featureFlags - Arbitrary runtime feature flags; non-object values are treated as empty.
 * @param payload.storyId - Optional story identifier used to resolve a story configuration when `storyConfig` is not provided.
 * @param payload.storyConfig - Optional explicit story configuration to use instead of resolving by `storyId`.
 * @returns A GenerateSceneInput with null `currentSceneId` and `choiceId`, a fresh `gameState`, and a resolved `storyConfig`.
 */
export function buildOpeningInput(payload: { featureFlags?: unknown; storyId?: string; storyConfig?: StoryConfig }): GenerateSceneInput {
	const gameState = createGameState({
		featureFlags: safeFeatureFlags(payload.featureFlags)
	});
	return {
		currentSceneId: null,
		choiceId: null,
		gameState,
		storyConfig: resolveStoryConfig(payload.storyId, payload.storyConfig)
	};
}

/**
 * Constructs the GenerateSceneInput used to advance to the next scene from a route payload.
 *
 * @param payload - Route payload containing optional navigation fields (currentSceneId, choiceId, gameState, narrativeContext, storyId, storyConfig)
 * @returns An input object whose `currentSceneId` is taken from the payload or the base game state, `choiceId` is taken from the payload or set to `null`, `gameState` is the provided state or a newly created one, `narrativeContext` is taken from the payload or set to `null`, and `storyConfig` is resolved from the provided `storyConfig` or `storyId` (falling back to the default story configuration)
 */
export function buildNextInput(payload: NextRoutePayload): GenerateSceneInput {
	const baseState = payload.gameState ?? createGameState();
	return {
		currentSceneId: payload.currentSceneId ?? baseState.currentSceneId,
		choiceId: payload.choiceId ?? null,
		gameState: baseState,
		narrativeContext: payload.narrativeContext ?? null,
		storyConfig: resolveStoryConfig(payload.storyId, payload.storyConfig)
	};
}

function assertImagePromptGuardrails(prompt: string): void {
	const lower = prompt.toLowerCase();
	if (!lower.trim()) {
		throw new AiProviderError('image prompt is required', {
			code: 'invalid_response',
			retryable: false,
			status: 400
		});
	}
	if (/oswaldo/.test(lower) && /(face|bare skin|shirtless|nude|naked|skin exposed)/.test(lower)) {
		throw new AiProviderError('image prompt violates Oswaldo guardrail', {
			code: 'guardrail',
			retryable: false,
			status: 422
		});
	}
}

export async function resolveTextScene(input: GenerateSceneInput, mode: 'opening' | 'next') {
	const config = loadAiConfig();
	const registry = createProviderRegistry(config);
	const provider = selectTextProvider(config, registry);

	try {
		const scene =
			mode === 'opening' ? await provider.getOpeningScene(input) : await provider.getNextScene(input);
		emitAiServerTelemetry('story_scene', {
			provider: provider.name,
			mode,
			requestId: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
			retryCount: 0,
			parseAttempts: 1,
			route: mode
		});
		return scene;
	} catch (error) {
		throw error;
	}
}

export async function resolveImagePayload(prompt: string) {
	assertImagePromptGuardrails(prompt);

	const config = loadAiConfig();
	const registry = createProviderRegistry(config);
	const provider = selectImageProvider(config, registry);

	try {
		return await provider.generateImage?.({ prompt });
	} catch (error) {
		throw error;
	}
}

function mapErrorStatus(error: unknown, fallbackStatus = 500): number {
	const typed = error as { status?: unknown; code?: unknown };
	if (typeof typed.status === 'number') return typed.status;
	switch (typed.code) {
		case 'auth':
			return 401;
		case 'rate_limit':
			return 429;
		case 'timeout':
			return 504;
		case 'provider_down':
			return 503;
		case 'invalid_response':
			return 502;
		case 'guardrail':
			return 422;
		default:
			return fallbackStatus;
	}
}

export function asRouteError(event: RequestEvent, error: unknown, status = 500) {
	const message = sanitizeForErrorMessage(error);
	const resolvedStatus = mapErrorStatus(error, status);
	emitAiServerTelemetry('route_error', {
		route: event.url.pathname,
		error: message,
		status: resolvedStatus
	});
	return json({ error: message }, { status: resolvedStatus });
}