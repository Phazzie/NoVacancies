import type { GameState, NarrativeContext, Scene, StoryThreads } from '$lib/contracts';

export interface OpeningSceneRequest {
	useMocks: boolean;
	featureFlags?: GameState['featureFlags'];
}

export interface StoryServiceOptions {
	useNarrativeContext?: boolean;
	previousThreads?: StoryThreads;
	enableTransitionBridges?: boolean;
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
	const response = await fetchImpl(url, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(payload)
	});

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
					useMocks: request?.useMocks ?? true,
					featureFlags: request?.featureFlags ?? null
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
				options
			});
			return ensureSceneShape(payload.scene, '/story/next');
		},
		async getRecoveryScene() {
			const payload = await postJson<{ scene: unknown }>(
				fetchImpl,
				endpoint('/story/opening'),
				{ useMocks: true }
			);
			return ensureSceneShape(payload.scene, '/story/opening');
		},
		isAvailable() {
			return true;
		}
	};
}
