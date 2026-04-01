import { getActiveStoryCartridge } from '$lib/stories';
import type {
	StoryContextDefinition,
	StoryDefinition,
	StoryPresentationDef,
	StoryPromptDefinition
} from '$lib/stories/types';

type StoryUiAssets = StoryDefinition['ui'];

function resolveStoryDefinition(story?: StoryDefinition | null): StoryDefinition {
	return story ?? getActiveStoryCartridge();
}

export function selectStoryPrompts(story?: StoryDefinition | null): StoryPromptDefinition {
	return resolveStoryDefinition(story).prompts;
}

export function selectStoryContextAdapter(story?: StoryDefinition | null): StoryContextDefinition {
	return resolveStoryDefinition(story).context;
}

export function selectStoryPresentation(
	story?: StoryDefinition | null,
	fallback?: StoryPresentationDef
): StoryPresentationDef {
	if (story) return story.presentation;
	if (fallback) return fallback;
	return getActiveStoryCartridge().presentation;
}

export function selectStoryUiAssets(story?: StoryDefinition | null, fallback?: StoryUiAssets): StoryUiAssets {
	if (story) return story.ui;
	if (fallback) return fallback;
	return getActiveStoryCartridge().ui;
}
