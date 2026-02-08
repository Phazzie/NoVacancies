import {
	cloneGameState,
	cloneScene,
	createGameState,
	isValidChoiceId,
	mergeThreadUpdates,
	normalizeFeatureFlags,
	validateScene,
	type EndingType,
	type GameSettings,
	type GameState,
	type RuntimeFeatureFlags,
	type Scene
} from '$lib/contracts';
import { buildNarrativeContext, detectThreadTransitions } from '$lib/server/ai/narrative';
import {
	createSettingsStorage,
	type SettingsStorage,
	type StorageBindings,
	type StoryService
} from '$lib/services';
import { mockStoryService } from '$lib/services/mockStoryService';

export interface EndingPayload {
	endingType: EndingType;
	sceneId: string;
	stats: {
		sceneCount: number;
		lessonsCount: number;
		durationMs: number;
	};
	unlockedEndings: EndingType[];
}

export interface GameTurnResult {
	scene: Scene;
	gameState: GameState;
	isEnding: boolean;
	ending: EndingPayload | null;
}

export interface StartGameOptions {
	useMocks?: boolean;
	featureFlags?: Partial<RuntimeFeatureFlags>;
}

export interface GameRuntimeOptions {
	storyService?: StoryService;
	settingsStorage?: SettingsStorage;
	storageBindings?: StorageBindings;
	now?: () => number;
}

export interface GameRuntime {
	startGame(options?: StartGameOptions): Promise<GameTurnResult>;
	handleChoice(choiceId: string, choiceText?: string): Promise<GameTurnResult>;
	getCurrentScene(): Scene | null;
	loadSceneById(sceneId: string): Scene | null;
	getState(): GameState | null;
	getSettings(): GameSettings;
	refreshSettings(): GameSettings;
	updateSettings(patch: Partial<GameSettings>): GameSettings;
	setFeatureFlags(overrides: Partial<RuntimeFeatureFlags>): RuntimeFeatureFlags;
	clearFeatureFlags(): RuntimeFeatureFlags;
	isProcessing(): boolean;
	getEnding(): EndingPayload | null;
}

function cloneSettings(settings: GameSettings): GameSettings {
	return {
		...settings,
		unlockedEndings: [...settings.unlockedEndings],
		featureFlags: { ...settings.featureFlags }
	};
}

function normalizeEndingList(endings: EndingType[]): EndingType[] {
	const deduped = new Set(endings.filter((ending) => typeof ending === 'string' && ending.trim().length > 0));
	return [...deduped];
}

export function createGameRuntime(options: GameRuntimeOptions = {}): GameRuntime {
	const now = options.now ?? Date.now;
	const storyService = options.storyService ?? mockStoryService;
	const settingsStorage =
		options.settingsStorage ??
		createSettingsStorage({
			local: options.storageBindings?.local,
			session: options.storageBindings?.session
		});

	let settings = settingsStorage.loadSettings();
	let gameState: GameState | null = null;
	let currentScene: Scene | null = null;
	let lastEnding: EndingPayload | null = null;
	let processing = false;

	const refreshSettings = (): GameSettings => {
		settings = settingsStorage.loadSettings();
		return cloneSettings(settings);
	};

	const updateSettings = (patch: Partial<GameSettings>): GameSettings => {
		const normalizedPatch: Partial<GameSettings> = { ...patch };

		if (patch.featureFlags) {
			normalizedPatch.featureFlags = normalizeFeatureFlags({
				...settings.featureFlags,
				...patch.featureFlags
			});
		}
		if (patch.unlockedEndings) {
			normalizedPatch.unlockedEndings = normalizeEndingList(patch.unlockedEndings);
		}
		settings = settingsStorage.saveSettings(normalizedPatch);
		return cloneSettings(settings);
	};

	const buildTurnResult = (scene: Scene): GameTurnResult => {
		if (!gameState) {
			throw new Error('Game state is not initialized');
		}
		return {
			scene: cloneScene(scene),
			gameState: cloneGameState(gameState),
			isEnding: scene.isEnding,
			ending: lastEnding
		};
	};

	const buildEndingPayload = (scene: Scene): EndingPayload => {
		if (!gameState || !scene.endingType) {
			throw new Error('Ending payload requires ending scene and active game state');
		}

		if (!settings.unlockedEndings.includes(scene.endingType)) {
			const nextEndings = normalizeEndingList([...settings.unlockedEndings, scene.endingType]);
			settings.unlockedEndings = settingsStorage.saveUnlockedEndings(nextEndings);
		}

		return {
			endingType: scene.endingType,
			sceneId: scene.sceneId,
			stats: {
				sceneCount: gameState.sceneCount,
				lessonsCount: gameState.lessonsEncountered.length,
				durationMs: Math.max(0, now() - gameState.startTime)
			},
			unlockedEndings: [...settings.unlockedEndings]
		};
	};

	const applyScene = (scene: Scene): void => {
		if (!gameState) {
			throw new Error('Cannot apply scene before game start');
		}

		const previousThreads = {
			...gameState.storyThreads,
			boundariesSet: [...gameState.storyThreads.boundariesSet]
		};

		if (scene.storyThreadUpdates) {
			gameState.storyThreads = mergeThreadUpdates(gameState.storyThreads, scene.storyThreadUpdates);
		}

		if (gameState.featureFlags.transitionBridges) {
			const transitionBridge = detectThreadTransitions(previousThreads, gameState.storyThreads);
			gameState.pendingTransitionBridge =
				transitionBridge.lines.length > 0 ? transitionBridge : null;
		} else {
			gameState.pendingTransitionBridge = null;
		}
		gameState.currentSceneId = scene.sceneId;
		gameState.sceneCount += 1;

		const lastHistoryEntry = gameState.history[gameState.history.length - 1];
		gameState.sceneLog.push({
			sceneId: scene.sceneId,
			sceneText: scene.sceneText,
			viaChoiceText: lastHistoryEntry?.choiceText ?? '',
			isEnding: scene.isEnding
		});

		if (scene.lessonId && !gameState.lessonsEncountered.includes(scene.lessonId)) {
			gameState.lessonsEncountered.push(scene.lessonId);
		}

		currentScene = cloneScene(scene);
		lastEnding = scene.isEnding ? buildEndingPayload(scene) : null;
	};

	const startGame = async (startOptions: StartGameOptions = {}): Promise<GameTurnResult> => {
		const effectiveFlags = normalizeFeatureFlags({
			...settings.featureFlags,
			...startOptions.featureFlags
		});

		gameState = createGameState({
			featureFlags: effectiveFlags,
			apiKey: null,
			useMocks: false,
			now
		});

		const openingScene = await storyService.getOpeningScene({
			useMocks: false,
			featureFlags: effectiveFlags
		});
		if (!validateScene(openingScene)) {
			throw new Error('Story service returned invalid opening scene');
		}

		gameState.currentSceneId = openingScene.sceneId;
		gameState.sceneCount = 1;
		gameState.sceneLog = [
			{
				sceneId: openingScene.sceneId,
				sceneText: openingScene.sceneText,
				viaChoiceText: '',
				isEnding: openingScene.isEnding
			}
		];

		if (openingScene.lessonId) {
			gameState.lessonsEncountered.push(openingScene.lessonId);
		}

		currentScene = cloneScene(openingScene);
		lastEnding = openingScene.isEnding ? buildEndingPayload(openingScene) : null;
		return buildTurnResult(openingScene);
	};

	const handleChoice = async (choiceId: string, choiceText = ''): Promise<GameTurnResult> => {
		if (!gameState || !currentScene) {
			throw new Error('Game has not started. Call startGame() first.');
		}
		if (processing) {
			throw new Error('Choice processing already in progress');
		}
		if (!isValidChoiceId(choiceId)) {
			throw new Error(`Invalid choice id: ${choiceId}`);
		}

		processing = true;
		gameState.history.push({
			sceneId: gameState.currentSceneId,
			choiceId,
			choiceText,
			timestamp: now()
		});

		try {
			const narrativeContext = gameState.featureFlags.narrativeContextV2
				? buildNarrativeContext(gameState, { lastChoiceText: choiceText })
				: null;
			const nextScene = await storyService.getNextScene(
				gameState.currentSceneId,
				choiceId,
				gameState,
				narrativeContext,
				{
					useNarrativeContext: gameState.featureFlags.narrativeContextV2,
					enableTransitionBridges: gameState.featureFlags.transitionBridges
				}
			);
			if (!validateScene(nextScene)) {
				throw new Error('Story service returned invalid scene payload');
			}
			applyScene(nextScene);
			return buildTurnResult(nextScene);
		} finally {
			processing = false;
		}
	};

	const setFeatureFlags = (overrides: Partial<RuntimeFeatureFlags>): RuntimeFeatureFlags => {
		const normalized = settingsStorage.saveFeatureFlags({ ...settings.featureFlags, ...overrides });
		settings.featureFlags = normalized;
		return { ...normalized };
	};

	const clearFeatureFlags = (): RuntimeFeatureFlags => {
		const cleared = settingsStorage.clearFeatureFlags();
		settings.featureFlags = cleared;
		return { ...cleared };
	};

	const loadSceneById = (sceneId: string): Scene | null => {
		if (!sceneId || !storyService.getSceneById) return null;
		const scene = storyService.getSceneById(sceneId);
		if (!scene || !validateScene(scene)) return null;
		return cloneScene(scene);
	};

	return {
		startGame,
		handleChoice,
		getCurrentScene: () => (currentScene ? cloneScene(currentScene) : null),
		loadSceneById,
		getState: () => (gameState ? cloneGameState(gameState) : null),
		getSettings: () => cloneSettings(settings),
		refreshSettings,
		updateSettings,
		setFeatureFlags,
		clearFeatureFlags,
		isProcessing: () => processing,
		getEnding: () => (lastEnding ? { ...lastEnding, unlockedEndings: [...lastEnding.unlockedEndings] } : null)
	};
}
