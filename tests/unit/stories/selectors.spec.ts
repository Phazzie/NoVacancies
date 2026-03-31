import { expect, test } from '@playwright/test';
import { getStoryCartridge } from '../../../src/lib/stories';
import {
	selectStoryContextAdapter,
	selectStoryPresentation,
	selectStoryPrompts,
	selectStoryUiAssets
} from '../../../src/lib/stories/selectors';

test.describe('Story selectors', () => {
	test('selectStoryPrompts returns only the prompt slice', () => {
		const starter = getStoryCartridge('starter-kit');
		expect(starter).not.toBeNull();
		const prompts = selectStoryPrompts(starter);

		expect(prompts.systemPrompt).toContain('starter cartridge reference');
		expect(typeof prompts.getContinuePromptFromContext).toBe('function');
	});

	test('selectStoryContextAdapter returns only the context adapter slice', () => {
		const starter = getStoryCartridge('starter-kit');
		expect(starter).not.toBeNull();
		const contextAdapter = selectStoryContextAdapter(starter);

		expect(typeof contextAdapter.translateThreadStateNarrative).toBe('function');
		expect(typeof contextAdapter.detectThreadTransitions).toBe('function');
	});

	test('selectStoryPresentation returns provided fallback when story is unavailable', () => {
		const fallback = {
			metaDescription: 'blocked',
			shellKicker: 'blocked',
			homeKicker: 'blocked',
			homeSubtitle: 'blocked',
			homeTagline: 'blocked',
			homeSupportCopy: 'blocked',
			storyBriefItems: ['blocked']
		};

		const presentation = selectStoryPresentation(null, fallback);
		expect(presentation).toEqual(fallback);
	});

	test('selectStoryUiAssets returns image paths and pregenerated pool', () => {
		const starter = getStoryCartridge('starter-kit');
		expect(starter).not.toBeNull();
		const uiAssets = selectStoryUiAssets(starter);

		expect(uiAssets).toHaveProperty('imagePaths');
		expect(Array.isArray(uiAssets.pregeneratedImagePool)).toBe(true);
	});
});
