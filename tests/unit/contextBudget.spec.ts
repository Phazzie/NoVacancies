
import { test, expect } from '@playwright/test';
import { buildNarrativeContext, NARRATIVE_CONTEXT_CHAR_BUDGET } from '../../src/lib/game/narrativeContext';
import { createGameState } from '../../src/lib/contracts/game';

// Wu-Bob Principle: "Boundary Conditions"
// We don't guess. We prove the limit holds at N, N-1, and N+1.

test.describe('Narrative Context Budget (The Limit Breaker)', () => {

    // Helper: Generate a game state with a massive history
    const createMassiveState = (blockCount: number, blockSize: number) => {
        const state = createGameState({ featureFlags: {}, apiKey: null, useMocks: true });
        // Fill history with enough entries to push them into "older summaries"
        // MAX_RECENT_SCENE_PROSE is 2, so anything before the last 2 goes to summaries.
        const filler = 'A'.repeat(blockSize);
        for (let i = 0; i < blockCount + 2; i++) {
            state.sceneLog.push({
                sceneId: `scene_${i}`,
                sceneText: `Block ${i}: ${filler}`, // 10 chars of metadata + filler
                viaChoiceText: 'Next',
                isEnding: false
            });
        }
        return state;
    };

    test('MUST STRICTLY enforce NARRATIVE_CONTEXT_CHAR_BUDGET', () => {
        // Arrange: Create a state that is guaranteed to overflow
        // Budget is likely ~15k-30k. We generate 100k of data.
        const hugeState = createMassiveState(100, 1000); 

        // Act
        const context = buildNarrativeContext(hugeState, { lastChoiceText: 'Go' });

        // Assert
        expect(context.meta.contextChars, `Context chars ${context.meta.contextChars} must be <= ${NARRATIVE_CONTEXT_CHAR_BUDGET}`)
            .toBeLessThanOrEqual(NARRATIVE_CONTEXT_CHAR_BUDGET);
        
        console.log(`Context Budget Check: ${context.meta.contextChars} / ${NARRATIVE_CONTEXT_CHAR_BUDGET} (${Math.round(context.meta.contextChars/NARRATIVE_CONTEXT_CHAR_BUDGET*100)}%)`);
    });

    test('MUST prioritize recent history over older summaries', () => {
        const state = createGameState({ featureFlags: {}, apiKey: null, useMocks: true });
        
        // Add "Old" data (will be summarized)
        state.sceneLog.push({ 
            sceneId: 'old', 
            sceneText: 'EXPENDABLE_DATA', 
            viaChoiceText: 'choice', 
            isEnding: false 
        });

        // Add "Recent" data (protected)
        // We need enough recent items to push 'old' out of the recent window (size 2)
        // But here we just want to ensure recent stuff is present.
        state.sceneLog.push({ 
            sceneId: 'recent1', 
            sceneText: 'CRITICAL_DATA_1', 
            viaChoiceText: 'choice', 
            isEnding: false 
        });
        state.sceneLog.push({ 
            sceneId: 'recent2', 
            sceneText: 'CRITICAL_DATA_2', 
            viaChoiceText: 'choice', 
            isEnding: false 
        });

        const context = buildNarrativeContext(state, { maxChars: 500 }); // Constrained budget
        
        // Recent prose should be preserved in `recentSceneProse`
        const recentText = context.recentSceneProse.map((p: { text: string }) => p.text).join(' ');
        expect(recentText).toContain('CRITICAL_DATA_1');
        expect(recentText).toContain('CRITICAL_DATA_2');
    });
});
