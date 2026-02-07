import { browser } from '$app/environment';
import { get, writable } from 'svelte/store';
import type { GameSettings, GameState, Scene } from '$lib/contracts';
import type { GameTurnResult } from '$lib/game/gameRuntime';
import { createGameRuntime, type GameRuntime } from '$lib/game/gameRuntime';
import { resolveImagePath } from '$lib/game/imagePaths';
import { createApiStoryService, mockStoryService } from '$lib/services';

export interface AppGameState {
	settings: GameSettings | null;
	gameState: GameState | null;
	scene: Scene | null;
	ending: ReturnType<GameRuntime['getEnding']>;
	isProcessing: boolean;
	error: string;
	isReady: boolean;
}

const initialState: AppGameState = {
	settings: null,
	gameState: null,
	scene: null,
	ending: null,
	isProcessing: false,
	error: '',
	isReady: false
};

const appGameStateStore = writable<AppGameState>(initialState);

let runtime: GameRuntime | null = null;

function getRuntime(): GameRuntime {
	if (runtime) return runtime;

	runtime = createGameRuntime(
		browser
			? {
				storyService: createApiStoryService(),
				fallbackStoryService: mockStoryService,
				storageBindings: {
					local: window.localStorage,
					session: window.sessionStorage
				}
			}
			: {
				storyService: mockStoryService,
				fallbackStoryService: mockStoryService
			}
	);

	const settings = runtime.getSettings();
	appGameStateStore.update((state) => ({ ...state, settings, isReady: true }));
	return runtime;
}

function applyTurnResult(result: GameTurnResult): void {
	appGameStateStore.update((state) => ({
		...state,
		scene: result.scene,
		gameState: result.gameState,
		ending: result.ending,
		error: '',
		isProcessing: false,
		isReady: true
	}));
}

export const gameStore = {
	subscribe: appGameStateStore.subscribe,
	initialize(): void {
		const engine = getRuntime();
		const settings = engine.refreshSettings();
		appGameStateStore.update((state) => ({ ...state, settings, isReady: true }));
	},
	async startGame(): Promise<GameTurnResult> {
		const engine = getRuntime();
		const current = get(appGameStateStore);
		const settings = current.settings || engine.getSettings();

		appGameStateStore.update((state) => ({ ...state, isProcessing: true, error: '' }));

		try {
			const result = await engine.startGame({
				useMocks: settings.useMocks,
				apiKey: settings.apiKey,
				featureFlags: settings.featureFlags
			});
			applyTurnResult(result);
			return result;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to start game';
			appGameStateStore.update((state) => ({ ...state, isProcessing: false, error: message }));
			throw error;
		}
	},
	async choose(choiceId: string, choiceText = ''): Promise<GameTurnResult> {
		const engine = getRuntime();
		appGameStateStore.update((state) => ({ ...state, isProcessing: true, error: '' }));

		try {
			const result = await engine.handleChoice(choiceId, choiceText);
			applyTurnResult(result);
			return result;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to process choice';
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
	getImagePath(imageKey: string | null | undefined): string {
		return resolveImagePath(imageKey);
	}
};
