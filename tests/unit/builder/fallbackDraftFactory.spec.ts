import { expect, test } from '@playwright/test';
import { createFallbackDraft } from '../../../src/lib/server/ai/builder/fallbackDraftFactory';

test.describe('fallbackDraftFactory', () => {
	test('keeps starter defaults when premise is empty', () => {
		const draft = createFallbackDraft('');

		expect(draft.title).toBe('Starter Story');
		expect(draft.premise).toBe('');
		expect(draft.characters.length).toBeGreaterThan(0);
	});

	test('derives title and setting from premise keywords', () => {
		const draft = createFallbackDraft('An office worker hides bad numbers.');

		expect(draft.title).toBe('An Office Worker Hides');
		expect(draft.setting).toMatch(/office/i);
		expect(draft.voiceCeilingLines[0]).toMatch(/An Office Worker Hides/);
	});
});
