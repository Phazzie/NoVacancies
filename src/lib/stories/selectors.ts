import type {
    StoryContextDefinition,
    StoryDefinition,
    StoryPresentationDef,
    StoryPromptDefinition,
    StoryThemeOverrides
} from '$lib/stories/types';

export interface StoryUiAssets {
    imagePaths: Record<string, string>;
    pregeneratedImagePool: string[];
    theme?: StoryThemeOverrides;
}

export function selectStoryPrompts(story: StoryDefinition): StoryPromptDefinition {
    return story.prompts;
}

export function selectStoryContextAdapter(story: StoryDefinition): StoryContextDefinition {
    return story.context;
}

export function selectStoryPresentation(
    story: StoryDefinition | null
): StoryPresentationDef | null {
    return story?.presentation ?? null;
}

export function selectStoryUiAssets(story: StoryDefinition): StoryUiAssets {
    return story.ui;
}
