import { expect, test } from '@playwright/test';
import {
    getStoryCartridge,
    selectStoryContextAdapter,
    selectStoryPresentation,
    selectStoryPrompts,
    selectStoryUiAssets
} from '../../../src/lib/stories';

test.describe('Story selectors', () => {
    test('selectStoryPrompts returns only the prompts slice', () => {
        const story = getStoryCartridge('starter-kit');
        expect(story).not.toBeNull();

        const prompts = selectStoryPrompts(story!);
        expect(prompts.systemPrompt).toContain('starter cartridge');
        expect(typeof prompts.getOpeningPrompt).toBe('function');
    });

    test('selectStoryContextAdapter returns only the context slice', () => {
        const story = getStoryCartridge('starter-kit');
        expect(story).not.toBeNull();

        const contextAdapter = selectStoryContextAdapter(story!);
        expect(contextAdapter.translateThreadStateNarrative()).toHaveLength(2);
        expect(contextAdapter.detectThreadTransitions().keys).toEqual([]);
    });

    test('selectStoryPresentation returns null-safe presentation slice', () => {
        expect(selectStoryPresentation(null)).toBeNull();

        const story = getStoryCartridge('starter-kit');
        expect(story).not.toBeNull();

        const presentation = selectStoryPresentation(story);
        expect(presentation?.homeSubtitle).toBe('Swap The Story, Keep The Engine');
    });

    test('selectStoryUiAssets returns image mapping and pool only', () => {
        const story = getStoryCartridge('no-vacancies');
        expect(story).not.toBeNull();

        const uiAssets = selectStoryUiAssets(story!);
        expect(uiAssets.imagePaths).toHaveProperty('hotel_room');
        expect(uiAssets.pregeneratedImagePool.length).toBeGreaterThan(0);
    });
});
