import { json, type RequestEvent } from '@sveltejs/kit';
import { createGameState, type GameState, type NarrativeContext } from '$lib/contracts';
import { getActiveStoryCartridge } from '$lib/stories';
import { loadAiConfig } from '$lib/server/ai/config';
import {
	createProviderRegistry,
	selectImageProvider,
	selectTextProvider
} from '$lib/server/ai/providers';
import type { AiErrorCode } from '$lib/server/ai/provider.interface';
import { type GenerateSceneInput } from '$lib/server/ai/provider.interface';
import { emitAiServerTelemetry, sanitizeForErrorMessage } from '$lib/server/ai/telemetry';
import { assertImagePromptGuardrails } from '$lib/server/ai/guardrails';

export interface NextRoutePayload {
	currentSceneId?: string;
	choiceId?: string;
	gameState?: GameState;
	narrativeContext?: NarrativeContext | null;
}

export function buildOpeningInput(): GenerateSceneInput {
	const cartridge = getActiveStoryCartridge();
	const gameState = createGameState({
		initialSceneId: cartridge.initialSceneId,
		initialStoryThreads: cartridge.createInitialStoryThreads()
	});
	return {
		currentSceneId: null,
		choiceId: null,
		gameState
	};
}

export function buildNextInput(payload: NextRoutePayload): GenerateSceneInput {
	const cartridge = getActiveStoryCartridge();
	const baseState =
		payload.gameState ??
		createGameState({
			initialSceneId: cartridge.initialSceneId,
			initialStoryThreads: cartridge.createInitialStoryThreads()
		});
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
			mode === 'opening'
				? await provider.getOpeningScene(input)
				: await provider.getNextScene(input);
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

function mapErrorCode(error: unknown): AiErrorCode | 'config_missing' | 'xai_api_key' | 'unknown' {
	const typed = error as { code?: unknown; message?: unknown };
	if (typeof typed.code === 'string' && typed.code.trim()) {
		return typed.code as AiErrorCode;
	}
	const rawMessage = typeof typed.message === 'string' ? typed.message : '';
	const normalized = rawMessage.toLowerCase();
	if (normalized.includes('xai_api_key')) return 'xai_api_key';
	if (normalized.includes('required in grok-only mode')) return 'config_missing';
	return 'unknown';
}

export function asRouteError(event: RequestEvent, error: unknown, status = 500) {
	const message = sanitizeForErrorMessage(error);
	const resolvedStatus = mapErrorStatus(error, status);
	const code = mapErrorCode(error);
	emitAiServerTelemetry('route_error', {
		route: event.url.pathname,
		error: message,
		code,
		status: resolvedStatus
	});
	return json({ error: message, code, status: resolvedStatus }, { status: resolvedStatus });
}
