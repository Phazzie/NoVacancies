import {
    mergeThreadUpdates,
    type GameState,
    type Scene,
    type StoryThreads,
    type TransitionBridge
} from '../../contracts';
import { detectThreadTransitions } from '../narrativeContext';

function cloneThreadsForComparison(threads: StoryThreads): StoryThreads {
    return {
        ...threads,
        boundariesSet: [...threads.boundariesSet]
    };
}

export function deriveTransitionBridge(
    previous: StoryThreads,
    next: StoryThreads
): TransitionBridge | null {
    const bridge = detectThreadTransitions(previous, next);
    return bridge.moments.length > 0 ? bridge : null;
}

export function applyOpeningSceneToState(gameState: GameState, openingScene: Scene): void {
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

    if (openingScene.storyThreadUpdates) {
        gameState.storyThreads = mergeThreadUpdates(
            gameState.storyThreads,
            openingScene.storyThreadUpdates
        );
    }
}

export function applySceneToState(gameState: GameState, scene: Scene): void {
    const previousThreads = cloneThreadsForComparison(gameState.storyThreads);

    if (scene.storyThreadUpdates) {
        gameState.storyThreads = mergeThreadUpdates(
            gameState.storyThreads,
            scene.storyThreadUpdates
        );
    }

    gameState.pendingTransitionBridge = deriveTransitionBridge(
        previousThreads,
        gameState.storyThreads
    );
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
}
