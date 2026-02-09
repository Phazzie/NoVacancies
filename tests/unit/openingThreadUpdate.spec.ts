
import { test, expect } from '@playwright/test';
import { createGameRuntime } from '../../src/lib/game/gameRuntime';
import { createGameState } from '../../src/lib/contracts/game';

// Wu-Bob Principle: "Explicit Dependencies"
// We define the mock interface locally to ensure this test owns its destiny.
// No global shared mocks that change under our feet.

test.describe('Opening Scene Thread Updates (Wu-Bob Hardening)', () => {
    
    test('start game MUST apply thread updates from the opening scene immediately', async () => {
        // 1. Arrange: The Perfect Setup (Factory)
        const expectedConflictLevel = 5;
        const mockAnalysisCode = "WU_TANG_FOREVER";

        const deterministicStoryService = {
            getOpeningScene: async () => ({
                sceneId: 'start',
                sceneText: 'The saga begins.',
                isEnding: false,
                // The critical payload we are testing:
                storyThreadUpdates: {
                    oswaldoConflict: expectedConflictLevel
                },
                // Minimal valid scene requirements:
                choices: [{ id: '1', text: 'Enter the 36 Chambers' }],
                analysis: { 
                    mood: 'grim', 
                    suitability: 1, 
                    reasoning: mockAnalysisCode // Tracer bullet
                }
            }),
            getNextScene: async () => { throw new Error("Should not be called in this test"); },
            getSceneById: () => null
        };

        // 2. Act: Execute the Contract
        const runtime = createGameRuntime({
            storyService: deterministicStoryService,
            now: () => 1000 // Frozen time
        });

        await runtime.startGame();
        const state = runtime.getState();

        // 3. Assert: Verify Invariants (Liquid Swords precision)
        
        // Invariant 1: The update must be applied
        expect(state?.storyThreads.oswaldoConflict, 
            'Oswaldo conflict should reflect the opening scene update immediately')
            .toBe(expectedConflictLevel);

        // Invariant 2: The scene text must match (Sanity check)
        expect(state?.sceneLog[0].sceneText).toBe('The saga begins.');
    });

    test('start game MUST NOT crash if updates are empty (Null Object Pattern)', async () => {
         const deterministicStoryService = {
            getOpeningScene: async () => ({
                sceneId: 'start', 
                sceneText: 'Quiet.', 
                isEnding: false,
                choices: [],
                // No thread updates provided
            }),
            getNextScene: async () => null,
            getSceneById: () => null
        };

        const runtime = createGameRuntime({ storyService: deterministicStoryService });
        
        // Should not throw
        await runtime.startGame();
        const state = runtime.getState();

        // Default should remain (0)
        expect(state?.storyThreads.oswaldoConflict).toBe(0);
    });
});
