/**
 * Renderer Test Suite (Wu-Bob Refactor)
 * 
 * METHODOLOGY:
 * - Uncle Bob: Functions do one thing. Names are documentation.
 * - GZA: Short, precise, no dead code.
 * - Ghostface: Aggressive assertions, no mercy for edge cases.
 */

import { renderScene, renderEnding, updateSettingsUI, showError, getElements, initRenderer, imagePaths, hideLessonPopup } from '../js/renderer.js';
import { ImageKeys, validateScene } from '../js/contracts.js';
import { lessons } from '../js/lessons.js';

// --- SETUP (Ghostface Enforcer) ---
if (typeof document === 'undefined') {
    throw new Error('❌ BROWSER REQ: Tests must run in browser environment.');
}

if (!getElements().sceneText) {
    initRenderer();
}

const elements = getElements();

// --- HELPERS (GZA Utility) ---

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function resetDOM() {
    if (elements.currentTypewriterController) elements.currentTypewriterController.abort();
    if (elements.sceneText) elements.sceneText.textContent = '';
    if (elements.choicesContainer) elements.choicesContainer.innerHTML = '';
    if (elements.sceneImage) elements.sceneImage.src = '';
    if (elements.lessonPopup) elements.lessonPopup.classList.add('hidden');
    
    // Reset inputs
    document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
    if (elements.apiKeySection) elements.apiKeySection.classList.add('hidden');
}

/**
 * Factory for test scenes (GZA Efficiency)
 */
function createTestScene(overrides = {}) {
    const scene = {
        sceneId: 'test_scene',
        sceneText: 'Default test text',
        choices: [],
        lessonId: null,
        imageKey: ImageKeys.HOTEL_ROOM,
        isEnding: false,
        endingType: null,
        ...overrides
    };
    
    if (!validateScene(scene)) {
        throw new Error(`❌ INVALID TEST DATA: Scene object failed contract validation. ${JSON.stringify(scene)}`);
    }
    return scene;
}

// --- DOM TESTS (Uncle Bob: One Concept Per Function) ---

async function testSceneTextDisplay() {
    console.log('Test: Scene Text Rendering');
    resetDOM();
    const text = 'Test scene text <script>alert(1)</script>';
    const scene = createTestScene({ sceneText: text });
    
    renderScene(scene, true);
    // Poll for completion to avoid timer jitter in CI.
    const deadline = Date.now() + 5000;
    while (elements.sceneText.textContent.length < text.length && Date.now() < deadline) {
        await wait(50);
    }

    const el = elements.sceneText;
    assert(el.textContent.includes('Test scene text'), '❌ Text content missing');
    assert(el.textContent.includes('<script>'), '❌ HTML injection vulnerability detected');
    assert(window.getComputedStyle(el).display !== 'none', '❌ Text element invisible');
    console.log('✅ Passed');
}


function testChoiceRendering() {
    console.log('Test: Choice Rendering');
    resetDOM();
    const scene = createTestScene({
        choices: [
            {id: 'a', text: 'Choice A'},
            {id: 'b', text: 'Choice B'}
        ]
    });
    
    renderScene(scene, false);
    
    const btns = elements.choicesContainer.querySelectorAll('button');
    assert(btns.length === 2, `❌ Expected 2 buttons, got ${btns.length}`);
    assert(btns[0].textContent === 'Choice A', '❌ Button text mismatch');
    assert(btns[0].dataset.choiceId === 'a', '❌ Data attribute mismatch');
    console.log('✅ Passed');
}

function testImageLoading() {
    console.log('Test: Image Loading');
    resetDOM();
    
    // Valid key
    renderScene(createTestScene({ imageKey: ImageKeys.SYDNEY_LAPTOP }), false);
    assert(elements.sceneImage.src.includes('sydney_laptop'), '❌ Wrong image src');
    
    // Invalid key (Ghostface check)
    renderScene(createTestScene({ imageKey: 'INVALID_KEY_666' }), false);
    assert(elements.sceneImage.src.includes('hotel_room'), '❌ Fallback failed');
    console.log('✅ Passed');
}

async function testLessonPopup() {
    console.log('Test: Lesson Popup');
    resetDOM();
    const lessonId = 5;
    renderScene(createTestScene({ lessonId }), true);
    await wait(100);

    assert(!elements.lessonPopup.classList.contains('hidden'), '❌ Popup failed to show');
    assert(elements.lessonTitle.textContent === lessons.find(l=>l.id===5).title, '❌ Wrong lesson title');
    
    hideLessonPopup();
    assert(elements.lessonPopup.classList.contains('hidden'), '❌ Popup failed to hide');
    console.log('✅ Passed');
}

async function testEdgeCases() {
    console.log('Test: Ghostface Edge Cases');
    resetDOM();
    
    const nastyScene = createTestScene({
        sceneText: 'A'.repeat(120) + '\n"Quote" \'Single\'',
        choices: [{id: 'c_@#$', text: 'Nasty ID'}],
        lessonId: 999 
    });

    renderScene(nastyScene, true);
    // Typewriter timing can drift in CI, so poll with an upper bound.
    const deadline = Date.now() + 10000;
    while (
        elements.sceneText.textContent.length < nastyScene.sceneText.length &&
        Date.now() < deadline
    ) {
        await wait(100);
    }

    assert(elements.sceneText.textContent.length >= 120, '❌ Text truncation detected');
    assert(elements.sceneText.textContent.includes('"Quote"'), '❌ Quote rendering failed');
    assert(elements.lessonPopup.classList.contains('hidden'), '❌ Invalid lesson ID crashed');
    assert(document.querySelector('[data-choice-id="c_@#$"]'), '❌ Special char ID failed');
    console.log('✅ Passed');
}

// --- UI TESTS ---

function testSettingsToggles() {
    console.log('Test: Settings Toggles');
    resetDOM();
    
    updateSettingsUI({useMocks: true, showLessons: false});
    assert(elements.modeMock.classList.contains('active'), '❌ Mock mode inactive');
    assert(elements.lessonsOff.classList.contains('active'), '❌ Lessons off inactive');
    assert(elements.apiKeySection.classList.contains('hidden'), '❌ API key visible in mock mode');
    
    updateSettingsUI({useMocks: false, showLessons: true});
    assert(elements.modeAi.classList.contains('active'), '❌ AI mode inactive');
    assert(!elements.apiKeySection.classList.contains('hidden'), '❌ API key hidden in AI mode');
    console.log('✅ Passed');
}

async function testErrorDisplay() {
    console.log('Test: Error Handling');
    resetDOM();
    
    showError('FATAL ERROR');
    const html = elements.choicesContainer.innerHTML;
    assert(html.includes('FATAL ERROR') && html.includes('error-message'), '❌ Error rendering failed');
    await wait(100);
    assert(elements.choicesContainer.innerHTML.includes('FATAL ERROR'), '❌ Error vanished');
    const retryBtn = elements.choicesContainer.querySelector('#retry-btn');
    assert(document.activeElement === retryBtn, '❌ Retry button should receive focus');
    console.log('✅ Passed');
}

async function testChoiceFocusAndLineBreaks() {
    console.log('Test: Choice Focus + Line Break Rendering');
    resetDOM();

    const scene = createTestScene({
        sceneText: 'Line one.\n\nLine two.',
        choices: [
            { id: 'first', text: 'First option' },
            { id: 'second', text: 'Second option' }
        ]
    });

    renderScene(scene, false);
    await wait(150);

    const firstChoice = elements.choicesContainer.querySelector('[data-choice-id="first"]');
    assert(document.activeElement === firstChoice, '❌ First choice should receive focus');
    assert(
        window.getComputedStyle(elements.sceneText).whiteSpace === 'pre-line',
        '❌ scene text should preserve paragraph breaks'
    );
    console.log('✅ Passed');
}

async function testSceneTextFocusWhenNoChoices() {
    console.log('Test: Scene Text Focus Fallback');
    resetDOM();

    const scene = createTestScene({
        sceneText: 'No choices in this state.',
        choices: []
    });

    renderScene(scene, false);
    await wait(80);

    assert(document.activeElement === elements.sceneText, '❌ Scene text should receive focus fallback');
    assert(elements.sceneText.getAttribute('tabindex') === '-1', '❌ Scene text should be programmatically focusable');
    console.log('✅ Passed');
}

function testAssetIntegrity() {
    console.log('Test: Asset Integrity');
    // GZA: Loop it tight
    const failures = Object.values(ImageKeys).filter(k => 
        !imagePaths[k] || !imagePaths[k].startsWith('images/') || !imagePaths[k].endsWith('.png')
    );
    assert(failures.length === 0, `❌ Invalid assets: ${failures.join(', ')}`);
    console.log('✅ Passed');
}


function testEndingRecapUiScaffold() {
    console.log('Test: Ending Recap UI Scaffold');
    const recapPanel = document.getElementById('ending-recap-panel');
    const recapText = document.getElementById('ending-recap-text');
    const copyButton = document.getElementById('copy-recap-btn');
    const downloadButton = document.getElementById('download-recap-btn');

    assert(recapPanel, 'Ending recap panel should exist');
    assert(recapText, 'Ending recap text container should exist');
    assert(copyButton, 'Copy recap button should exist');
    assert(downloadButton, 'Download recap button should exist');
    console.log('Passed');
}

function testRenderEndingRecapText() {
    console.log('Test: Render Ending Recap Text');
    const recap = { text: 'Recap export line 1\nRecap export line 2' };
    renderEnding(
        'loop',
        { sceneCount: 4, lessonsCount: 2, duration: 9000 },
        ['loop'],
        recap
    );

    assert(
        elements.endingRecapText.textContent.includes('Recap export line 1'),
        'Ending recap text should be rendered when recap is provided'
    );
    console.log('Passed');
}

// --- RUNNER (The Master of Ceremonies) ---

export async function runAllRendererTests() {
    console.log('========================================');
    console.log('WU-BOB RENDERER TEST SUITE');
    console.log('========================================\n');

    const tests = [
        testSceneTextDisplay,
        testChoiceRendering,
        testImageLoading,
        testLessonPopup,
        testEdgeCases,
        testSettingsToggles,
        testErrorDisplay,
        testChoiceFocusAndLineBreaks,
        testSceneTextFocusWhenNoChoices,
        testAssetIntegrity,
        testEndingRecapUiScaffold,
        testRenderEndingRecapText
    ];

    let passed = 0;
    
    for (const test of tests) {
        try {
            if (test.constructor.name === 'AsyncFunction') {
                await test();
            } else {
                test();
            }
            passed++;
        } catch (e) {
            console.error(`❌ FAILED: ${test.name}`, e);
        }
    }

    console.log('\n========================================');
    console.log(`RESULT: ${passed} / ${tests.length} PASSED`);
    console.log('========================================\n');

    return passed === tests.length;
}

if (typeof window !== 'undefined') {
    window.runAllRendererTests = runAllRendererTests;
}
