import type { GameState, NarrativeContext, Scene, StoryThreads } from '../contracts';
import type { StoryConfig } from '../contracts/story';
import { appendDebugError } from '../debug/errorLog';

export interface OpeningSceneRequest {
	featureFlags?: GameState['featureFlags'];
	storyId?: string;
	storyConfig?: StoryConfig;
}

export interface StoryServiceOptions {
	useNarrativeContext?: boolean;
	previousThreads?: StoryThreads;
	enableTransitionBridges?: boolean;
	storyConfig?: StoryConfig;
}

export interface StoryService {
	getOpeningScene(request?: OpeningSceneRequest): Promise<Scene>;
	getNextScene(
		currentSceneId: string,
		choiceId: string,
		gameState: GameState,
		narrativeContext?: NarrativeContext | null,
		options?: StoryServiceOptions
	): Promise<Scene>;
	getStoryConfig?(storyId?: string): Promise<StoryConfig>;
	getRecoveryScene?(): Promise<Scene>;
	getSceneById?(sceneId: string): Scene | undefined;
	isAvailable?(): boolean;
}

export interface ApiStoryServiceConfig {
	basePath?: string;
	fetchImpl?: typeof fetch;
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
		appendDebugError({
			scope: 'api.network',
			message: 'Network request failed',
			details: {
				url,
				error: error instanceof Error ? error.message : String(error ?? 'Unknown network error')
			}
		});
		throw error;
	}

	let body: unknown = null;
	try {
		body = await response.json();
	} catch {
		body = null;
	}

	if (!response.ok) {
		const message =
			typeof (body as { error?: unknown } | null)?.error === 'string'
				? ((body as { error: string }).error ?? 'request failed')
				: `request failed (${response.status})`;
		appendDebugError({
			scope: 'api.http',
			message,
			details: {
				url,
				status: response.status,
				statusText: response.statusText
			}
		});
		throw new Error(message);
	}

	return body as TResponse;
}

export function createApiStoryService(config: ApiStoryServiceConfig = {}): StoryService {
	const basePath = config.basePath ?? '/api';
	const fetchImpl = config.fetchImpl ?? fetch;

	const endpoint = (path: string): string => `${basePath}${path}`;

	return {
		async getOpeningScene(request) {
			const payload = await postJson<{ scene: unknown }>(
				fetchImpl,
				endpoint('/story/opening'),
				{
					featureFlags: request?.featureFlags ?? null,
					storyId: request?.storyId,
					storyConfig: request?.storyConfig
				}
			);
			return ensureSceneShape(payload.scene, '/story/opening');
		},
		async getNextScene(currentSceneId, choiceId, gameState, narrativeContext = null, options = {}) {
			const payload = await postJson<{ scene: unknown }>(fetchImpl, endpoint('/story/next'), {
				currentSceneId,
				choiceId,
				gameState,
				narrativeContext,
				storyId: gameState.storyId,
				storyConfig: options.storyConfig,
				options: {
					useNarrativeContext: options.useNarrativeContext,
					previousThreads: options.previousThreads,
					enableTransitionBridges: options.enableTransitionBridges
				}
			});
			return ensureSceneShape(payload.scene, '/story/next');
		},
		async getStoryConfig(storyId) {
			const payload = await postJson<{ config: StoryConfig }>(
				fetchImpl,
				endpoint('/story/config'),
				{ storyId }
			);
			return payload.config;
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
