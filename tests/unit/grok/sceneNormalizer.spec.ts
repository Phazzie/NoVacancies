import { expect, test } from '@playwright/test';
import { normalizeAndValidateScene, normalizeSceneCandidate } from '../../../src/lib/server/ai/providers/grok/sceneNormalizer';

test.describe('sceneNormalizer', () => {
	test('normalizes fallback values and generated choice id', () => {
		const scene = normalizeSceneCandidate(
			{
				sceneText: 'A beat.',
				choices: [{ text: 'Call Dex now' }],
				isEnding: false
			},
			'fallback_scene'
		);

		expect(scene.sceneId).toBe('fallback_scene');
		expect(scene.choices[0]?.id).toBe('call_dex_now');
		expect(scene.imageKey).toBe('hotel_room');
		expect(scene.lessonId).toBeNull();
	});

	test('normalizes invalid mood to undefined', () => {
		const scene = normalizeSceneCandidate(
			{
				sceneText: 'A beat.',
				choices: [{ id: 'a', text: 'A' }],
				mood: 'mysterious'
			},
			'fallback_scene'
		);
		expect(scene.mood).toBeUndefined();
	});

	test('produces contract-valid ending scenes', () => {
		const scene = normalizeAndValidateScene(
			{
				sceneText: 'Final beat.',
				choices: [],
				isEnding: true,
				endingType: null
			},
			'fallback_scene'
		);

		expect(scene.isEnding).toBe(true);
		expect(scene.endingType).toBeTruthy();
	});
});
