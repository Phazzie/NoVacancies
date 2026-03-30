import { expect, test } from '@playwright/test';
import { normalizeChoiceId, normalizeSceneCandidate } from '../../../src/lib/server/ai/providers/grok/sceneNormalizer';

test.describe('sceneNormalizer', () => {
	test('normalizes missing choice ids from choice text', () => {
		expect(normalizeChoiceId('Check Phone!!!', 0)).toBe('check_phone');
		expect(normalizeChoiceId('***', 1)).toBe('choice_2');
	});

	test('builds valid scene defaults from partial candidate', () => {
		const scene = normalizeSceneCandidate(
			{
				sceneText: '  Hello there  ',
				choices: [{ text: 'Open Door' }, { text: '   ' }],
				isEnding: false
			},
			'fallback_scene'
		);

		expect(scene.sceneId).toBe('fallback_scene');
		expect(scene.sceneText).toBe('Hello there');
		expect(scene.imageKey).toBe('hotel_room');
		expect(scene.choices).toEqual([{ id: 'open_door', text: 'Open Door', outcome: undefined }]);
		expect(scene.endingType).toBeNull();
	});

	test('validates ending metadata and optional properties', () => {
		const scene = normalizeSceneCandidate(
			{
				sceneId: 'scene_end',
				sceneText: 'Done',
				choices: [],
				isEnding: true,
				endingType: 'victory',
				mood: 'triumphant',
				storyThreadUpdates: { moneyResolved: true }
			},
			'fallback'
		);

		expect(scene.sceneId).toBe('scene_end');
		expect(scene.isEnding).toBe(true);
		expect(scene.endingType).toBe('victory');
		expect(scene.mood).toBe('triumphant');
		expect(scene.storyThreadUpdates).toEqual({ moneyResolved: true });
	});
});
