import { expect, test } from '@playwright/test';
import {
    createGameState,
    type EndingType,
    type GameSettings,
    type Scene
} from '../../../src/lib/contracts/game';
import {
    buildEndingPayload,
    cloneSettings,
    normalizeEndingList
} from '../../../src/lib/game/runtime/endingPolicy';
import type { SettingsStorage } from '../../../src/lib/services';

function makeEndingScene(overrides: Partial<Scene> = {}): Scene {
    return {
        sceneId: 'ending-scene',
        sceneText: 'The end',
        choices: [],
        lessonId: null,
        imageKey: 'empty_room',
        isEnding: true,
        endingType: 'loop',
        storyThreadUpdates: null,
        ...overrides
    };
}

test.describe('runtime/endingPolicy', () => {
    test('cloneSettings returns copy with cloned unlocked endings', () => {
        const settings: GameSettings = {
            showLessons: true,
            apiKey: '',
            unlockedEndings: ['loop']
        };
        const cloned = cloneSettings(settings);
        cloned.unlockedEndings.push('shift');
        expect(settings.unlockedEndings).toEqual(['loop']);
    });

    test('normalizeEndingList removes empty values and deduplicates', () => {
        const normalized = normalizeEndingList(['loop', 'shift', '', 'loop', '  ' as EndingType]);
        expect(normalized).toEqual(['loop', 'shift']);
    });

    test('buildEndingPayload unlocks ending and reports stats', () => {
        const gameState = createGameState({ now: () => 1000 });
        gameState.sceneCount = 4;
        gameState.lessonsEncountered = [1, 2];

        const settings: GameSettings = {
            showLessons: true,
            apiKey: '',
            unlockedEndings: []
        };

        let savedEndings: EndingType[] = [];
        const settingsStorage: SettingsStorage = {
            loadSettings: () => settings,
            saveSettings: () => settings,
            loadUnlockedEndings: () => settings.unlockedEndings,
            saveUnlockedEndings: (endings) => {
                savedEndings = [...endings];
                return [...endings];
            }
        };

        const payload = buildEndingPayload({
            scene: makeEndingScene(),
            gameState,
            settings,
            settingsStorage,
            now: () => 1450
        });

        expect(savedEndings).toEqual(['loop']);
        expect(payload).toEqual({
            endingType: 'loop',
            sceneId: 'ending-scene',
            stats: {
                sceneCount: 4,
                lessonsCount: 2,
                durationMs: 450
            },
            unlockedEndings: ['loop']
        });
    });
});
