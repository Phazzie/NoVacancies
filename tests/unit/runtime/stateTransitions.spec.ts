import { expect, test } from '@playwright/test';
import { createGameState, createStoryThreads, type Scene } from '../../../src/lib/contracts/game';
import {
    applyOpeningSceneToState,
    applySceneToState,
    deriveTransitionBridge
} from '../../../src/lib/game/runtime/stateTransitions';

function makeScene(overrides: Partial<Scene> = {}): Scene {
    return {
        sceneId: 'scene-1',
        sceneText: 'Scene text',
        choices: [],
        lessonId: null,
        imageKey: 'hotel_room',
        isEnding: false,
        endingType: null,
        storyThreadUpdates: null,
        ...overrides
    };
}

test.describe('runtime/stateTransitions', () => {
    test('deriveTransitionBridge returns null when no thread values change', () => {
        const previous = createStoryThreads();
        const next = createStoryThreads();
        expect(deriveTransitionBridge(previous, next)).toBeNull();
    });

    test('applyOpeningSceneToState seeds opening scene state', () => {
        const gameState = createGameState();
        const openingScene = makeScene({
            sceneId: 'opening',
            lessonId: 3,
            storyThreadUpdates: {
                oswaldoConflict: 2,
                boundariesSet: ['work-only']
            }
        });

        applyOpeningSceneToState(gameState, openingScene);

        expect(gameState.currentSceneId).toBe('opening');
        expect(gameState.sceneCount).toBe(1);
        expect(gameState.lessonsEncountered).toEqual([3]);
        expect(gameState.storyThreads.oswaldoConflict).toBe(2);
        expect(gameState.storyThreads.boundariesSet).toEqual(['work-only']);
        expect(gameState.sceneLog).toEqual([
            {
                sceneId: 'opening',
                sceneText: 'Scene text',
                viaChoiceText: '',
                isEnding: false
            }
        ]);
    });

    test('applySceneToState tracks history text, lessons, and transition bridges', () => {
        const gameState = createGameState({
            initialSceneId: 'opening',
            initialStoryThreads: createStoryThreads()
        });
        gameState.sceneCount = 1;
        gameState.history.push({
            sceneId: 'opening',
            choiceId: 'call-dex',
            choiceText: 'Call Dex now',
            timestamp: 1
        });

        applySceneToState(
            gameState,
            makeScene({
                sceneId: 'scene-2',
                lessonId: 7,
                storyThreadUpdates: {
                    dexTriangulation: 2
                }
            })
        );

        expect(gameState.currentSceneId).toBe('scene-2');
        expect(gameState.sceneCount).toBe(2);
        expect(gameState.lessonsEncountered).toEqual([7]);
        expect(gameState.sceneLog.at(-1)).toEqual({
            sceneId: 'scene-2',
            sceneText: 'Scene text',
            viaChoiceText: 'Call Dex now',
            isEnding: false
        });
        expect(gameState.pendingTransitionBridge?.keys).toContain('dexTriangulation');
    });
});
