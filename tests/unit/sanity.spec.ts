
import { test, expect } from '@playwright/test';
import { evaluateStorySanity } from '../../src/lib/server/ai/sanity';

// Wu-Bob Principle: "Trust But Verify" (Adversarial Edition)
// We act as the Red Team attacking our own sanity filters.

test.describe('Sanity Gate (Adversarial)', () => {

    // Table-driven test vectors
    const VECTORS = [
        { 
            name: 'Direct Violation', 
            input: 'A cold shiver ran down her spine.', 
            expectedBlock: ['shiver'],
            type: 'blocking' 
        },
        { 
            name: 'Punctuation Evasion (Naive)', 
            input: 'S.h.i.v.e.r ran down her spine.', 
            // Our robust regex now catches this!
            expectedBlock: ['evasion_attempt_detected'],
            type: 'blocking' 
        },
        {
            name: 'Therapy Speak',
            input: 'I understand that this is difficult for you, but I want to validate your feelings.',
            expectedBlock: ['therapy_speak_summary'],
            type: 'blocking'
        },
        {
            name: 'Empty String',
            input: '',
            expectedBlock: ['scene_word_count_hard_limit'],
            type: 'blocking'
        }
    ];

    for (const vector of VECTORS) {
        test(`Vector: ${vector.name}`, () => {
            const result = evaluateStorySanity({ 
                sceneText: vector.input, 
                sceneId: 'test', 
                isEnding: false 
            });

            if (vector.type === 'blocking') {
                for (const code of vector.expectedBlock) {
                    expect(result.blockingIssues, `Input [${vector.input}] should trigger [${code}]`)
                        .toContain(code);
                }
            } else {
                expect(result.blockingIssues).toEqual([]);
            }
        });
    }

    test('Word Count Limits - Boundary Check', () => {
        // Hard limit is usually very high or very low (min words).
        // Let's test the "Too Short" case.
        const tooShort = "Too short.";
        const result = evaluateStorySanity({ sceneText: tooShort, sceneId: 'short', isEnding: false });
        
        // Assuming min words is > 2
        expect(result.blockingIssues.concat(result.retryableIssues))
            .toEqual(expect.arrayContaining([expect.stringMatching(/word_count/)]));
    });
});
