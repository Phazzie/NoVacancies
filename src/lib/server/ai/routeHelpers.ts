import { json, type RequestEvent } from '@sveltejs/kit';
import { createGameState, type GameState, type NarrativeContext } from '$lib/contracts';
import { loadAiConfig } from '$lib/server/ai/config';
import { createProviderRegistry, selectImageProvider, selectTextProvider } from '$lib/server/ai/providers';
import { AiProviderError, type GenerateSceneInput } from '$lib/server/ai/provider.interface';
import { emitAiServerTelemetry, sanitizeForErrorMessage } from '$lib/server/ai/telemetry';
import { assertImagePromptGuardrails } from '$lib/server/ai/guardrails';

export interface NextRoutePayload {
	currentSceneId?: string;
	choiceId?: string;
	gameState?: GameState;
	narrativeContext?: NarrativeContext | null;
}

export function buildOpeningInput(): GenerateSceneInput {
	const gameState = createGameState();
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
