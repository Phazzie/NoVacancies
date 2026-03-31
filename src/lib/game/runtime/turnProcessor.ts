import {
    cloneGameState,
    cloneScene,
    createGameState,
    isValidChoiceId,
    validateScene,
    type GameState,
    type Scene
} from '../../contracts';
import type { StoryService } from '../../services';
import type { StoryCartridge } from '$lib/stories';
import { buildNarrativeContext } from '../narrativeContext';
import { applyOpeningSceneToState, applySceneToState } from './stateTransitions';
import type { EndingPayload, GameTurnResult } from '../gameRuntime';

export interface TurnProcessorRuntimeState {
    gameState: GameState | null;
    currentScene: Scene | null;
    lastEnding: EndingPayload | null;
    processing: boolean;
}

interface TurnProcessorDependencies {
    now: () => number;
    storyService: StoryService;
    cartridge: StoryCartridge;
    state: TurnProcessorRuntimeState;
    buildEndingPayload: (scene: Scene, gameState: GameState) => EndingPayload;
}

export function createTurnProcessor({
    now,
    storyService,
    cartridge,
    state,
    buildEndingPayload
}: TurnProcessorDependencies) {
    const buildTurnResult = (scene: Scene): GameTurnResult => {
        if (!state.gameState) {
            throw new Error('Game state is not initialized');
        }
        return {
            scene: cloneScene(scene),
            gameState: cloneGameState(state.gameState),
            isEnding: scene.isEnding,
            ending: state.lastEnding
        };
    };

    const startGame = async (): Promise<GameTurnResult> => {
        state.gameState = createGameState({
            apiKey: null,
            now,
            initialSceneId: cartridge.initialSceneId,
            initialStoryThreads: cartridge.createInitialStoryThreads()
        });

        const openingScene = await storyService.getOpeningScene();
        if (!validateScene(openingScene)) {
            throw new Error('Story service returned invalid opening scene');
        }

        applyOpeningSceneToState(state.gameState, openingScene);
        state.currentScene = cloneScene(openingScene);
        state.lastEnding = openingScene.isEnding
            ? buildEndingPayload(openingScene, state.gameState)
            : null;

        return buildTurnResult(openingScene);
    };

    const handleChoice = async (choiceId: string, choiceText = ''): Promise<GameTurnResult> => {
        if (!state.gameState || !state.currentScene) {
            throw new Error('Game has not started. Call startGame() first.');
        }
        if (state.processing) {
            throw new Error('Choice processing already in progress');
        }
        if (!isValidChoiceId(choiceId)) {
            throw new Error(`Invalid choice id: ${choiceId}`);
        }

        state.processing = true;
        const historyLengthSnapshot = state.gameState.history.length;
        state.gameState.history.push({
            sceneId: state.gameState.currentSceneId,
            choiceId,
            choiceText,
            timestamp: now()
        });

        let sceneApplied = false;
        try {
            const narrativeContext = buildNarrativeContext(state.gameState, {
                lastChoiceText: choiceText
            });
            const nextScene = await storyService.getNextScene(
                state.gameState.currentSceneId,
                choiceId,
                state.gameState,
                narrativeContext,
                {
                    enableTransitionBridges: true
                }
            );
            if (!validateScene(nextScene)) {
                throw new Error('Story service returned invalid scene payload');
            }
            applySceneToState(state.gameState, nextScene);
            state.currentScene = cloneScene(nextScene);
            state.lastEnding = nextScene.isEnding
                ? buildEndingPayload(nextScene, state.gameState)
                : null;
            sceneApplied = true;
            return buildTurnResult(nextScene);
        } finally {
            if (!sceneApplied) {
                state.gameState.history.length = historyLengthSnapshot;
            }
            state.processing = false;
        }
    };

    return {
        startGame,
        handleChoice
    };
}
