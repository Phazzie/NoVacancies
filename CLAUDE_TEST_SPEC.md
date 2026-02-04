# Complex Integration Test Specification (Claude)

## Objective

Test high-risk state management, error handling, and service integration paths that are most likely to fail in production.

## Test File: `tests/integrationTest.js`

---

## Test Suite 1: State Merge Logic (storyThreads)

### Test 1.1: Thread Updates - Normal Merge

**Risk:** Most common path, must work flawlessly

```javascript
Given: gameState with default threads (oswaldoConflict: 0, trinaTension: 0, ...)
When: Scene returns storyThreadUpdates: {oswaldoConflict: 2, trinaTension: 1}
Then:
  - gameState.storyThreads.oswaldoConflict === 2
  - gameState.storyThreads.trinaTension === 1
  - All other thread values unchanged
  - boundariesSet array unchanged
```

### Test 1.2: Thread Updates - Array Append (boundariesSet)

**Risk:** Array handling differs from primitive updates, easy to break

```javascript
Given: gameState.storyThreads.boundariesSet = ['no guests']
When: Scene returns storyThreadUpdates: {boundariesSet: ['wake up early', 'no phone snooping']}
Then:
  - boundariesSet === ['no guests', 'wake up early', 'no phone snooping']
  - Length is 3 (append, not replace)
  - Original array not mutated (no reference issues)

Edge Case:
When: Scene returns storyThreadUpdates: {boundariesSet: []}
Then:
  - boundariesSet unchanged (empty array means nothing to add)
```

### Test 1.3: Thread Updates - Partial Updates Only

**Risk:** AI might return sparse updates, shouldn't clobber existing state

```javascript
Given: All threads set to non-default values
When: Scene returns storyThreadUpdates: {sydneyRealization: 2} (only 1 field)
Then:
  - sydneyRealization === 2
  - All other 7 fields retain original values
  - No fields set to undefined/null
```

### Test 1.4: Thread Updates - Invalid Values Ignored

**Risk:** AI might return out-of-range or wrong-type values

```javascript
When: Scene returns {oswaldoConflict: 10} (max is 2)
Then: oswaldoConflict set to 10 (we accept it - AI knows best)

When: Scene returns {trinaTension: 'high'} (should be number)
Then: trinaTension unchanged (string rejected)

When: Scene returns {moneyResolved: 'yes'} (should be boolean)
Then: moneyResolved unchanged (invalid type)
```

### Test 1.5: Thread Updates - Undefined/Null Handling

**Risk:** Missing storyThreadUpdates or null values could crash

```javascript
When: Scene has no storyThreadUpdates property
Then: No error thrown, all threads unchanged

When: Scene.storyThreadUpdates = null
Then: No error thrown, all threads unchanged

When: Scene.storyThreadUpdates = {sydneyRealization: undefined}
Then: sydneyRealization unchanged (undefined means "no update")
```

---

## Test Suite 2: Error Injection & Recovery

### Test 2.1: Gemini API Network Failure

**Risk:** Network drops mid-game, user sees confusing error

```javascript
Given: geminiService configured with valid API key
When: Mock fetch to throw NetworkError
Then:
  - Fallback to mockStoryService triggered
  - Next scene generated from mock service
  - gameState.useMocks set to true (mode switched)
  - User sees scene (no blank screen)
  - Console shows '[App] Gemini failed, using mock'
```

### Test 2.2: Gemini API 429 Rate Limit

**Risk:** Demo hits rate limit, no retry logic

```javascript
Given: geminiService call #1 succeeds
When: Call #2 returns 429 Too Many Requests
Then:
  - Error caught and logged
  - Fallback to mockService OR retry with exponential backoff
  - User not stuck on loading screen
  - Error message mentions rate limit (not generic "something went wrong")
```

### Test 2.3: Invalid JSON Response from Gemini

**Risk:** AI returns malformed JSON, parser crashes

```javascript
When: Gemini returns "Here is the scene: {sceneText: ...}" (prose + JSON)
Then:
  - parseResponse() extracts JSON from text
  - Scene validates successfully
  - No JSON.parse() exception propagates

When: Gemini returns completely invalid JSON
Then:
  - Fallback to mock service
  - Error logged with partial response (first 200 chars)
  - User can continue playing
```

### Test 2.4: Missing Required Scene Fields

**Risk:** AI omits sceneText or choices, validateScene() fails

```javascript
When: Gemini returns {sceneText: 'text', choices: [], isEnding: false} (no imageKey, lessonId)
Then:
  - Scene enriched with defaults (imageKey: 'hotel_room', lessonId: null)
  - Validation passes
  - Render doesn't crash

When: Gemini returns {choices: [...]} (missing sceneText)
Then:
  - Validation fails
  - Fallback to mock service
  - User sees error OR mock scene (never blank screen)
```

---

## Test Suite 3: Service Fallback Behavior

### Test 3.1: AI → Mock Transition Mid-Game

**Risk:** Switching services mid-playthrough breaks continuity

```javascript
Given: Playing with geminiService, 3 scenes deep
When: Scene 4 fetch fails, switches to mockService
Then:
  - Game continues with mock scenes
  - History intact (3 AI scenes + new mock scenes)
  - No duplicate scene IDs
  - Endings still reachable
```

### Test 3.2: Mock Service Always Available

**Risk:** Both services fail, game unplayable

```javascript
When: geminiService.getOpeningScene() throws error
Then: mockService.getOpeningScene() called as fallback

When: mockService also throws error (corrupt data)
Then:
  - Graceful error message: "Story data unavailable. Please refresh."
  - No infinite error loop
  - Start button doesn't brick
```

### Test 3.3: API Key Validation Before Service Switch

**Risk:** Invalid API key format causes unnecessary API calls

```javascript
When: API key = 'invalid_format_123' (not AIza...)
Then:
  - Warning logged: "API key may be invalid"
  - Don't attempt Gemini call (fail fast)
  - Use mockService immediately

When: API key = '' (empty)
Then:
  - mockService used without API call
  - Settings UI shows "API key required" hint
```

---

## Test Suite 4: Async Race Conditions

### Test 4.1: Double-Click Choice Button

**Risk:** User clicks twice fast, triggers two parallel API calls

```javascript
Given: Scene rendered with 2 choices
When: User clicks choice 'A' twice within 100ms
Then:
  - Only ONE API call made
  - Second click ignored (button disabled)
  - History records 'A' exactly once
  - No duplicate scenes in conversation history
```

### Test 4.2: Slow API + Fast Navigation

**Risk:** User navigates away while API call pending

```javascript
Given: Gemini API call in progress (2s delay)
When: User clicks Back to Menu before response arrives
Then:
  - Pending request cancelled or ignored
  - Game state reset
  - No stale response rendered after navigation
  - No memory leak from abandoned promise
```

### Test 4.3: Concurrent getNextScene Calls

**Risk:** Parallel calls could corrupt conversation history

```javascript
When: Two getNextScene() calls fire simultaneously
Then:
  - Both complete without error
  - Conversation history sequential (no interleaving)
  - Scene IDs unique (no collisions)
  - storyThreads merge correctly (no lost updates)
```

---

## Test Suite 5: localStorage Edge Cases

### Test 5.1: Quota Exceeded

**Risk:** iOS Safari has 5MB limit, game state exceeds quota

```javascript
Given: localStorage at 95% capacity
When: Save gameState with 500+ history entries
Then:
  - Try-catch captures QuotaExceededError
  - User warned: "Storage full. History may be lost."
  - Game continues (doesn't crash)
  - Critical settings still saved (API key, mode)
```

### Test 5.2: localStorage Disabled (Private Browsing)

**Risk:** Private browsing mode throws on localStorage access

```javascript
Given: localStorage.setItem throws SecurityError
When: Save settings or endings
Then:
  - Error caught and logged
  - In-memory fallback used
  - User warned: "Settings won't persist (private browsing)"
  - Game playable without storage
```

### Test 5.3: Corrupted localStorage Data

**Risk:** Stored JSON is malformed, parse fails on load

```javascript
Given: localStorage['sydney-story-settings'] = '{broken json'
When: App initializes
Then:
  - JSON.parse() error caught
  - Default settings used
  - Corrupted data cleared
  - Console logs warning with corrupted data sample
```

---

## Test Suite 6: Choice History & Ending Logic

### Test 6.1: Ending Type Determination

**Risk:** suggestEndingFromHistory() picks wrong ending

```javascript
Given: history = [
  {choiceId: 'confront_oswaldo'},
  {choiceId: 'tell_truth'},
  {choiceId: 'set_boundary'}
]
When: suggestEndingFromHistory(history)
Then: Returns EndingTypes.SHIFT (3 shift-pattern choices)

Given: history = [
  {choiceId: 'leave_room'},
  {choiceId: 'walk_away'},
  {choiceId: 'exit_door'}
]
Then: Returns EndingTypes.EXIT (3 exit-pattern choices)

Given: history = [{choiceId: 'do_nothing'}, {choiceId: 'stay_quiet'}]
Then: Returns EndingTypes.LOOP (default, no strong pattern)
```

### Test 6.2: Custom Ending Validation

**Risk:** AI generates invalid ending types, breaks UI

```javascript
When: Scene.endingType = 'cold clarity' (valid custom, 3-30 chars)
Then: validateEndingType() returns 'cold clarity'

When: Scene.endingType = 'xy' (too short, <3 chars)
Then: validateEndingType() returns 'loop' (fallback)

When: Scene.endingType = 'a'.repeat(31) (too long, >30 chars)
Then: validateEndingType() returns 'loop' (fallback)

When: Scene.endingType = 'end!@#$' (invalid chars)
Then: validateEndingType() returns 'loop' (fallback)
```

### Test 6.3: Ending Unlocking & Persistence

**Risk:** Endings not saved, user loses progress

```javascript
Given: unlockedEndings = ['loop']
When: Reach 'shift' ending
Then:
  - unlockedEndings = ['loop', 'shift']
  - localStorage updated
  - Ending screen shows 2/4 unlocked

When: Reach 'shift' again
Then:
  - unlockedEndings still ['loop', 'shift'] (no duplicate)
```

---

## Implementation Requirements

### File Structure

```javascript
/**
 * Integration Tests - Complex State & Error Handling
 * Tests high-risk paths: state merges, API failures, race conditions
 */

import { createGameState, createStoryThreads, validateEndingType } from '../js/contracts.js';
import { suggestEndingFromHistory } from '../js/prompts.js';

// Mock fetch for error injection
let originalFetch;
function mockFetchError(errorType) {
    originalFetch = globalThis.fetch;
    globalThis.fetch = () => Promise.reject(new Error(errorType));
}

function restoreFetch() {
    if (originalFetch) globalThis.fetch = originalFetch;
}

export function testThreadMerging() {
    /* ... */
}
export function testErrorRecovery() {
    /* ... */
}
export function testServiceFallback() {
    /* ... */
}
export function testRaceConditions() {
    /* ... */
}
export function testLocalStorageEdgeCases() {
    /* ... */
}
export function testEndingLogic() {
    /* ... */
}

export function runAllIntegrationTests() {
    console.log('========================================');
    console.log('INTEGRATION TEST SUITE (COMPLEX)');
    console.log('========================================\n');

    const suites = [
        { name: 'Thread Merging', fn: testThreadMerging },
        { name: 'Error Recovery', fn: testErrorRecovery },
        { name: 'Service Fallback', fn: testServiceFallback },
        { name: 'Race Conditions', fn: testRaceConditions },
        { name: 'localStorage Edge Cases', fn: testLocalStorageEdgeCases },
        { name: 'Ending Logic', fn: testEndingLogic }
    ];

    let passed = 0,
        failed = 0;

    suites.forEach((suite) => {
        try {
            console.log(`\n🧪 ${suite.name}...`);
            suite.fn();
            console.log(`✅ ${suite.name} passed\n`);
            passed++;
        } catch (error) {
            console.error(`❌ ${suite.name} failed:`, error.message);
            console.error(error.stack);
            failed++;
        }
    });

    console.log('\n========================================');
    console.log(`INTEGRATION: ${passed} passed, ${failed} failed`);
    console.log('========================================\n');

    return failed === 0;
}
```

### Assertion Helpers

```javascript
function assertDeepEqual(actual, expected, message) {
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    if (!pass) {
        console.error(
            `${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`
        );
        throw new Error(message);
    }
}

function assertThrows(fn, message) {
    try {
        fn();
        throw new Error(`${message} - Expected error but none thrown`);
    } catch (e) {
        if (e.message.includes('Expected error')) throw e;
        // Expected error, pass
    }
}
```

---

## Total Test Count: 20 tests

- Suite 1: 5 tests (thread merging)
- Suite 2: 4 tests (error injection)
- Suite 3: 3 tests (service fallback)
- Suite 4: 3 tests (race conditions)
- Suite 5: 3 tests (localStorage)
- Suite 6: 3 tests (ending logic)

**Estimated Time:** 2 hours

---

## Deliverable

- `tests/integrationTest.js` with all 20 tests passing
- Minimum 60 assertions total (3 per test)
- Can run in Node.js (no DOM dependencies) OR browser
- Export runAllIntegrationTests() function
- Add to package.json: `"test:integration": "node tests/integrationTest.js"`
