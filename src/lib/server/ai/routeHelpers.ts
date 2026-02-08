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
		useMocks: payload.useMocks ?? false,
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

function shouldBypassAuthError(error: unknown, authBypass: boolean): boolean {
	return authBypass && error instanceof AiProviderError && error.code === 'auth';
}

function shouldFallbackToMock(
	error: unknown,
	authBypass: boolean,
	providerName: string,
	outageMode: 'mock_fallback' | 'hard_fail'
): boolean {
	if (providerName === 'mock' || outageMode !== 'mock_fallback') return false;
	if (!(error instanceof AiProviderError)) return true;
	if (error.code === 'auth') return authBypass;
	return true;
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
		const bypassedAuth = shouldBypassAuthError(error, config.aiAuthBypass);
		const shouldFallback = shouldFallbackToMock(
			error,
			config.aiAuthBypass,
			provider.name,
			config.outageMode
		);

		if (bypassedAuth) {
			emitAiServerTelemetry('auth_bypass_used', {
				mode,
				provider: provider.name
			});
		}

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
	assertImagePromptGuardrails(prompt);

	const config = loadAiConfig();
	const registry = createProviderRegistry(config);
	const provider = selectImageProvider(config, registry);

	try {
		return await provider.generateImage?.({ prompt });
	} catch (error) {
		const bypassedAuth = shouldBypassAuthError(error, config.aiAuthBypass);
		const shouldFallback = shouldFallbackToMock(
			error,
			config.aiAuthBypass,
			provider.name,
			config.outageMode
		);
		if (bypassedAuth) {
			emitAiServerTelemetry('auth_bypass_used', {
				mode: 'image',
				provider: provider.name
			});
		}
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

function mapErrorStatus(error: unknown, fallbackStatus = 500): number {
	if (!(error instanceof AiProviderError)) return fallbackStatus;
	if (typeof error.status === 'number') return error.status;
	switch (error.code) {
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
