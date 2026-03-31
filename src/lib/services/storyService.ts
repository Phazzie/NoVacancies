import type { GameState, NarrativeContext, Scene, StoryThreads } from '../contracts';
import { appendDebugError } from '../debug/errorLog';

export interface StoryServiceOptions {
	previousThreads?: StoryThreads;
	enableTransitionBridges?: boolean;
}

export interface StoryService {
	getOpeningScene(): Promise<Scene>;
	getNextScene(
		currentSceneId: string,
		choiceId: string,
		gameState: GameState,
		narrativeContext?: NarrativeContext | null,
		options?: StoryServiceOptions
	): Promise<Scene>;
	getRecoveryScene?(): Promise<Scene>;
	getSceneById?(sceneId: string): Scene | undefined;
	isAvailable?(): boolean;
}

export interface ApiStoryServiceConfig {
	basePath?: string;
	fetchImpl?: typeof fetch;
}

export interface ApiStoryServiceError {
	code: string;
	status?: number;
	message: string;
}

function toApiStoryServiceError(input: {
	code?: unknown;
	status?: unknown;
	message?: unknown;
}): ApiStoryServiceError {
	const message =
		typeof input.message === 'string' && input.message.trim()
			? input.message
			: 'request failed';
	const status = typeof input.status === 'number' ? input.status : undefined;
	const code = typeof input.code === 'string' && input.code.trim() ? input.code : 'unknown';
	return { code, status, message };
}

function ensureSceneShape(candidate: unknown, endpoint: string): Scene {
	if (!candidate || typeof candidate !== 'object') {
		throw new Error(`${endpoint} returned invalid payload`);
	}
	const scene = candidate as Scene;
	if (
		typeof scene.sceneId !== 'string' ||
		typeof scene.sceneText !== 'string' ||
		!Array.isArray(scene.choices)
	) {
		throw new Error(`${endpoint} returned invalid scene contract`);
	}
	return scene;
}

async function postJson<TResponse>(
	fetchImpl: typeof fetch,
	url: string,
	payload: Record<string, unknown>
): Promise<TResponse> {
	let response: Response;
	try {
		response = await fetchImpl(url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : String(error ?? 'Unknown network error');
		appendDebugError({
			scope: 'api.network',
			message: 'Network request failed',
			details: {
				url,
				error: message
			}
		});
		throw toApiStoryServiceError({
			code: 'network',
			message
		});
	}

	let body: unknown = null;
	try {
		body = await response.json();
	} catch {
		body = null;
	}

	if (!response.ok) {
		const routeError =
			body && typeof body === 'object'
				? toApiStoryServiceError({
						code: (body as { code?: unknown }).code,
						status: (body as { status?: unknown }).status ?? response.status,
						message: (body as { error?: unknown }).error
					})
				: toApiStoryServiceError({
						code: response.status >= 500 ? 'http_error' : 'unknown',
						status: response.status,
						message: `request failed (${response.status})`
					});
		appendDebugError({
			scope: 'api.http',
			message: routeError.message,
			details: {
				url,
				status: response.status,
				statusText: response.statusText,
				code: routeError.code
			}
		});
		throw routeError;
	}

	return body as TResponse;
}

export function createApiStoryService(config: ApiStoryServiceConfig = {}): StoryService {
	const basePath = config.basePath ?? '/api';
	const fetchImpl = config.fetchImpl ?? fetch;

	const endpoint = (path: string): string => `${basePath}${path}`;

	return {
		async getOpeningScene() {
			const payload = await postJson<{ scene: unknown }>(
				fetchImpl,
				endpoint('/story/opening'),
				{}
			);
			return ensureSceneShape(payload.scene, '/story/opening');
		},
		async getNextScene(currentSceneId, choiceId, gameState, narrativeContext = null, options = {}) {
			// sceneLog intentionally omitted — server uses narrativeContext + selected top-level state only
			const { sceneLog: _sceneLog, ...gameStateForTransmission } = gameState;
			const payload = await postJson<{ scene: unknown }>(fetchImpl, endpoint('/story/next'), {
				currentSceneId,
				choiceId,
				gameState: gameStateForTransmission,
				narrativeContext,
				options
			});
			return ensureSceneShape(payload.scene, '/story/next');
		},
		async getRecoveryScene() {
			const payload = await postJson<{ scene: unknown }>(
				fetchImpl,
				endpoint('/story/opening'),
				{}
			);
			return ensureSceneShape(payload.scene, '/story/opening');
		},
		isAvailable() {
			return true;
		}
	};
}
