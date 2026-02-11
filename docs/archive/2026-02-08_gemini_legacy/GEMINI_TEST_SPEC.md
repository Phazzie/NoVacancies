# Test Implementation Specification for Gemini

## CRITICAL INSTRUCTIONS - READ FIRST

**Your Role:** Implement 8 focused tests covering renderer, settings, and validation logic.

**Non-Negotiables:**

1. **NO SHORTCUTS** - Every assertion must test actual behavior, not assumed behavior
2. **NO MOCKING** - Test real DOM manipulation, not mocked elements
3. **EXPLICIT ASSERTIONS** - Use `console.assert(actual === expected, 'message')` with descriptive failure messages
4. **CLEAN UP** - Reset DOM state after each test (remove added elements)
5. **REAL DATA** - Use actual Scene/GameState objects from contracts.js, not fake data
6. **ERROR CASES** - Test what happens when data is invalid, not just happy paths

**Forbidden Practices:**

- ❌ `console.assert(true, 'test passes')` - This tests nothing
- ❌ Testing implementation details instead of behavior
- ❌ Assuming functions work without calling them
- ❌ Skipping edge cases because "they probably work"
- ❌ Using `assert(typeof x === 'object')` when you should test specific properties

---

## File to Create: `tests/rendererTest.js`

### Test Suite 1: DOM Element Rendering (25 minutes)

**Test 1.1: renderScene() - Scene Text Display**

```javascript
// Setup: Create a complete Scene object using createGameState() and real data
// Action: Call renderScene(scene, true)
// Assert:
//   1. #scene-text element contains exact sceneText
//   2. No HTML injection (< and > are escaped)
//   3. Text length matches scene.sceneText.length
//   4. Element is visible (not display: none)
```

**Test 1.2: renderScene() - Choice Buttons**

```javascript
// Setup: Scene with 3 choices: [{id: 'a', text: 'Choice A'}, {id: 'b', text: 'Choice B'}, {id: 'c', text: 'Choice C'}]
// Action: Call renderScene(scene, false)
// Assert:
//   1. Exactly 3 .choice-btn elements exist in DOM
//   2. First button has data-choice-id="a" attribute
//   3. First button text content is "Choice A" (exact match)
//   4. All buttons have class 'choice-btn'
//   5. No extra buttons from previous renders
// Cleanup: Clear #choices-container
```

**Test 1.3: renderScene() - Image Loading**

```javascript
// Setup: Scene with imageKey: 'sydney_laptop'
// Action: Call renderScene(scene, false)
// Assert:
//   1. #scene-image element exists
//   2. src attribute includes 'sydney_laptop'
//   3. alt attribute is not empty
// Edge case: Call with invalid imageKey 'xyz_invalid'
// Assert:
//   4. Falls back to hotel_room or shows error
```

**Test 1.4: renderScene() - Lesson Popup (When Enabled)**

```javascript
// Setup: Scene with lessonId: 5, showLessons: true
// Action: Call renderScene(scene, true)
// Wait: 100ms for potential async rendering
// Assert:
//   1. #lesson-popup has class 'active' or is visible
//   2. #lesson-title contains lesson 5 title (exact text from lessons.js)
//   3. #lesson-quote is not empty
// Cleanup: Call hideLessonPopup()
```

---

### Test Suite 2: Settings & State Sync (15 minutes)

**Test 2.1: updateSettingsUI() - Mode Toggle**

```javascript
// Setup: Create settings object {useMocks: true, showLessons: false, apiKey: 'test123'}
// Action: Call updateSettingsUI(settings)
// Assert:
//   1. #mode-mock element has class 'active'
//   2. #mode-ai element does NOT have class 'active'
//   3. #lessons-off has class 'active'
//   4. #lessons-on does NOT have class 'active'
// Action 2: Call with {useMocks: false, ...}
// Assert:
//   5. #mode-ai now has 'active', #mode-mock does not
```

**Test 2.2: updateSettingsUI() - API Key Section Visibility**

```javascript
// Setup: settings = {useMocks: true, apiKey: ''}
// Action: Call updateSettingsUI(settings)
// Assert:
//   1. #api-key-section has class 'hidden' or display: none
// Action 2: Call with {useMocks: false, apiKey: ''}
// Assert:
//   2. #api-key-section does NOT have 'hidden' class
//   3. Section is visible (getComputedStyle shows display !== 'none')
```

---

### Test Suite 3: Error Handling & Edge Cases (10 minutes)

**Test 3.1: showError() - Display & Auto-Hide**

```javascript
// Action: Call showError('Test error message')
// Assert:
//   1. Error element is visible in DOM
//   2. Error text contains 'Test error message' (exact match)
//   3. Error element has appropriate ARIA role for accessibility
// Wait: 100ms
// Assert:
//   4. Error still visible (shouldn't disappear immediately)
// Note: Don't test auto-hide timing, that's flaky
```

**Test 3.2: renderScene() - Empty Choices Array**

```javascript
// Setup: Scene with choices: []
// Action: Call renderScene(scene, false)
// Assert:
//   1. #choices-container exists
//   2. Container is empty OR shows appropriate message
//   3. No 'undefined' text in DOM
//   4. No JavaScript errors thrown
```

---

### Test Suite 4: Image Path Validation (5 minutes)

**Test 4.1: Image Path Mapping - All Keys Valid**

```javascript
// Setup: Import ImageKeys from contracts.js
// Action: For each key in ImageKeys:
//   - Get imagePath from imagePaths mapping in renderer.js
// Assert:
//   1. Every ImageKeys value has a corresponding imagePaths entry
//   2. No undefined paths
//   3. All paths start with 'images/'
//   4. All paths end with '.png'
// Expected: 13 image keys, 13 valid paths
```

---

## Implementation Guidelines

### File Structure

```javascript
/**
 * Renderer Test Suite
 * Tests DOM manipulation and UI updates
 */

import {
    renderScene,
    updateSettingsUI,
    showError,
    getElements,
    initRenderer
} from '../js/renderer.js';
import { createGameState, ImageKeys } from '../js/contracts.js';
import { lessons } from '../js/lessons.js';

// Initialize DOM elements before tests
if (typeof document === 'undefined') {
    console.error('❌ Tests must run in browser environment (not Node.js)');
    process.exit(1);
}

// Test Suite 1
export function testSceneRendering() {
    console.log('🎨 Testing Scene Rendering...\n');
    // ... implement Test 1.1-1.4
}

// Test Suite 2
export function testSettingsUI() {
    console.log('⚙️ Testing Settings UI...\n');
    // ... implement Test 2.1-2.2
}

// Test Suite 3
export function testErrorHandling() {
    console.log('🚨 Testing Error Handling...\n');
    // ... implement Test 3.1-3.2
}

// Test Suite 4
export function testImagePaths() {
    console.log('🖼️ Testing Image Paths...\n');
    // ... implement Test 4.1
}

// Run all tests
export function runAllRendererTests() {
    console.log('========================================');
    console.log('RENDERER TEST SUITE');
    console.log('========================================\n');

    let passed = 0;
    let failed = 0;

    try {
        testSceneRendering();
        passed++;
    } catch (e) {
        console.error('❌ Scene rendering tests failed:', e);
        failed++;
    }

    // ... run other suites

    console.log('\n========================================');
    console.log(`RENDERER TESTS: ${passed} passed, ${failed} failed`);
    console.log('========================================\n');

    return failed === 0;
}

// Auto-run if called directly
if (typeof window !== 'undefined') {
    runAllRendererTests();
}
```

### Assertion Pattern

```javascript
// ✅ GOOD - Tests actual behavior
const button = document.querySelector('[data-choice-id="test_choice"]');
console.assert(button !== null, '❌ Choice button not found in DOM');
console.assert(
    button.textContent === 'Test Choice',
    `❌ Expected "Test Choice", got "${button.textContent}"`
);
console.assert(button.classList.contains('choice-btn'), '❌ Button missing choice-btn class');

// ❌ BAD - Assumes without testing
console.assert(true, '✅ Button probably rendered correctly');
```

### Edge Case Testing

```javascript
// Test with realistic data
const scene = {
    sceneId: 'test_scene_1',
    sceneText: 'You wake up. The room is dark. < script > alert("xss") </ script >', // Test HTML escaping
    choices: [
        { id: 'choice_1', text: 'Turn on light' },
        { id: 'choice_2', text: 'Go back to sleep' }
    ],
    lessonId: null,
    imageKey: 'hotel_room',
    isEnding: false,
    endingType: null,
    mood: 'dark'
};

// Edge cases to test:
// - Very long sceneText (500+ chars)
// - sceneText with newlines, quotes, apostrophes
// - Empty choice text
// - Special characters in choice IDs
// - Missing imageKey
// - Invalid lessonId (999)
```

---

## Deliverable Checklist

Before submitting `tests/rendererTest.js`:

- [ ] All 8 tests implemented with 3+ assertions each
- [ ] Tests run in browser (not Node.js)
- [ ] Each test logs '✅ Test X passed' on success
- [ ] Failed assertions show expected vs actual values
- [ ] DOM cleanup after each test
- [ ] No test depends on another test's state
- [ ] File exports runAllRendererTests() function
- [ ] Total assertions: Minimum 25
- [ ] No placeholder tests (no `assert(true)`)
- [ ] Tests use real Scene/GameState objects

---

## Testing Checklist

Run these manually before submitting:

1. Open `index.html` in browser
2. Open DevTools console
3. Run: `import('./tests/rendererTest.js').then(m => m.runAllRendererTests())`
4. Verify: All tests pass
5. Verify: No uncaught errors in console
6. Verify: DOM is clean (no leftover test elements)

---

## Estimated Time: 55 minutes

- Suite 1: 25 min
- Suite 2: 15 min
- Suite 3: 10 min
- Suite 4: 5 min

**Deadline:** Return completed `tests/rendererTest.js` file with all tests passing.

---

## Questions to Ask If Unclear

1. "Should I test with real DOM elements or create test fixtures?"
    - Answer: Use the real DOM elements from index.html

2. "What if a function doesn't have a return value?"
    - Answer: Test side effects (DOM changes, class additions, etc.)

3. "How do I test async rendering?"
    - Answer: Use setTimeout with 100ms wait, then assert

4. "What if I can't import renderer.js functions?"
    - Answer: Check export statements in renderer.js, may need to add exports

---

**REMEMBER:** Quality over speed. 8 robust tests > 20 flaky tests.
