import { browser } from '$app/environment';
import { get, writable } from 'svelte/store';
import type { GameSettings, GameState, Scene } from '$lib/contracts';
import type { GameTurnResult } from '$lib/game/gameRuntime';
import { createGameRuntime, type GameRuntime } from '$lib/game/gameRuntime';
import { resolveImagePath } from '$lib/game/imagePaths';
import { appendDebugError } from '$lib/debug/errorLog';
import { createApiStoryService } from '$lib/services';
import { mapAiErrorToUserMessage } from '$lib/errors/aiErrorMapping';

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

function mapUserFacingError(error: unknown): string {
	const typed =
		error && typeof error === 'object'
			? (error as { code?: unknown; status?: unknown; message?: unknown })
			: {};
	return mapAiErrorToUserMessage({
		code: typeof typed.code === 'string' ? typed.code : undefined,
		status: typeof typed.status === 'number' ? typed.status : undefined,
		message:
			typeof typed.message === 'string'
				? typed.message
				: error instanceof Error
					? error.message
					: String(error ?? '')
	});
}

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

		appGameStateStore.update((state) => ({ ...state, isProcessing: true, error: '' }));

		try {
			const result = await engine.startGame();
			applyTurnResult(result);
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
			applyTurnResult(result);
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
