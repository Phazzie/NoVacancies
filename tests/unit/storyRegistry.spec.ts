import { expect, test } from '@playwright/test';
import {
	getActiveStoryCartridge,
	getStoryCartridge,
	listStoryCartridges
} from '../../src/lib/stories';

test.describe('Story registry', () => {
	test('registers No Vacancies and starter kit cartridges', () => {
		const cartridges = listStoryCartridges();
		expect(cartridges.map((story) => story.id)).toEqual(
			expect.arrayContaining(['no-vacancies', 'starter-kit'])
		);
	});

	test('defaults the active story to No Vacancies', () => {
		expect(getActiveStoryCartridge().id).toBe('no-vacancies');
	});

	test('keeps starter kit free of No Vacancies prose leakage', () => {
		const starter = getStoryCartridge('starter-kit');
		expect(starter).not.toBeNull();
		expect(starter?.summary).not.toContain('Sydney');
		expect(starter?.prompts.systemPrompt).not.toContain('Oswaldo');
		expect(starter?.prompts.getOpeningPrompt()).not.toContain('motel');
	});
});
