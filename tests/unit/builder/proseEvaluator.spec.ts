import { expect, test } from '@playwright/test';
import {
	evaluateBuilderProse,
	fallbackEvaluateProse
} from '../../../src/lib/server/ai/builder/proseEvaluator';

test.describe('proseEvaluator', () => {
	test('uses fallback feedback for empty prose', async () => {
		const result = await evaluateBuilderProse('   ');

		expect(result.source).toBe('fallback');
		expect(result.feedback.score).toBe(1);
	});

	test('returns ai feedback when model response is valid json', async () => {
		const result = await evaluateBuilderProse('He drops three coins on the table and leaves.', {
			callModel: async () =>
				'{"score":8.7,"flags":["Concrete action present."],"suggestion":"Keep the pressure visible."}'
		});

		expect(result.source).toBe('ai');
		expect(result.feedback.score).toBe(9);
		expect(result.feedback.flags[0]).toMatch(/Concrete action/);
	});

	test('fallback rubric catches summary prose', () => {
		const feedback = fallbackEvaluateProse(
			'She realized she needed to process this and understood the lesson.'
		);

		expect(feedback.score).toBeLessThan(8);
		expect(feedback.flags.join(' ')).toMatch(/Explains the feeling|lesson/i);
	});
});
