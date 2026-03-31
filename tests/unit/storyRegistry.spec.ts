import { expect, test } from '@playwright/test';
import {
	getActiveStoryCartridge,
	getStoryCartridge,
	listStoryCartridges
} from '../../src/lib/stories';

test.describe('Story registry runtime behavior', () => {
	test.afterEach(() => {
		delete process.env.PUBLIC_STORY_ID;
	});

	test('lists registered cartridges and allows lookup by id', () => {
		const cartridges = listStoryCartridges();
		expect(cartridges.map((story) => story.id)).toEqual(
			expect.arrayContaining(['no-vacancies', 'starter-kit'])
		);

		const starterKit = getStoryCartridge('starter-kit');
		expect(starterKit?.id).toBe('starter-kit');
	});

	test('defaults active cartridge to no-vacancies when unset', () => {
		expect(getActiveStoryCartridge().id).toBe('no-vacancies');
	});

	test('selects the configured PUBLIC_STORY_ID cartridge at runtime', () => {
		process.env.PUBLIC_STORY_ID = 'starter-kit';
		expect(getActiveStoryCartridge().id).toBe('starter-kit');
	});

	test('fails fast when PUBLIC_STORY_ID is unknown', () => {
		process.env.PUBLIC_STORY_ID = 'missing-story';
		expect(() => getActiveStoryCartridge()).toThrow(/Unknown story cartridge id/i);
	});
});
