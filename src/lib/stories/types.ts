import type { NarrativeContext, StoryThreads } from '$lib/contracts';
import type { Lesson } from '$lib/narrative/lessonsCatalog';

export interface StoryThemeOverrides {
	accentColor?: string;
	backgroundClassName?: string;
}

export interface StoryCartridge {
	id: string;
	title: string;
	initialSceneId: string;
	createInitialStoryThreads: () => StoryThreads;
	prompts: {
		systemPrompt: string;
		getOpeningPrompt: () => string;
		getContinuePromptFromContext: (
			narrativeContext: NarrativeContext,
			suggestedEnding?: string | null
		) => string;
		getRecoveryPrompt: (invalidOutput: string) => string;
	};
	lessons: {
		all: Lesson[];
		getById: (lessonId: number) => Lesson | null;
	};
	ui: {
		imagePaths: Record<string, string>;
		pregeneratedImagePool: string[];
		theme?: StoryThemeOverrides;
	};
}
