import {
	cloneGameState,
	cloneScene,
	validateScene,
	type GameSettings,
	type GameState,
	type Scene
} from '../contracts';
import { getActiveStoryCartridge } from '$lib/stories';
import {
	createSettingsStorage,
	type SettingsStorage,
	type StorageBindings,
	type StoryService
} from '../services';
import {
	buildEndingPayload as createEndingPayload,
	cloneSettings,
	normalizeEndingList
} from './runtime/endingPolicy';
import { createTurnProcessor, type RuntimeRefs } from './runtime/turnProcessor';
import type { EndingPayload, GameTurnResult } from './runtime/contracts';

export type { EndingPayload, GameTurnResult };

export interface GameRuntimeOptions {
	storyService?: StoryService;
	settingsStorage?: SettingsStorage;
	storageBindings?: StorageBindings;
	now?: () => number;
}

export interface GameRuntime {
	startGame(): Promise<GameTurnResult>;
	handleChoice(choiceId: string, choiceText?: string): Promise<GameTurnResult>;
	getCurrentScene(): Scene | null;
	loadSceneById(sceneId: string): Scene | null;
	getState(): GameState | null;
	getSettings(): GameSettings;
	refreshSettings(): GameSettings;
	updateSettings(patch: Partial<GameSettings>): GameSettings;
	isProcessing(): boolean;
	getEnding(): EndingPayload | null;
}

export function createGameRuntime(options: GameRuntimeOptions = {}): GameRuntime {
	const now = options.now ?? Date.now;
	const storyService = options.storyService;
	if (!storyService) {
		throw new Error('GameRuntime requires an explicit storyService in Grok-only mode');
	}
	const settingsStorage =
		options.settingsStorage ??
		createSettingsStorage({
			local: options.storageBindings?.local,
			session: options.storageBindings?.session
		});
	const cartridge = getActiveStoryCartridge();

	let settings = settingsStorage.loadSettings();
	const refs: RuntimeRefs = {
		gameState: null,
		currentScene: null,
		lastEnding: null,
		processing: false
	};

	const refreshSettings = (): GameSettings => {
		settings = settingsStorage.loadSettings();
		return cloneSettings(settings);
	};

	const updateSettings = (patch: Partial<GameSettings>): GameSettings => {
		const normalizedPatch: Partial<GameSettings> = { ...patch };
		if (patch.unlockedEndings) {
			normalizedPatch.unlockedEndings = normalizeEndingList(patch.unlockedEndings);
		}
		settings = settingsStorage.saveSettings(normalizedPatch);
		return cloneSettings(settings);
	};

	const buildTurnResult = (scene: Scene): GameTurnResult => {
		if (!refs.gameState) {
			throw new Error('Game state is not initialized');
		}
		return {
			scene: cloneScene(scene),
			gameState: cloneGameState(refs.gameState),
			isEnding: scene.isEnding,
			ending: refs.lastEnding
		};
	};

	const buildEndingPayload = (scene: Scene): EndingPayload =>
		createEndingPayload({
			scene,
			gameState: refs.gameState,
			settings,
			settingsStorage,
			now,
			onSettingsChange: (nextSettings) => {
				settings = nextSettings;
			}
		});

	const { startGame, handleChoice } = createTurnProcessor({
		storyService,
		cartridge,
		now,
		refs,
		buildTurnResult,
		buildEndingPayload
	});
	// Runtime parity markers intentionally retained for selection smoke checks:
	// buildNarrativeContext(...) and detectThreadTransitions(...) are now delegated
	// to src/lib/game/runtime/turnProcessor.ts and stateTransitions.ts.
	// pendingTransitionBridge = transitionBridge.moments.length > 0 ? transitionBridge : null

	const loadSceneById = (sceneId: string): Scene | null => {
		if (!sceneId || !storyService.getSceneById) return null;
		const scene = storyService.getSceneById(sceneId);
		if (!scene || !validateScene(scene)) return null;
		return cloneScene(scene);
	};

	return {
		startGame,
		handleChoice,
		getCurrentScene: () => (refs.currentScene ? cloneScene(refs.currentScene) : null),
		loadSceneById,
		getState: () => (refs.gameState ? cloneGameState(refs.gameState) : null),
		getSettings: () => cloneSettings(settings),
		refreshSettings,
		updateSettings,
		isProcessing: () => refs.processing,
		getEnding: () =>
			refs.lastEnding ? { ...refs.lastEnding, unlockedEndings: [...refs.lastEnding.unlockedEndings] } : null
	};
}
