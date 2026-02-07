import { json, type RequestEvent } from '@sveltejs/kit';
import { createGameState, type GameState, type NarrativeContext, type RuntimeFeatureFlags } from '$lib/contracts';
import { loadAiConfig } from '$lib/server/ai/config';
import { createProviderRegistry, selectImageProvider, selectTextProvider } from '$lib/server/ai/providers';
import { AiProviderError, type GenerateSceneInput } from '$lib/server/ai/provider.interface';
import { emitAiServerTelemetry, sanitizeForErrorMessage } from '$lib/server/ai/telemetry';

export interface NextRoutePayload {
	currentSceneId?: string;
	choiceId?: string;
	gameState?: GameState;
	narrativeContext?: NarrativeContext | null;
}

function safeFeatureFlags(value: unknown): Partial<RuntimeFeatureFlags> {
	if (!value || typeof value !== 'object') return {};
	return value as Partial<RuntimeFeatureFlags>;
}

export function buildOpeningInput(payload: {
	useMocks?: boolean;
	featureFlags?: unknown;
}): GenerateSceneInput {
	const gameState = createGameState({
		useMocks: payload.useMocks ?? true,
		featureFlags: safeFeatureFlags(payload.featureFlags)
	});
	return {
		currentSceneId: null,
		choiceId: null,
		gameState
	};
}

export function buildNextInput(payload: NextRoutePayload): GenerateSceneInput {
	const baseState = payload.gameState ?? createGameState();
	return {
		currentSceneId: payload.currentSceneId ?? baseState.currentSceneId,
		choiceId: payload.choiceId ?? null,
		gameState: baseState,
		narrativeContext: payload.narrativeContext ?? null
	};
}

export async function resolveTextScene(input: GenerateSceneInput, mode: 'opening' | 'next') {
	const config = loadAiConfig();
	const registry = createProviderRegistry(config);
	const provider = selectTextProvider(config, registry, input.gameState);

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
		const shouldFallback =
			provider.name !== 'mock' &&
			config.outageMode === 'mock_fallback' &&
			(error instanceof AiProviderError ? error.code !== 'auth' || !input.gameState.useMocks : true);

		if (shouldFallback) {
			emitAiServerTelemetry('story_fallback', {
				from: provider.name,
				to: 'mock',
				mode,
				error: sanitizeForErrorMessage(error)
			});
			return mode === 'opening'
				? registry.mock.getOpeningScene(input)
				: registry.mock.getNextScene(input);
		}
		throw error;
	}
}

export async function resolveImagePayload(prompt: string) {
	const config = loadAiConfig();
	const registry = createProviderRegistry(config);
	const provider = selectImageProvider(config, registry);

	try {
		return await provider.generateImage?.({ prompt });
	} catch (error) {
		const shouldFallback = provider.name !== 'mock' && config.outageMode === 'mock_fallback';
		if (shouldFallback) {
			emitAiServerTelemetry('image_fallback', {
				from: provider.name,
				to: 'mock',
				error: sanitizeForErrorMessage(error)
			});
			return registry.mock.generateImage?.({ prompt });
		}
		throw error;
	}
}

export function asRouteError(event: RequestEvent, error: unknown, status = 500) {
	const message = sanitizeForErrorMessage(error);
	emitAiServerTelemetry('route_error', {
		route: event.url.pathname,
		error: message,
		status
	});
	return json({ error: message }, { status });
}

