import { browser } from '$app/environment';
import { get, writable } from 'svelte/store';
import type { GameSettings, GameState, Scene } from '$lib/contracts';
import type { StoryConfig } from '$lib/contracts/story';
import type { GameTurnResult } from '$lib/game/gameRuntime';
import { createGameRuntime, type GameRuntime } from '$lib/game/gameRuntime';
import { resolveImagePath } from '$lib/game/imagePaths';
import { appendDebugError } from '$lib/debug/errorLog';
import { createApiStoryService } from '$lib/services';

export interface AppGameState {
	settings: GameSettings | null;
	gameState: GameState | null;
	scene: Scene | null;
	ending: ReturnType<GameRuntime['getEnding']>;
	isProcessing: boolean;
	error: string;
	isReady: boolean;
	activeStoryConfig: StoryConfig | null;
}

const initialState: AppGameState = {
	settings: null,
	gameState: null,
	scene: null,
	ending: null,
	isProcessing: false,
	error: '',
	isReady: false,
	activeStoryConfig: null
};

const appGameStateStore = writable<AppGameState>(initialState);

let runtime: GameRuntime | null = null;

function mapUserFacingError(error: unknown): string {
	const raw = error instanceof Error ? error.message : String(error ?? 'Unknown error');
	const normalized = raw.toLowerCase();

	if (normalized.includes('xai_api_key') || normalized.includes('required in grok-only mode')) {
		return 'AI is not configured yet. Add XAI_API_KEY to the server environment, then redeploy.';
	}
	if (normalized.includes('auth') || normalized.includes('unauthorized')) {
		return 'AI authentication failed. Check the server API key configuration.';
	}
	if (normalized.includes('rate_limit') || normalized.includes('rate limit') || normalized.includes('429')) {
		return 'AI is rate-limited right now. Wait a moment and try again.';
	}
	if (normalized.includes('timeout') || normalized.includes('timed out')) {
		return 'AI timed out. Please try again.';
	}
	if (normalized.includes('provider_down') || normalized.includes('service unavailable')) {
		return 'AI provider is unavailable right now. Please try again in a minute.';
	}
	return raw || 'Something went wrong while loading AI.';
}

/**
 * Get the singleton GameRuntime, creating and initializing it if not already created.
 *
 * On first call, constructs the runtime with environment-appropriate services and storage bindings,
 * retrieves the runtime settings and active story config, and updates appGameStateStore (settings, activeStoryConfig, isReady).
 *
 * @returns The initialized GameRuntime singleton.
 */
function getRuntime(): GameRuntime {
	if (runtime) return runtime;

	runtime = createGameRuntime(
		browser
			? {
				storyService: createApiStoryService(),
				storageBindings: {
					local: window.localStorage,
					session: window.sessionStorage
				}
			}
			: {
				storyService: createApiStoryService()
			}
	);

	const settings = runtime.getSettings();
	const activeStoryConfig = runtime.getActiveConfig();
	appGameStateStore.update((state) => ({ ...state, settings, activeStoryConfig, isReady: true }));
	return runtime;
}

/**
 * Apply a game turn result to the global app game state.
 *
 * Updates the store's scene, gameState, and ending from the provided result, clears any error,
 * marks processing as finished, sets the app ready flag, and records the given active story config.
 *
 * @param result - The turn result whose `scene`, `gameState`, and `ending` will be persisted to state
 * @param config - The active `StoryConfig` to store, or `null` to clear the active config
 */
function applyTurnResult(result: GameTurnResult, config: StoryConfig | null): void {
	appGameStateStore.update((state) => ({
		...state,
		scene: result.scene,
		gameState: result.gameState,
		ending: result.ending,
		error: '',
		isProcessing: false,
		isReady: true,
		activeStoryConfig: config
	}));
}

export const gameStore = {
	subscribe: appGameStateStore.subscribe,
	initialize(): void {
		const engine = getRuntime();
		const settings = engine.refreshSettings();
		const config = engine.getActiveConfig();
		appGameStateStore.update((state) => ({ ...state, settings, activeStoryConfig: config, isReady: true }));
	},
	async startGame(options?: { storyId?: string; storyConfig?: StoryConfig }): Promise<GameTurnResult> {
		const engine = getRuntime();
		const current = get(appGameStateStore);
		const settings = current.settings || engine.getSettings();

		appGameStateStore.update((state) => ({ ...state, isProcessing: true, error: '' }));

		try {
			const result = await engine.startGame({
				featureFlags: settings.featureFlags,
				storyId: options?.storyId,
				storyConfig: options?.storyConfig
			});
			const config = engine.getActiveConfig();
			applyTurnResult(result, config);
			return result;
		} catch (error) {
			const message = mapUserFacingError(error);
			appendDebugError({
				scope: 'game.start',
				message,
				details: {
					raw:
						error instanceof Error ? error.message : String(error ?? 'Unknown start error'),
					sceneCount: current.gameState?.sceneCount ?? 0
				}
			});
			appGameStateStore.update((state) => ({ ...state, isProcessing: false, error: message }));
			throw error;
		}
	},
	async choose(choiceId: string, choiceText = ''): Promise<GameTurnResult> {
		const engine = getRuntime();
		appGameStateStore.update((state) => ({ ...state, isProcessing: true, error: '' }));

		try {
			const result = await engine.handleChoice(choiceId, choiceText);
			const config = engine.getActiveConfig();
			applyTurnResult(result, config);
			return result;
		} catch (error) {
			const message = mapUserFacingError(error);
			appendDebugError({
				scope: 'game.choice',
				message,
				details: {
					raw:
						error instanceof Error ? error.message : String(error ?? 'Unknown choice error'),
					choiceId,
					sceneCount: get(appGameStateStore).gameState?.sceneCount ?? 0
				}
			});
			appGameStateStore.update((state) => ({ ...state, isProcessing: false, error: message }));
			throw error;
		}
	},
	updateSettings(patch: Partial<GameSettings>): GameSettings {
		const engine = getRuntime();
		const settings = engine.updateSettings(patch);
		appGameStateStore.update((state) => ({ ...state, settings }));
		return settings;
	},
	clearError(): void {
		appGameStateStore.update((state) => ({ ...state, error: '' }));
	},
	getImagePath(imageKey: string | null | undefined, sceneId?: string | null): string {
		return resolveImagePath(imageKey, sceneId);
	}
};