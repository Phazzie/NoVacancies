import {
    parseScene,
    type GameState,
    type NarrativeContext,
    type Scene,
    type StoryThreads
} from '../contracts';
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
                error:
                    error instanceof Error
                        ? error.message
                        : String(error ?? 'Unknown network error')
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
        async getOpeningScene() {
            const payload = await postJson<{ scene: unknown }>(
                fetchImpl,
                endpoint('/story/opening'),
                {}
            );
            return parseScene(payload.scene, '/story/opening');
        },
        async getNextScene(
            currentSceneId,
            choiceId,
            gameState,
            narrativeContext = null,
            options = {}
        ) {
            // sceneLog intentionally omitted — server uses narrativeContext + selected top-level state only
            const { sceneLog: _sceneLog, ...gameStateForTransmission } = gameState;
            const payload = await postJson<{ scene: unknown }>(fetchImpl, endpoint('/story/next'), {
                currentSceneId,
                choiceId,
                gameState: gameStateForTransmission,
                narrativeContext,
                options
            });
            return parseScene(payload.scene, '/story/next');
        },
        async getRecoveryScene() {
            const payload = await postJson<{ scene: unknown }>(
                fetchImpl,
                endpoint('/story/opening'),
                {}
            );
            return parseScene(payload.scene, '/story/opening');
        },
        isAvailable() {
            return true;
        }
    };
}
