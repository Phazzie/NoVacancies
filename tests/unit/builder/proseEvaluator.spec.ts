import { expect, test } from '@playwright/test';
import {
	evaluateBuilderProse,
	fallbackEvaluateProse
} from '../../../src/lib/server/ai/builder/proseEvaluator';

test.describe('proseEvaluator', () => {
	test('fallback rubric flags hallmark-style summary prose', () => {
		const feedback = fallbackEvaluateProse(
			'She realized the lesson and understood what this teaches about healing.'
		);

		expect(feedback.score).toBeLessThan(8);
		expect(feedback.flags.join(' ')).toMatch(/Explains the feeling/i);
	});

	test('returns fallback feedback for empty input without model call', async () => {
		const result = await evaluateBuilderProse('   ');

		expect(result.source).toBe('fallback');
		expect(result.feedback.score).toBe(1);
		expect(result.feedback.flags[0]).toMatch(/Empty field/i);
	});
});
