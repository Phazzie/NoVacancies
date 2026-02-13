import { test, expect } from '@playwright/test';
import { evaluateStorySanity } from '../../src/lib/server/ai/sanity';

function makeScene(overrides: Partial<Parameters<typeof evaluateStorySanity>[0]> = {}) {
	return {
		sceneId: 'scene_test',
		sceneText:
			"The motel clock keeps blinking. You have forty-seven dollars and four hours to turn it into sixty-five. Oswaldo is still asleep. Trina is still on the floor. The phones are charged and waiting.",
		choices: [
			{ id: 'work', text: 'Work the phones' },
			{ id: 'wake', text: 'Wake Oswaldo' }
		],
		lessonId: null,
		imageKey: 'hotel_room',
		isEnding: false,
		endingType: null,
		...overrides
	};
}

test.describe('Sanity Gate (Structural Only)', () => {
	test('blocks scene text that is too short', () => {
		const result = evaluateStorySanity(
			makeScene({
				sceneText: 'Too short.'
			})
		);
		expect(result.blockingIssues).toContain('scene_text_too_short');
	});

	test('blocks non-ending scenes with fewer than 2 choices', () => {
		const result = evaluateStorySanity(
			makeScene({
				choices: [{ id: 'only', text: 'Only one option' }]
			})
		);
		expect(result.blockingIssues).toContain('insufficient_choices');
	});

	test('blocks scenes with more than 3 choices', () => {
		const result = evaluateStorySanity(
			makeScene({
				choices: [
					{ id: 'a', text: 'A' },
					{ id: 'b', text: 'B' },
					{ id: 'c', text: 'C' },
					{ id: 'd', text: 'D' }
				]
			})
		);
		expect(result.blockingIssues).toContain('too_many_choices');
	});

	test('blocks duplicate choice phrasing', () => {
		const result = evaluateStorySanity(
			makeScene({
				choices: [
					{ id: 'a', text: 'Tell him what you think' },
					{ id: 'b', text: 'Tell him what you think' }
				]
			})
		);
		expect(result.blockingIssues).toContain('duplicate_choice_phrasing');
	});

	test('marks soft word-limit scenes as retryable', () => {
		const longish = new Array(285).fill('word').join(' ');
		const result = evaluateStorySanity(
			makeScene({
				sceneText: longish
			})
		);
		expect(result.blockingIssues).not.toContain('scene_word_count_hard_limit');
		expect(result.retryableIssues).toContain('scene_word_count_soft_limit');
	});

	test('blocks hard word-limit scenes', () => {
		const tooLong = new Array(360).fill('word').join(' ');
		const result = evaluateStorySanity(
			makeScene({
				sceneText: tooLong
			})
		);
		expect(result.blockingIssues).toContain('scene_word_count_hard_limit');
	});
});

