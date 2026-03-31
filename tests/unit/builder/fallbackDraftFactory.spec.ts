import { expect, test } from '@playwright/test';
import { createFallbackDraft } from '../../../src/lib/server/ai/builder/fallbackDraftFactory';

test.describe('fallbackDraftFactory', () => {
	test('builds a title and setting from premise keywords', () => {
		const draft = createFallbackDraft('hotel accountant keeps everyone solvent');

		expect(draft.title).toBe('Hotel Accountant Keeps Everyone');
		expect(draft.setting).toMatch(/hotel room/i);
		expect(draft.mechanics.length).toBeGreaterThan(0);
	});

	test('uses starter-kit defaults for empty premise', () => {
		const draft = createFallbackDraft('');

		expect(draft.title).toBe('Starter Story');
		expect(draft.premise).toBe('');
		expect(draft.characters[0]?.name).toBe('Protagonist');
	});
});
