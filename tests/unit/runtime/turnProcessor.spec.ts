import { expect, test } from '@playwright/test';
import { createStoryThreads, type GameState, type Scene } from '../../../src/lib/contracts/game';
import {
    createTurnProcessor,
    type TurnProcessorRuntimeState
} from '../../../src/lib/game/runtime/turnProcessor';
import type { StoryService } from '../../../src/lib/services';

function makeScene(overrides: Partial<Scene> = {}): Scene {
    return {
        sceneId: 'opening',
        sceneText: 'Opening scene',
        choices: [{ id: 'choice-a', text: 'Choice A' }],
        lessonId: null,
        imageKey: 'hotel_room',
        isEnding: false,
        endingType: null,
        storyThreadUpdates: null,
        ...overrides
    };
}

test.describe('runtime/turnProcessor', () => {
    test('startGame initializes state and returns opening turn result', async () => {
        const openingScene = makeScene({ sceneId: 'opening-1', lessonId: 9 });
        const storyService: StoryService = {
            getOpeningScene: async () => openingScene,
            getNextScene: async () => makeScene({ sceneId: 'unused' })
        };
        const state: TurnProcessorRuntimeState = {
            gameState: null,
            currentScene: null,
            lastEnding: null,
            processing: false
        };

        const processor = createTurnProcessor({
            now: () => 100,
            storyService,
            cartridge: {
                initialSceneId: 'opening-seed',
                createInitialStoryThreads: () => createStoryThreads()
            } as any,
            state,
            buildEndingPayload: () => {
                throw new Error('should not build ending payload for non-ending opening scene');
            }
        });

        const result = await processor.startGame();

        expect(result.scene.sceneId).toBe('opening-1');
        expect(result.gameState.currentSceneId).toBe('opening-1');
        expect(result.gameState.sceneCount).toBe(1);
        expect(result.gameState.lessonsEncountered).toEqual([9]);
        expect(state.currentScene?.sceneId).toBe('opening-1');
    });

    test('handleChoice rolls back history when scene validation fails', async () => {
        const openingScene = makeScene();
        const storyService: StoryService = {
            getOpeningScene: async () => openingScene,
            getNextScene: async () => ({ sceneId: 'bad-scene' }) as Scene
        };
        const state: TurnProcessorRuntimeState = {
            gameState: null,
            currentScene: null,
            lastEnding: null,
            processing: false
        };
        const processor = createTurnProcessor({
            now: () => 200,
            storyService,
            cartridge: {
                initialSceneId: 'opening-seed',
                createInitialStoryThreads: () => createStoryThreads()
            } as any,
            state,
            buildEndingPayload: () => ({
                endingType: 'loop',
                sceneId: 'ending',
                stats: { sceneCount: 0, lessonsCount: 0, durationMs: 0 },
                unlockedEndings: []
            })
        });

        await processor.startGame();
        const historyBefore = state.gameState?.history.length ?? 0;

        await expect(processor.handleChoice('choice-a', 'Go now')).rejects.toThrow(
            'Story service returned invalid scene payload'
        );

        expect(state.processing).toBe(false);
        expect(state.gameState?.history.length).toBe(historyBefore);
    });

    test('handleChoice applies ending payload when next scene ends game', async () => {
        const openingScene = makeScene();
        const endingScene = makeScene({
            sceneId: 'ending-1',
            isEnding: true,
            endingType: 'shift',
            choices: []
        });

        const storyService: StoryService = {
            getOpeningScene: async () => openingScene,
            getNextScene: async (_sceneId, _choiceId, gameState: GameState) => {
                expect(gameState.history.at(-1)?.choiceText).toBe('Take the exit');
                return endingScene;
            }
        };
        const state: TurnProcessorRuntimeState = {
            gameState: null,
            currentScene: null,
            lastEnding: null,
            processing: false
        };

        const processor = createTurnProcessor({
            now: () => 500,
            storyService,
            cartridge: {
                initialSceneId: 'opening-seed',
                createInitialStoryThreads: () => createStoryThreads()
            } as any,
            state,
            buildEndingPayload: (scene, gameState) => ({
                endingType: scene.endingType ?? 'loop',
                sceneId: scene.sceneId,
                stats: {
                    sceneCount: gameState.sceneCount,
                    lessonsCount: gameState.lessonsEncountered.length,
                    durationMs: 1
                },
                unlockedEndings: ['shift']
            })
        });

        await processor.startGame();
        const result = await processor.handleChoice('choice-a', 'Take the exit');

        expect(result.isEnding).toBe(true);
        expect(result.ending?.endingType).toBe('shift');
        expect(state.currentScene?.sceneId).toBe('ending-1');
    });
});
