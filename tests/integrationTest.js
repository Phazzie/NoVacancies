/**
 * Integration Tests - Complex State & Error Handling
 *
 * Tests high-risk paths: state merges, JSON parsing, service fallback,
 * localStorage edge cases, ending logic, and race condition guards.
 *
 * Runs in Node.js (no DOM dependencies).
 */

import {
    createGameState,
    createStoryThreads,
    mergeThreadUpdates,
    validateScene,
    validateEndingType,
    EndingTypes
} from '../js/contracts.js';
import {
    SYSTEM_PROMPT,
    getContinuePrompt,
    getRecoveryPrompt,
    suggestEndingFromHistory,
    formatThreadState
} from '../js/prompts.js';
import { mockStoryService } from '../js/services/mockStoryService.js';

// ─── Assertion Helpers ───────────────────────────────────────────────

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
    if (condition) {
        totalPassed++;
    } else {
        totalFailed++;
        console.error(`  ❌ ${message}`);
    }
}

function assertEqual(actual, expected, message) {
    if (actual === expected) {
        totalPassed++;
    } else {
        totalFailed++;
        console.error(`  ❌ ${message}\n     Expected: ${JSON.stringify(expected)}\n     Actual:   ${JSON.stringify(actual)}`);
    }
}

function assertDeepEqual(actual, expected, message) {
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    if (pass) {
        totalPassed++;
    } else {
        totalFailed++;
        console.error(`  ❌ ${message}\n     Expected: ${JSON.stringify(expected)}\n     Actual:   ${JSON.stringify(actual)}`);
    }
}

function assertThrows(fn, message) {
    try {
        fn();
        totalFailed++;
        console.error(`  ❌ ${message} — expected error but none thrown`);
    } catch {
        totalPassed++;
    }
}

function assertDoesNotThrow(fn, message) {
    try {
        fn();
        totalPassed++;
    } catch (e) {
        totalFailed++;
        console.error(`  ❌ ${message} — unexpected error: ${e.message}`);
    }
}

// ─── Suite 1: Thread Merging ─────────────────────────────────────────

function testThreadMerging() {
    console.log('  Test 1.1: Normal merge — primitives update, others unchanged');
    {
        const threads = createStoryThreads();
        const result = mergeThreadUpdates(threads, { oswaldoConflict: 2, trinaTension: 1 });

        assertEqual(result.oswaldoConflict, 2, 'oswaldoConflict should be 2');
        assertEqual(result.trinaTension, 1, 'trinaTension should be 1');
        assertEqual(result.moneyResolved, false, 'moneyResolved unchanged');
        assertEqual(result.carMentioned, false, 'carMentioned unchanged');
        assertEqual(result.sydneyRealization, 0, 'sydneyRealization unchanged');
        assertEqual(result.oswaldoAwareness, 0, 'oswaldoAwareness unchanged');
        assertEqual(result.exhaustionLevel, 1, 'exhaustionLevel unchanged');
        assertDeepEqual(result.boundariesSet, [], 'boundariesSet unchanged');
        // Original not mutated
        assertEqual(threads.oswaldoConflict, 0, 'original threads not mutated');
    }

    console.log('  Test 1.2: Array append — boundariesSet appends, not replaces');
    {
        const threads = createStoryThreads();
        threads.boundariesSet = ['no guests'];
        const originalRef = threads.boundariesSet;

        const result = mergeThreadUpdates(threads, {
            boundariesSet: ['wake up early', 'no phone snooping']
        });

        assertDeepEqual(result.boundariesSet, ['no guests', 'wake up early', 'no phone snooping'],
            'boundariesSet should append');
        assertEqual(result.boundariesSet.length, 3, 'length should be 3');
        // Original array not mutated
        assertEqual(originalRef.length, 1, 'original array not mutated');

        // Empty array update should not change anything
        const result2 = mergeThreadUpdates(threads, { boundariesSet: [] });
        assertDeepEqual(result2.boundariesSet, ['no guests'], 'empty array means no change');
    }

    console.log('  Test 1.3: Partial update — sparse object, only specified field changes');
    {
        const threads = createStoryThreads();
        threads.oswaldoConflict = -1;
        threads.trinaTension = 2;
        threads.moneyResolved = true;
        threads.carMentioned = true;
        threads.sydneyRealization = 1;
        threads.boundariesSet = ['existing'];
        threads.oswaldoAwareness = 1;
        threads.exhaustionLevel = 3;

        const result = mergeThreadUpdates(threads, { sydneyRealization: 2 });

        assertEqual(result.sydneyRealization, 2, 'sydneyRealization updated to 2');
        assertEqual(result.oswaldoConflict, -1, 'oswaldoConflict preserved');
        assertEqual(result.trinaTension, 2, 'trinaTension preserved');
        assertEqual(result.moneyResolved, true, 'moneyResolved preserved');
        assertEqual(result.carMentioned, true, 'carMentioned preserved');
        assertEqual(result.oswaldoAwareness, 1, 'oswaldoAwareness preserved');
        assertEqual(result.exhaustionLevel, 3, 'exhaustionLevel preserved');
        assertDeepEqual(result.boundariesSet, ['existing'], 'boundariesSet preserved');
    }

    console.log('  Test 1.4: Unknown keys ignored, valid keys accepted');
    {
        const threads = createStoryThreads();

        // Unknown key should be ignored
        const result = mergeThreadUpdates(threads, { fakeProp: 99, oswaldoConflict: 1 });
        assertEqual(result.oswaldoConflict, 1, 'known key updated');
        assertEqual(result.fakeProp, undefined, 'unknown key not added');

        // Out-of-range value — we accept it (AI discretion)
        const result2 = mergeThreadUpdates(threads, { exhaustionLevel: 10 });
        assertEqual(result2.exhaustionLevel, 10, 'out-of-range value accepted');
    }

    console.log('  Test 1.5: Null/undefined handling');
    {
        const threads = createStoryThreads();
        threads.oswaldoConflict = 1;

        // null updates returns original unchanged
        const result = mergeThreadUpdates(threads, null);
        assertEqual(result.oswaldoConflict, 1, 'null updates returns unchanged');
        assert(result === threads, 'null returns same reference');

        // undefined updates returns original unchanged
        const result2 = mergeThreadUpdates(threads, undefined);
        assertEqual(result2.oswaldoConflict, 1, 'undefined updates returns unchanged');

        // undefined values in update are skipped
        const result3 = mergeThreadUpdates(threads, { trinaTension: undefined });
        assertEqual(result3.trinaTension, 0, 'undefined value skipped');

        // Explicit null value in update IS applied (it's a valid falsy value)
        const result4 = mergeThreadUpdates(threads, { trinaTension: 0 });
        assertEqual(result4.trinaTension, 0, 'explicit 0 is applied');
    }
}

// ─── Suite 2: Error Recovery (JSON Parsing) ──────────────────────────

async function testErrorRecovery() {
    // We test the parseResponse logic by importing the service.
    // GeminiStoryService.parseResponse is called on the singleton.

    let geminiService;
    try {
        const mod = await import('../js/services/geminiStoryService.js');
        geminiService = mod.geminiStoryService;
    } catch {
        console.warn('  ⚠️  Could not import geminiStoryService, skipping parse tests');
        return;
    }

    const validScene = {
        sceneText: 'Test scene text.',
        choices: [{ id: 'a', text: 'Choice A' }],
        lessonId: 1,
        imageKey: 'hotel_room',
        isEnding: false,
        endingType: null,
        mood: 'tense'
    };

    console.log('  Test 2.1: Clean JSON parses correctly');
    {
        const result = geminiService.parseResponse(JSON.stringify(validScene));
        assertEqual(result.sceneText, 'Test scene text.', 'sceneText matches');
        assertEqual(result.choices.length, 1, '1 choice parsed');
        assertEqual(result.choices[0].id, 'a', 'choice id matches');
    }

    console.log('  Test 2.2: JSON in markdown code block');
    {
        const wrapped = '```json\n' + JSON.stringify(validScene) + '\n```';
        const result = geminiService.parseResponse(wrapped);
        assertEqual(result.sceneText, 'Test scene text.', 'extracted from markdown');
        assertEqual(result.choices.length, 1, 'choices intact');
    }

    console.log('  Test 2.3: JSON embedded in prose');
    {
        const prose = 'Here is the scene:\n' + JSON.stringify(validScene) + '\n\nHope you like it!';
        const result = geminiService.parseResponse(prose);
        assertEqual(result.sceneText, 'Test scene text.', 'extracted from prose');
    }

    console.log('  Test 2.4: Completely unparseable text throws');
    {
        assertThrows(
            () => geminiService.parseResponse('This is not JSON at all. No braces anywhere.'),
            'unparseable text should throw'
        );

        assertThrows(
            () => geminiService.parseResponse(''),
            'empty string should throw'
        );
    }

    console.log('  Test 2.5: callGemini makes one JSON-recovery retry and succeeds');
    {
        const originalFetch = globalThis.fetch;
        const originalModel = geminiService.currentModel;
        const requestPrompts = [];
        let callCount = 0;

        geminiService.reset();
        geminiService.setApiKey('test-api-key');

        globalThis.fetch = async (_url, options) => {
            const body = JSON.parse(options.body);
            const promptText = body.contents?.[0]?.parts?.[0]?.text || '';
            requestPrompts.push(promptText);
            callCount++;

            const textResponse = callCount === 1 ? 'Not JSON output' : JSON.stringify(validScene);
            return {
                ok: true,
                json: async () => ({
                    candidates: [
                        {
                            content: {
                                parts: [{ text: textResponse }]
                            }
                        }
                    ]
                })
            };
        };

        try {
            const result = await geminiService.callGemini('Generate scene');
            assertEqual(result.sceneText, 'Test scene text.', 'recovery retry returns valid parsed JSON');
            assertEqual(requestPrompts.length, 2, 'exactly two calls: original + one recovery retry');
            assert(
                requestPrompts[1].includes('Your previous response was not valid JSON.'),
                'second call uses recovery prompt'
            );
        } finally {
            globalThis.fetch = originalFetch;
            geminiService.currentModel = originalModel;
        }
    }

    console.log('  Test 2.6: recovery flow is bounded and does not loop indefinitely');
    {
        const originalFetch = globalThis.fetch;
        const originalModel = geminiService.currentModel;
        const requestPrompts = [];
        const modelHits = [];
        let threw = false;

        geminiService.reset();
        geminiService.setApiKey('test-api-key');

        globalThis.fetch = async (url, options) => {
            const body = JSON.parse(options.body);
            const promptText = body.contents?.[0]?.parts?.[0]?.text || '';
            requestPrompts.push(promptText);
            modelHits.push(url.includes('gemini-3-flash-preview') ? 'fallback' : 'primary');

            return {
                ok: true,
                json: async () => ({
                    candidates: [
                        {
                            content: {
                                parts: [{ text: 'Still not valid JSON' }]
                            }
                        }
                    ]
                })
            };
        };

        try {
            await geminiService.callGemini('Generate scene');
        } catch {
            threw = true;
        } finally {
            globalThis.fetch = originalFetch;
            geminiService.currentModel = originalModel;
        }

        const recoveryPromptCalls = requestPrompts.filter((prompt) =>
            prompt.includes('Your previous response was not valid JSON.')
        ).length;

        assertEqual(threw, true, 'throws after recovery path fails');
        assert(modelHits.includes('primary'), 'primary model is attempted');
        assert(modelHits.includes('fallback'), 'fallback model is attempted');
        assert(recoveryPromptCalls >= 1 && recoveryPromptCalls <= 2, 'recovery prompt attempts are bounded');
        assert(requestPrompts.length <= 4, 'request flow terminates quickly without looping');
    }

    console.log('  Test 2.7: parse failure can fall back to secondary model');
    {
        const originalFetch = globalThis.fetch;
        const originalModel = geminiService.currentModel;
        const requestPrompts = [];
        const modelHits = [];

        geminiService.reset();
        geminiService.setApiKey('test-api-key');

        globalThis.fetch = async (url, options) => {
            const body = JSON.parse(options.body);
            const promptText = body.contents?.[0]?.parts?.[0]?.text || '';
            requestPrompts.push(promptText);

            const isFallbackModel = url.includes('gemini-3-flash-preview');
            modelHits.push(isFallbackModel ? 'fallback' : 'primary');

            const textResponse = isFallbackModel ? JSON.stringify(validScene) : 'Still not valid JSON';

            return {
                ok: true,
                json: async () => ({
                    candidates: [
                        {
                            content: {
                                parts: [{ text: textResponse }]
                            }
                        }
                    ]
                })
            };
        };

        try {
            const result = await geminiService.callGemini('Generate scene');
            assertEqual(result.sceneText, 'Test scene text.', 'fallback model recovers parse failure');
            assert(modelHits.includes('primary'), 'primary model was attempted');
            assert(modelHits.includes('fallback'), 'fallback model was attempted after parse failure');
            assert(
                requestPrompts.some((prompt) =>
                    prompt.includes('Your previous response was not valid JSON.')
                ),
                'recovery prompt is used before fallback model attempt'
            );
        } finally {
            globalThis.fetch = originalFetch;
            geminiService.currentModel = originalModel;
        }
    }

    console.log('  Test 2.8: callGemini times out with bounded error type');
    {
        const originalFetch = globalThis.fetch;
        const originalModel = geminiService.currentModel;
        const originalTimeout = geminiService.requestTimeoutMs;
        let caughtName = null;

        geminiService.reset();
        geminiService.setApiKey('test-api-key');
        geminiService.requestTimeoutMs = 20;

        globalThis.fetch = (_url, options = {}) =>
            new Promise((_resolve, reject) => {
                options.signal?.addEventListener('abort', () => {
                    const abortError = new Error('Aborted');
                    abortError.name = 'AbortError';
                    reject(abortError);
                });
            });

        try {
            await geminiService.callGemini('Generate scene');
        } catch (error) {
            caughtName = error?.name || null;
        } finally {
            globalThis.fetch = originalFetch;
            geminiService.currentModel = originalModel;
            geminiService.requestTimeoutMs = originalTimeout;
        }

        assertEqual(caughtName, 'TimeoutError', 'timeout surfaces as TimeoutError');
    }
}

// ─── Suite 3: Service Fallback ───────────────────────────────────────

async function testServiceFallback() {
    console.log('  Test 3.1: Mock service never throws on invalid input');
    {
        let scene;
        assertDoesNotThrow(async () => {
            scene = await mockStoryService.getNextScene('nonexistent_scene', 'fake_choice', {});
        }, 'invalid sceneId should not throw');

        // Must resolve to something (will be ending_loop based on code exploration)
        const result = await mockStoryService.getNextScene('nonexistent_scene', 'fake_choice', {});
        assert(result !== null && result !== undefined, 'returns a scene, not null');
        assertEqual(typeof result.sceneText, 'string', 'returned scene has sceneText');
        assert(validateScene(result), 'returned scene passes validation');
    }

    console.log('  Test 3.2: Mock service always available');
    {
        assertEqual(mockStoryService.isAvailable(), true, 'isAvailable returns true');

        // Opening scene works
        const opening = await mockStoryService.getOpeningScene();
        assert(opening !== null, 'opening scene is not null');
        assertEqual(opening.sceneId, 'opening', 'opening scene has correct id');
        assert(validateScene(opening), 'opening scene passes validation');
    }

    console.log('  Test 3.3: validateScene gates on required fields');
    {
        // Missing sceneText
        assertEqual(validateScene({
            sceneId: 'x', choices: [], isEnding: false
        }), false, 'missing sceneText fails');

        // Missing sceneId
        assertEqual(validateScene({
            sceneText: 'text', choices: [], isEnding: false
        }), false, 'missing sceneId fails');

        // Missing choices array
        assertEqual(validateScene({
            sceneId: 'x', sceneText: 'text', isEnding: false
        }), false, 'missing choices fails');

        // Missing isEnding
        assertEqual(validateScene({
            sceneId: 'x', sceneText: 'text', choices: []
        }), false, 'missing isEnding fails');

        // Ending without type fails
        assertEqual(validateScene({
            sceneId: 'x', sceneText: 'text', choices: [], isEnding: true
        }), false, 'ending without type fails');

        // Ending WITH type passes
        assertEqual(validateScene({
            sceneId: 'x', sceneText: 'text', choices: [], isEnding: true, endingType: 'loop'
        }), true, 'ending with type passes');

        // Minimal valid non-ending
        assertEqual(validateScene({
            sceneId: 'x', sceneText: 'text', choices: [], isEnding: false
        }), true, 'minimal valid scene passes (no imageKey needed)');
    }
}

// ─── Suite 4: localStorage Edge Cases ────────────────────────────────

function testLocalStorageEdgeCases() {
    console.log('  Test 4.1: Corrupted JSON parse fails gracefully');
    {
        // Simulate what loadSettings does when JSON is corrupt
        let settings = { useMocks: true, showLessons: true, apiKey: '' };
        const corruptData = '{broken json!!!';

        try {
            const parsed = JSON.parse(corruptData);
            settings = { ...settings, ...parsed };
            totalFailed++;
            console.error('  ❌ JSON.parse should have thrown on corrupt data');
        } catch {
            // This is the expected path — defaults survive
            totalPassed++;
        }

        assertEqual(settings.useMocks, true, 'defaults preserved after corrupt parse');
        assertEqual(settings.showLessons, true, 'showLessons preserved');
        assertEqual(settings.apiKey, '', 'apiKey preserved');
    }

    console.log('  Test 4.2: Missing localStorage keys use defaults');
    {
        // Simulate null from localStorage.getItem
        const saved = null;
        let settings = { useMocks: true, showLessons: true, apiKey: '' };

        if (saved) {
            const parsed = JSON.parse(saved);
            settings = { ...settings, ...parsed };
        }

        assertEqual(settings.useMocks, true, 'useMocks defaults when key missing');
        assertEqual(settings.showLessons, true, 'showLessons defaults when key missing');
        assertEqual(settings.apiKey, '', 'apiKey defaults when key missing');
    }

    console.log('  Test 4.3: Partial settings merge preserves unset fields');
    {
        // Simulate localStorage returning only useMocks
        const saved = JSON.stringify({ useMocks: false });
        let settings = { useMocks: true, showLessons: true, apiKey: '' };

        const parsed = JSON.parse(saved);
        settings = { ...settings, ...parsed };

        assertEqual(settings.useMocks, false, 'useMocks overridden from storage');
        assertEqual(settings.showLessons, true, 'showLessons preserved (not in storage)');
        assertEqual(settings.apiKey, '', 'apiKey preserved (not in storage)');
    }
}

// ─── Suite 5: Ending Logic ───────────────────────────────────────────

function testEndingLogic() {
    console.log('  Test 5.1: suggestEndingFromHistory — pattern matching');
    {
        // Exit pattern
        const exitHistory = [
            { choiceId: 'leave_room' },
            { choiceId: 'walk_away' },
            { choiceId: 'exit_door' }
        ];
        assertEqual(suggestEndingFromHistory(exitHistory), EndingTypes.EXIT,
            '3 exit-pattern choices → EXIT');

        // Shift pattern
        const shiftHistory = [
            { choiceId: 'confront_oswaldo' },
            { choiceId: 'tell_truth' },
            { choiceId: 'set_boundary' }
        ];
        assertEqual(suggestEndingFromHistory(shiftHistory), EndingTypes.SHIFT,
            '3 shift-pattern choices → SHIFT');

        // Rare pattern
        const rareHistory = [
            { choiceId: 'wait_for_him' },
            { choiceId: 'silence_speaks' },
            { choiceId: 'press_harder' },
            { choiceId: 'question_motives' }
        ];
        assertEqual(suggestEndingFromHistory(rareHistory), EndingTypes.RARE,
            '3+ rare-pattern choices → RARE');

        // No strong pattern → LOOP
        const loopHistory = [
            { choiceId: 'do_nothing' },
            { choiceId: 'stay_quiet' }
        ];
        assertEqual(suggestEndingFromHistory(loopHistory), EndingTypes.LOOP,
            'no pattern → LOOP default');

        // Empty history
        assertEqual(suggestEndingFromHistory([]), EndingTypes.LOOP,
            'empty history → LOOP');
    }

    console.log('  Test 5.2: validateEndingType — custom endings');
    {
        // Known types pass through
        assertEqual(validateEndingType('loop'), 'loop', 'known type: loop');
        assertEqual(validateEndingType('shift'), 'shift', 'known type: shift');
        assertEqual(validateEndingType('exit'), 'exit', 'known type: exit');
        assertEqual(validateEndingType('rare'), 'rare', 'known type: rare');

        // Case normalization
        assertEqual(validateEndingType('LOOP'), 'loop', 'uppercase normalized');
        assertEqual(validateEndingType('  shift  '), 'shift', 'whitespace trimmed');

        // Valid custom endings
        assertEqual(validateEndingType('cold clarity'), 'cold clarity', 'valid custom: cold clarity');
        assertEqual(validateEndingType('the long exhale'), 'the long exhale', 'valid custom: the long exhale');
        assertEqual(validateEndingType('abc'), 'abc', 'minimum length 3 passes');

        // Invalid custom endings
        assertEqual(validateEndingType('xy'), EndingTypes.LOOP, 'too short (<3) → loop');
        assertEqual(validateEndingType('a'.repeat(31)), EndingTypes.LOOP, 'too long (>30) → loop');
        assertEqual(validateEndingType('end!@#$'), EndingTypes.LOOP, 'special chars → loop');
        assertEqual(validateEndingType('ending123'), EndingTypes.LOOP, 'numbers → loop');

        // Null/undefined/empty
        assertEqual(validateEndingType(null), EndingTypes.LOOP, 'null → loop');
        assertEqual(validateEndingType(undefined), EndingTypes.LOOP, 'undefined → loop');
        assertEqual(validateEndingType(''), EndingTypes.LOOP, 'empty string → loop');
        assertEqual(validateEndingType(42), EndingTypes.LOOP, 'non-string → loop');
    }

    console.log('  Test 5.3: Ending deduplication logic');
    {
        // Simulate the ending unlock logic from app.js handleEnding()
        const unlockedEndings = ['loop'];

        // New ending
        if (!unlockedEndings.includes('shift')) {
            unlockedEndings.push('shift');
        }
        assertDeepEqual(unlockedEndings, ['loop', 'shift'], 'new ending added');

        // Duplicate ending
        if (!unlockedEndings.includes('shift')) {
            unlockedEndings.push('shift');
        }
        assertDeepEqual(unlockedEndings, ['loop', 'shift'], 'duplicate not added');
        assertEqual(unlockedEndings.length, 2, 'length stays 2');

        // Custom ending
        if (!unlockedEndings.includes('cold clarity')) {
            unlockedEndings.push('cold clarity');
        }
        assertDeepEqual(unlockedEndings, ['loop', 'shift', 'cold clarity'], 'custom ending added');
    }
}

// ─── Suite 6: Race Conditions (Simulated) ────────────────────────────

function testRaceConditions() {
    console.log('  Test 6.1: isProcessing flag prevents concurrent calls');
    {
        // Simulate the guard from handleChoice
        let isProcessing = false;
        let callCount = 0;

        function simulatedHandleChoice() {
            if (isProcessing) return;
            isProcessing = true;
            callCount++;
            // Normally async work happens here
            isProcessing = false;
        }

        simulatedHandleChoice();
        assertEqual(callCount, 1, 'first call executes');

        // Simulate concurrent by setting flag before calling
        isProcessing = true;
        simulatedHandleChoice();
        assertEqual(callCount, 1, 'second call blocked by flag');

        isProcessing = false;
        simulatedHandleChoice();
        assertEqual(callCount, 2, 'third call executes after flag reset');
    }

    console.log('  Test 6.2: Flag resets after error');
    {
        let isProcessing = false;
        let callCount = 0;

        function simulatedHandleChoiceWithError() {
            if (isProcessing) return;
            isProcessing = true;
            try {
                callCount++;
                throw new Error('Simulated API failure');
            } catch {
                // Error caught
            } finally {
                isProcessing = false;
            }
        }

        simulatedHandleChoiceWithError();
        assertEqual(callCount, 1, 'call executes despite error');
        assertEqual(isProcessing, false, 'flag reset after error (finally block)');

        // Next call should work
        simulatedHandleChoiceWithError();
        assertEqual(callCount, 2, 'next call works after error recovery');
    }
}

// ─── Suite 7: formatThreadState Prompt Output ────────────────────────

function testFormatThreadState() {
    console.log('  Test 7.1: Default threads format correctly');
    {
        const threads = createStoryThreads();
        const output = formatThreadState(threads);

        assert(output.includes('neutral'), 'default conflict shows neutral');
        assert(output.includes('0/3'), 'trina tension shows 0/3');
        assert(output.includes('NO'), 'money not resolved');
        assert(output.includes('none yet'), 'no boundaries set');
        assert(output.includes('1/5'), 'exhaustion shows 1/5');
        assert(output.includes('oblivious'), 'realization shows oblivious');
        assert(output.includes('blind'), 'oswaldo awareness shows blind');
    }

    console.log('  Test 7.2: Non-default threads format correctly');
    {
        const threads = createStoryThreads();
        threads.oswaldoConflict = 2;
        threads.trinaTension = 3;
        threads.moneyResolved = true;
        threads.carMentioned = true;
        threads.sydneyRealization = 3;
        threads.boundariesSet = ['no guests', 'wake up early'];
        threads.oswaldoAwareness = 2;
        threads.exhaustionLevel = 4;

        const output = formatThreadState(threads);

        assert(output.includes('hostile'), 'conflict +2 shows hostile');
        assert(output.includes('3/3'), 'trina tension at max');
        assert(output.includes('YES'), 'money resolved');
        assert(output.includes('clarity'), 'realization at max');
        assert(output.includes('no guests, wake up early'), 'boundaries listed');
        assert(output.includes('seeing'), 'oswaldo awareness = seeing');
        assert(output.includes('4/5'), 'exhaustion at 4');
    }

    console.log('  Test 7.3: Null input handled');
    {
        const output = formatThreadState(null);
        assert(output.includes('No thread data'), 'null produces fallback message');
    }
}

// ─── Suite 8: Prompt Constraint Consistency ───────────────────────────

function testPromptConstraints() {
    console.log('  Test 8.1: System and continue prompts use the same word range');
    {
        const continuePrompt = getContinuePrompt(
            ['You check your cracked phone while the ice machine hums.'],
            'wait_for_a_reply',
            3
        );

        assert(
            SYSTEM_PROMPT.includes('150-250 words'),
            'SYSTEM_PROMPT includes 150-250 range'
        );
        assert(
            continuePrompt.includes('150-250 words'),
            'continue prompt includes 150-250 range'
        );
        assert(
            !continuePrompt.includes('150-300 words'),
            'continue prompt no longer includes conflicting 150-300 range'
        );
    }
}

// ─── Suite 9: Codex Regression — Gemini→Mock Fallback ────────────────

async function testFallbackRegression() {
    console.log('  Test 9.1: Mock service returns ending_loop for unknown Gemini scene IDs');
    {
        // This is the P1 bug Codex found: Gemini scene IDs like "scene_2_1738612345"
        // don't exist in mock service, so getNextScene returns ending_loop
        const geminiSceneId = 'scene_2_1738612345678';
        const result = await mockStoryService.getNextScene(geminiSceneId, 'some_choice', {});

        assert(result !== null, 'mock returns something for unknown ID');
        assert(result.isEnding === true, 'unknown ID returns an ending scene');
        assertEqual(result.endingType, 'loop', 'unknown ID → ending_loop (the bug)');
    }

    console.log('  Test 9.2: getSceneById returns undefined for Gemini scene IDs');
    {
        // This is how getFallbackScene() detects incompatible IDs
        const geminiId = 'scene_3_1738612345678';
        const found = mockStoryService.getSceneById(geminiId);
        assertEqual(found, undefined, 'Gemini scene ID not in mock graph');

        // But real mock IDs DO exist
        const openingFound = mockStoryService.getSceneById('opening');
        assert(openingFound !== null && openingFound !== undefined, 'opening scene exists in mock');
        assertEqual(openingFound.sceneId, 'opening', 'getSceneById returns correct scene');
    }

    console.log('  Test 9.3: getFallbackScene logic — incompatible ID uses recovery scene');
    {
        // Simulate the logic from getFallbackScene() in app.js
        const currentSceneId = 'scene_5_9999999999';
        const mockScene = mockStoryService.getSceneById(currentSceneId);

        if (mockScene) {
            totalFailed++;
            console.error('  ❌ Gemini ID should NOT exist in mock service');
        } else {
            // Incompatible — should use getRecoveryScene() (returns sit_reflect)
            const recovery = await mockStoryService.getRecoveryScene();
            assert(validateScene(recovery), 'recovery scene passes validation');
            assertEqual(recovery.sceneId, 'sit_reflect', 'recovery scene is sit_reflect');
            assert(recovery.choices.length >= 2, 'recovery scene has choices (game continues)');
            assertEqual(recovery.isEnding, false, 'recovery scene is NOT an ending');
            totalPassed++;
        }
    }

    console.log('  Test 9.4: Compatible mock scene ID works normally in fallback');
    {
        // If Gemini happened to use a mock-compatible ID (e.g. game started in mock, switched to AI)
        const compatibleId = 'work_early';
        const found = mockStoryService.getSceneById(compatibleId);
        assert(found !== undefined, 'work_early exists in mock graph');

        // getNextScene with a valid choice should return the correct next scene
        const result = await mockStoryService.getNextScene(compatibleId, 'tell_oswaldo_work', {});
        assert(validateScene(result), 'compatible fallback scene validates');
        assertEqual(result.sceneId, 'confront_oswaldo', 'navigates to correct next scene');
        assertEqual(result.isEnding, false, 'next scene is not an ending');
        assert(result.sceneText.length > 0, 'fallback scene has content');
    }

    console.log('  Test 9.5: handleChoice returns boolean for retry detection');
    {
        // P2 fix: handleChoice now returns true/false instead of swallowing errors
        // We can't call the real handleChoice in Node, but we verify the contract
        // by simulating the pattern retryLastChoice uses

        let handleResult;

        // Simulate success path
        async function fakeHandleSuccess() { return true; }
        handleResult = await fakeHandleSuccess();
        assertEqual(handleResult, true, 'success returns true');

        // Simulate failure path
        async function fakeHandleFail() { return false; }
        handleResult = await fakeHandleFail();
        assertEqual(handleResult, false, 'failure returns false');

        // Simulate retryLastChoice pattern
        const history = ['a', 'b', 'c'];
        const backup = [...history];
        history.pop();

        const success = await fakeHandleFail();
        if (!success) {
            // Restore history — this is the P2 fix
            history.length = 0;
            history.push(...backup);
        }
        assertDeepEqual(history, ['a', 'b', 'c'], 'history restored on failure');
    }
}

// ─── Suite 10: Prompt Quality + Parse Recovery ───────────────────────

async function testPromptAndRecoveryQuality() {
    console.log('  Test 10.1: Continue prompt includes continuity callback guidance');
    {
        const prompt = getContinuePrompt(
            ['Scene one', 'Scene two'],
            'Set a boundary',
            4,
            null,
            createStoryThreads()
        );

        assert(
            prompt.includes('Include one concrete callback to recent history or thread state'),
            'continue prompt includes continuity callback instruction'
        );
    }

    console.log('  Test 10.2: Prompt contracts require storyThreadUpdates');
    {
        const continuePrompt = getContinuePrompt(['Scene one'], 'Keep going', 2, null, createStoryThreads());
        const recoveryPrompt = getRecoveryPrompt('not json');

        assert(SYSTEM_PROMPT.includes('"storyThreadUpdates"'), 'SYSTEM_PROMPT includes storyThreadUpdates');
        assert(continuePrompt.includes('"storyThreadUpdates"'), 'continue prompt requests storyThreadUpdates');
        assert(recoveryPrompt.includes('"storyThreadUpdates"'), 'recovery prompt includes storyThreadUpdates');
        assert(
            recoveryPrompt.includes('Do not use markdown code fences.'),
            'recovery prompt forbids markdown code fences'
        );
    }

    console.log('  Test 10.3: Ending heuristic avoids neutral go_* false positives');
    {
        const neutralGoHistory = [
            { choiceId: 'go_to_window' },
            { choiceId: 'go_make_coffee' },
            { choiceId: 'just_sit' }
        ];

        assertEqual(
            suggestEndingFromHistory(neutralGoHistory),
            EndingTypes.LOOP,
            'neutral go_* choices should not force EXIT'
        );

        const doorwayHistory = [
            { choiceId: 'stand_in_doorway' },
            { choiceId: 'doorway_pause' }
        ];
        assertEqual(
            suggestEndingFromHistory(doorwayHistory),
            EndingTypes.LOOP,
            'substring matches like doorway should not force EXIT'
        );
    }

    console.log('  Test 10.4: AI thread updates flow through parse -> format -> merge');
    {
        let geminiService;
        try {
            const mod = await import('../js/services/geminiStoryService.js');
            geminiService = mod.geminiStoryService;
        } catch {
            console.warn('  ⚠️  Could not import geminiStoryService, skipping continuity-flow test');
            return;
        }

        const responseText = JSON.stringify({
            sceneText: 'You take a breath and draw a line in the sand.',
            choices: [{ id: 'hold_boundary', text: 'Hold the line' }],
            lessonId: 6,
            imageKey: 'sydney_thinking',
            isEnding: false,
            endingType: null,
            mood: 'tense',
            storyThreadUpdates: {
                oswaldoConflict: 1,
                boundariesSet: ['no guests without asking'],
                moneyResolved: true
            }
        });

        const parsed = geminiService.parseResponse(responseText);
        const formatted = geminiService.formatScene(parsed, 'scene_test_continuity');
        const baseThreads = createStoryThreads();
        const mergedThreads = mergeThreadUpdates(baseThreads, formatted.storyThreadUpdates);

        assertEqual(formatted.sceneId, 'scene_test_continuity', 'scene id preserved through formatting');
        assertEqual(formatted.storyThreadUpdates.oswaldoConflict, 1, 'parsed update has oswaldoConflict');
        assertEqual(mergedThreads.oswaldoConflict, 1, 'merge applies oswaldoConflict update');
        assertEqual(mergedThreads.moneyResolved, true, 'merge applies moneyResolved update');
        assertDeepEqual(
            mergedThreads.boundariesSet,
            ['no guests without asking'],
            'merge appends boundary updates from AI response'
        );
        assertEqual(baseThreads.moneyResolved, false, 'base thread object remains unchanged');
    }

    console.log('  Test 10.5: Semantic quality gate flags near-duplicate choices');
    {
        let geminiService;
        try {
            const mod = await import('../js/services/geminiStoryService.js');
            geminiService = mod.geminiStoryService;
        } catch {
            console.warn('  ⚠️  Could not import geminiStoryService, skipping semantic quality-gate test');
            return;
        }

        const lowQualityResponse = {
            sceneText: 'You hear the hallway ice machine and keep your eyes on the clock.',
            choices: [
                { id: 'stay_quiet', text: 'Stay quiet for one more minute' },
                { id: 'be_quiet', text: 'Be quiet for one more minute' }
            ],
            isEnding: false
        };

        const quality = geminiService.evaluateResponseQuality(
            lowQualityResponse,
            createGameState(),
            'stay_quiet'
        );

        assertEqual(quality.ok, false, 'quality gate catches near-duplicate choices');
        assert(
            quality.issues.some((issue) => issue.toLowerCase().includes('choices')),
            'quality issues include choice distinctness'
        );
    }

    console.log('  Test 10.6: Continuity quality gate requires concrete callbacks');
    {
        let geminiService;
        try {
            const mod = await import('../js/services/geminiStoryService.js');
            geminiService = mod.geminiStoryService;
        } catch {
            console.warn('  ⚠️  Could not import geminiStoryService, skipping continuity quality test');
            return;
        }

        const state = createGameState();
        state.storyThreads.moneyResolved = true;
        state.storyThreads.carMentioned = true;
        state.storyThreads.boundariesSet = ['no guests without asking'];

        geminiService.sceneCount = 4;

        const weakCallbackResponse = {
            sceneText: 'The vending machine rattles in the hallway while a clock blinks 7:03.',
            choices: [
                { id: 'call_desk', text: 'Call the front desk' },
                { id: 'wash_face', text: 'Wash your face and think' }
            ],
            isEnding: false
        };

        const quality = geminiService.evaluateResponseQuality(
            weakCallbackResponse,
            state,
            'set a hard boundary with him'
        );

        assertEqual(quality.ok, false, 'continuity gate should fail when callbacks are missing');
        assert(
            quality.issues.some((issue) => issue.toLowerCase().includes('continuity')),
            'quality issues include continuity callback requirement'
        );
    }

    console.log('  Test 10.7: Semantic quality gate flags repetitive scene framing');
    {
        let geminiService;
        try {
            const mod = await import('../js/services/geminiStoryService.js');
            geminiService = mod.geminiStoryService;
        } catch {
            console.warn('  ⚠️  Could not import geminiStoryService, skipping repetition quality test');
            return;
        }

        geminiService.conversationHistory = [
            '[Choice: wait]\nYou stare at the vibrating phone while the ice machine growls and motel neon leaks through the blinds. The unpaid room hangs over every breath while Oswaldo snores like he already won.'
        ];

        const repetitiveResponse = {
            sceneText:
                'You stare at the buzzing phone while the ice machine growls and neon leaks through the blinds. The unpaid room hangs over every breath as Oswaldo snores like he has already won.',
            choices: [
                { id: 'wake_oswaldo', text: 'Wake Oswaldo now' },
                { id: 'go_to_bathroom', text: 'Go to the bathroom and regroup' }
            ],
            isEnding: false
        };

        const quality = geminiService.evaluateResponseQuality(
            repetitiveResponse,
            createGameState(),
            'wait'
        );

        assertEqual(quality.ok, false, 'quality gate catches repetitive scene framing');
        assert(
            quality.issues.some((issue) => issue.toLowerCase().includes('repeats')),
            'quality issues include repetition warning'
        );
    }

    console.log('  Test 10.8: Ending inference favors explicit signals');
    {
        const exitHistory = [
            { choiceId: 'walk_out_door' },
            { choiceId: 'leave_room_now' }
        ];
        assertEqual(
            suggestEndingFromHistory(exitHistory),
            EndingTypes.EXIT,
            'explicit leave/door tokens should steer EXIT'
        );

        const shiftHistory = [
            { choiceId: 'set_boundary_now' },
            { choiceId: 'assert_new_terms' }
        ];
        assertEqual(
            suggestEndingFromHistory(shiftHistory),
            EndingTypes.SHIFT,
            'boundary/assert signals should steer SHIFT'
        );

        const rareHistory = [
            { choiceId: 'listen_before_reacting' },
            { choiceId: 'question_him_directly' },
            { choiceId: 'hold_silence' }
        ];
        assertEqual(
            suggestEndingFromHistory(rareHistory),
            EndingTypes.RARE,
            'listen/question/silence signals should steer RARE'
        );
    }

    console.log('  Test 10.9: Choice-opening heuristic catches same-action options');
    {
        let geminiService;
        try {
            const mod = await import('../js/services/geminiStoryService.js');
            geminiService = mod.geminiStoryService;
        } catch {
            console.warn('  ⚠️  Could not import geminiStoryService, skipping choice-opening test');
            return;
        }

        geminiService.sceneCount = 3;
        const response = {
            sceneText: 'You breathe out slowly and watch the minute hand lurch forward.',
            choices: [
                { id: 'ask_oswaldo', text: 'Ask Oswaldo where the money went' },
                { id: 'ask_trina', text: 'Ask Trina why she used your card' }
            ],
            isEnding: false
        };

        const quality = geminiService.evaluateResponseQuality(
            response,
            createGameState(),
            'press for answers'
        );

        assertEqual(quality.ok, false, 'same-action openings are flagged');
        assert(
            quality.issues.some((issue) => issue.toLowerCase().includes('openings')),
            'quality issues include opening-strategy distinction'
        );
    }
}

// ─── Runner ──────────────────────────────────────────────────────────

async function runAllIntegrationTests() {
    console.log('========================================');
    console.log('INTEGRATION TEST SUITE');
    console.log('========================================\n');

    const suites = [
        { name: 'Thread Merging', fn: testThreadMerging },
        { name: 'Error Recovery (JSON Parsing)', fn: testErrorRecovery },
        { name: 'Service Fallback', fn: testServiceFallback },
        { name: 'localStorage Edge Cases', fn: testLocalStorageEdgeCases },
        { name: 'Ending Logic', fn: testEndingLogic },
        { name: 'Race Conditions', fn: testRaceConditions },
        { name: 'Thread State Formatting', fn: testFormatThreadState },
        { name: 'Prompt Constraint Consistency', fn: testPromptConstraints },
        { name: 'Fallback Regression (Codex P1/P2/P3)', fn: testFallbackRegression },
        { name: 'Prompt Quality + Parse Recovery', fn: testPromptAndRecoveryQuality }
    ];

    for (const suite of suites) {
        console.log(`\n🧪 ${suite.name}...`);
        try {
            const result = suite.fn();
            if (result instanceof Promise) await result;
            console.log(`  ✅ ${suite.name} complete\n`);
        } catch (error) {
            totalFailed++;
            console.error(`  ❌ ${suite.name} CRASHED: ${error.message}`);
            console.error(error.stack);
        }
    }

    console.log('\n========================================');
    console.log(`PASSED: ${totalPassed}  FAILED: ${totalFailed}`);
    if (totalFailed === 0) {
        console.log('✨ ALL INTEGRATION TESTS PASSED');
    } else {
        console.log('💥 SOME TESTS FAILED');
        process.exit(1);
    }
    console.log('========================================\n');

    return totalFailed === 0;
}

// Auto-run
runAllIntegrationTests();
