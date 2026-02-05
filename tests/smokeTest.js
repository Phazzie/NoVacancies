/**
 * No Vacancies - Smoke Test (80/20 Rule)
 *
 * Usage: npm test
 *
 * Tests the 20% that catches 80% of bugs:
 * 1. Opening scene loads and is valid
 * 2. Scene transitions work with real choice IDs
 * 3. Scene graph has no broken links
 * 4. All 4 endings exist and are valid
 * 5. Contract validation functions work
 */

import { mockStoryService } from '../js/services/mockStoryService.js';
import {
    createGameState,
    validateScene,
    validateChoice,
    EndingTypes
} from '../js/contracts.js';

let passed = 0;
let failed = 0;

async function test(name, fn) {
    try {
        await fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (e) {
        console.log(`❌ ${name}: ${e.message}`);
        failed++;
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}

async function runTests() {
    console.log('🧪 NO VACANCIES - SMOKE TEST\n');

    // ========================================
    // CONTRACT TESTS
    // ========================================
    console.log('--- Contract Validation ---');

    await test('validateScene rejects null', () => {
        assert(validateScene(null) === false);
    });

    await test('validateScene rejects missing sceneId', () => {
        assert(validateScene({ sceneText: 'hi', choices: [], isEnding: false }) === false);
    });

    await test('validateScene accepts valid scene', () => {
        const valid = {
            sceneId: 'test',
            sceneText: 'Test scene',
            choices: [],
            isEnding: true,
            endingType: 'loop'
        };
        assert(validateScene(valid) === true);
    });

    await test('validateChoice rejects null', () => {
        assert(validateChoice(null) === false);
    });

    await test('validateChoice accepts valid choice', () => {
        assert(validateChoice({ id: 'test', text: 'Test' }) === true);
    });

    await test('createGameState returns valid state', () => {
        const state = createGameState();
        assert(state.currentSceneId === 'opening');
        assert(Array.isArray(state.history));
        assert(state.useMocks === true);
    });

    // ========================================
    // SERVICE TESTS
    // ========================================
    console.log('\n--- Story Service ---');

    await test('getOpeningScene returns valid scene', async () => {
        const scene = await mockStoryService.getOpeningScene();
        assert(validateScene(scene), 'Opening scene invalid');
        assert(scene.sceneId === 'opening', 'Should be opening scene');
        assert(scene.choices.length > 0, 'Opening should have choices');
    });

    await test('All scenes have valid structure', () => {
        const allIds = mockStoryService.getAllSceneIds();
        for (const id of allIds) {
            const scene = mockStoryService.getSceneById(id);
            assert(validateScene(scene), `Scene "${id}" is invalid`);
        }
    });

    // ========================================
    // SCENE GRAPH VALIDATION
    // ========================================
    console.log('\n--- Scene Graph ---');

    await test('All nextSceneId references exist', () => {
        const allIds = mockStoryService.getAllSceneIds();
        const idSet = new Set(allIds);
        const broken = [];

        for (const id of allIds) {
            const scene = mockStoryService.getSceneById(id);
            for (const choice of scene.choices) {
                if (choice.nextSceneId && !idSet.has(choice.nextSceneId)) {
                    broken.push(`${id} -> ${choice.nextSceneId}`);
                }
            }
        }

        assert(broken.length === 0, `Broken links: ${broken.join(', ')}`);
    });

    await test('All 4 ending types exist', () => {
        const allIds = mockStoryService.getAllSceneIds();
        const endingTypes = new Set();

        for (const id of allIds) {
            const scene = mockStoryService.getSceneById(id);
            if (scene.isEnding && scene.endingType) {
                endingTypes.add(scene.endingType);
            }
        }

        assert(endingTypes.has(EndingTypes.LOOP), 'Missing LOOP ending');
        assert(endingTypes.has(EndingTypes.SHIFT), 'Missing SHIFT ending');
        assert(endingTypes.has(EndingTypes.EXIT), 'Missing EXIT ending');
        assert(endingTypes.has(EndingTypes.RARE), 'Missing RARE ending');
    });

    // ========================================
    // RANDOM PLAYTHROUGH
    // ========================================
    console.log('\n--- Random Playthrough ---');

    await test('Random playthrough reaches ending', async () => {
        const gameState = createGameState();
        let scene = await mockStoryService.getOpeningScene();
        let moves = 0;
        const maxMoves = 20;

        while (!scene.isEnding && moves < maxMoves) {
            // Pick random choice
            if (scene.choices.length === 0) break;
            const choice = scene.choices[Math.floor(Math.random() * scene.choices.length)];

            scene = await mockStoryService.getNextScene(
                scene.sceneId,
                choice.id,
                gameState
            );
            moves++;
        }

        assert(scene.isEnding, `Should reach ending within ${maxMoves} moves`);
        console.log(`   → Reached "${scene.endingType}" ending in ${moves} moves`);
    });

    // ========================================
    // RESULTS
    // ========================================
    console.log('\n========================================');
    console.log(`PASSED: ${passed}  FAILED: ${failed}`);

    if (failed > 0) {
        console.log('💀 TESTS FAILED');
        process.exit(1);
    } else {
        console.log('✨ ALL TESTS PASSED');
        process.exit(0);
    }
}

runTests().catch((e) => {
    console.error('Test runner crashed:', e);
    process.exit(1);
});
