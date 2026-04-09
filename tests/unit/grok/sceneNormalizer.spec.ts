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

	test.describe('sanitizeStoryThreadUpdates', () => {
		test('preserves all valid numeric, boolean, and array fields', () => {
			const scene = normalizeSceneCandidate(
				{
					sceneText: 'A beat.',
					choices: [{ id: 'a', text: 'A' }],
					storyThreadUpdates: {
						oswaldoConflict: 2,
						trinaTension: 1,
						moneyResolved: true,
						carMentioned: false,
						boundariesSet: ['no_money', 'no_lying'],
						exhaustionLevel: 3
					}
				},
				'scene_1'
			);
			expect(scene.storyThreadUpdates).toEqual({
				oswaldoConflict: 2,
				trinaTension: 1,
				moneyResolved: true,
				carMentioned: false,
				boundariesSet: ['no_money', 'no_lying'],
				exhaustionLevel: 3
			});
		});

		test('drops a field when its value has wrong type (e.g. string for exhaustionLevel)', () => {
			const scene = normalizeSceneCandidate(
				{
					sceneText: 'A beat.',
					choices: [{ id: 'a', text: 'A' }],
					storyThreadUpdates: {
						exhaustionLevel: 'very tired' as unknown as number,
						oswaldoConflict: 1
					}
				},
				'scene_1'
			);
			expect((scene.storyThreadUpdates as Record<string, unknown>)?.exhaustionLevel).toBeUndefined();
			expect((scene.storyThreadUpdates as Record<string, unknown>)?.oswaldoConflict).toBe(1);
		});

		test('drops unknown keys silently', () => {
			const scene = normalizeSceneCandidate(
				{
					sceneText: 'A beat.',
					choices: [{ id: 'a', text: 'A' }],
					storyThreadUpdates: {
						oswaldoConflict: 1,
						unknownKey: 'should be dropped'
					} as Record<string, unknown>
				},
				'scene_1'
			);
			expect((scene.storyThreadUpdates as Record<string, unknown>)?.unknownKey).toBeUndefined();
			expect((scene.storyThreadUpdates as Record<string, unknown>)?.oswaldoConflict).toBe(1);
		});

		test('returns null when all fields are malformed', () => {
			const scene = normalizeSceneCandidate(
				{
					sceneText: 'A beat.',
					choices: [{ id: 'a', text: 'A' }],
					storyThreadUpdates: {
						oswaldoConflict: 'bad' as unknown as number,
						moneyResolved: 'yes' as unknown as boolean
					}
				},
				'scene_1'
			);
			expect(scene.storyThreadUpdates).toBeNull();
		});
	});
});
