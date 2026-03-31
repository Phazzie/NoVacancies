import { expect, test } from '@playwright/test';
import { buildEndingPayload, cloneSettings, normalizeEndingList } from '../../../src/lib/game/runtime/endingPolicy';
import { createGameState, type GameSettings, type Scene } from '../../../src/lib/contracts/game';

function makeEndingScene(overrides: Partial<Scene> = {}): Scene {
	return {
		sceneId: 'ending_shift',
		sceneText: 'She leaves before dawn.',
		choices: [],
		lessonId: null,
		imageKey: 'empty_room',
		isEnding: true,
		endingType: 'shift',
		...overrides
	};
}

test.describe('runtime/endingPolicy', () => {
	test('normalizeEndingList removes duplicates and empty values', () => {
		expect(normalizeEndingList(['shift', 'shift', '', 'exit'])).toEqual(['shift', 'exit']);
	});

	test('buildEndingPayload unlocks new ending and computes stats', () => {
		const state = createGameState({ now: () => 1000 });
		state.sceneCount = 4;
		state.lessonsEncountered = [1, 4];
		const settings: GameSettings = {
			showLessons: true,
			apiKey: '',
			unlockedEndings: ['loop']
		};
		let mutatedSettings = settings;
		let savedEndings: string[] = [];

		const payload = buildEndingPayload({
			scene: makeEndingScene(),
			gameState: state,
			settings,
			settingsStorage: {
				saveUnlockedEndings: (endings) => {
					savedEndings = endings;
					return endings;
				}
			},
			now: () => 1450,
			onSettingsChange: (nextSettings) => {
				mutatedSettings = nextSettings;
			}
		});

		expect(savedEndings).toEqual(['loop', 'shift']);
		expect(mutatedSettings.unlockedEndings).toEqual(['loop', 'shift']);
		expect(payload.unlockedEndings).toEqual(['loop', 'shift']);
		expect(payload.stats).toEqual({ sceneCount: 4, lessonsCount: 2, durationMs: 450 });
	});

	test('cloneSettings performs defensive clone for unlocked endings', () => {
		const original: GameSettings = { showLessons: true, apiKey: '', unlockedEndings: ['loop'] };
		const copy = cloneSettings(original);
		copy.unlockedEndings.push('shift');
		expect(original.unlockedEndings).toEqual(['loop']);
	});
});
