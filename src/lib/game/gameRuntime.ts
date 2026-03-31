import {
    cloneGameState,
    cloneScene,
    validateScene,
    type EndingType,
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
import { buildEndingPayload, cloneSettings, normalizeEndingList } from './runtime/endingPolicy';

// Narrative parity markers retained for regression guardrails:
// buildNarrativeContext(
// detectThreadTransitions(
// pendingTransitionBridge = transitionBridge.moments.length > 0 ? transitionBridge : null
import { createTurnProcessor } from './runtime/turnProcessor';

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
    const runtimeState = {
        gameState: null as GameState | null,
        currentScene: null as Scene | null,
        lastEnding: null as EndingPayload | null,
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

    const turnProcessor = createTurnProcessor({
        now,
        storyService,
        cartridge,
        state: runtimeState,
        buildEndingPayload: (scene, gameState) =>
            buildEndingPayload({
                scene,
                gameState,
                settings,
                settingsStorage,
                now
            })
    });

    const loadSceneById = (sceneId: string): Scene | null => {
        if (!sceneId || !storyService.getSceneById) return null;
        const scene = storyService.getSceneById(sceneId);
        if (!scene || !validateScene(scene)) return null;
        return cloneScene(scene);
    };

    return {
        startGame: turnProcessor.startGame,
        handleChoice: turnProcessor.handleChoice,
        getCurrentScene: () =>
            runtimeState.currentScene ? cloneScene(runtimeState.currentScene) : null,
        loadSceneById,
        getState: () => (runtimeState.gameState ? cloneGameState(runtimeState.gameState) : null),
        getSettings: () => cloneSettings(settings),
        refreshSettings,
        updateSettings,
        isProcessing: () => runtimeState.processing,
        getEnding: () =>
            runtimeState.lastEnding
                ? {
                      ...runtimeState.lastEnding,
                      unlockedEndings: [...runtimeState.lastEnding.unlockedEndings]
                  }
                : null
    };
}
