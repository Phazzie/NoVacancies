import { createStoryThreads, ImageKeys, SceneIds, type NarrativeContext } from '$lib/contracts';
import type { StoryCartridge } from '$lib/stories/types';
import { getLessonById, lessons } from '$lib/narrative/lessonsCatalog';

const SYSTEM_PROMPT = `You are an AI storyteller running a generic starter cartridge. Keep continuity strict and output valid JSON only.`;

function getOpeningPrompt(): string {
	return `Generate an opening scene for a generic starter story with 2-3 choices. Respond with valid JSON only.`;
}

function getContinuePromptFromContext(narrativeContext: NarrativeContext): string {
	return `Continue the story using this narrative context:\n${JSON.stringify(narrativeContext)}\nRespond with valid JSON only.`;
}

function getRecoveryPrompt(invalidOutput: string): string {
	return `Your previous response was invalid JSON. Recover to valid JSON only. Previous output:\n${invalidOutput.slice(0, 300)}`;
}

const imagePaths: Record<string, string> = {
	[ImageKeys.HOTEL_ROOM]: '/images/hotel_room.png'
};

export const starterKitCartridge: StoryCartridge = {
	id: 'starter-kit',
	title: 'Starter Kit Story',
	initialSceneId: SceneIds.OPENING,
	createInitialStoryThreads: () => createStoryThreads(),
	prompts: {
		systemPrompt: SYSTEM_PROMPT,
		getOpeningPrompt,
		getContinuePromptFromContext,
		getRecoveryPrompt
	},
	lessons: {
		all: lessons,
		getById: (lessonId: number) => getLessonById(lessonId) ?? null
	},
	ui: {
		imagePaths,
		pregeneratedImagePool: []
	}
};
