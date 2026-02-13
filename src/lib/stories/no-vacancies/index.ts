import { createStoryThreads, ImageKeys, SceneIds, type NarrativeContext } from '$lib/contracts';
import {
	getContinuePromptFromContext,
	getOpeningPrompt,
	getRecoveryPrompt,
	SYSTEM_PROMPT
} from '$lib/server/ai/narrative';
import { getLessonById, lessons } from '$lib/narrative/lessonsCatalog';
import type { StoryCartridge } from '$lib/stories/types';

const imagePaths: Record<string, string> = {
	[ImageKeys.HOTEL_ROOM]: '/images/hotel_room.png',
	[ImageKeys.SYDNEY_LAPTOP]: '/images/sydney_laptop.png',
	[ImageKeys.SYDNEY_THINKING]: '/images/sydney_thinking.png',
	[ImageKeys.SYDNEY_FRUSTRATED]: '/images/sydney_frustrated.png',
	[ImageKeys.SYDNEY_TIRED]: '/images/sydney_tired.png',
	[ImageKeys.SYDNEY_PHONE]: '/images/sydney_phone_anxious.png',
	[ImageKeys.SYDNEY_COFFEE]: '/images/sydney_coffee_morning.png',
	[ImageKeys.SYDNEY_WINDOW]: '/images/sydney_window_dawn.png',
	[ImageKeys.OSWALDO_SLEEPING]: '/images/oswaldo_sleeping.png',
	[ImageKeys.OSWALDO_AWAKE]: '/images/oswaldo_awake.png',
	[ImageKeys.THE_DOOR]: '/images/the_door.png',
	[ImageKeys.EMPTY_ROOM]: '/images/empty_room.png',
	[ImageKeys.MOTEL_EXTERIOR]: '/images/motel_exterior.png'
};

const pregeneratedImagePool: string[] = [
	'/images/ChatGPT Image Feb 7, 2026, 03_33_36 AM.png',
	'/images/ChatGPT Image Feb 7, 2026, 03_33_55 AM.png',
	'/images/ChatGPT Image Feb 7, 2026, 03_34_02 AM.png',
	'/images/ChatGPT Image Feb 7, 2026, 03_34_07 AM.png',
	'/images/ChatGPT Image Feb 7, 2026, 03_34_13 AM.png',
	'/images/ChatGPT Image Feb 7, 2026, 03_34_20 AM.png',
	'/images/car_memory.png',
	'/images/convenience_store.png',
	'/images/empty_room.png',
	'/images/hotel_room.png',
	'/images/motel_exterior.png',
	'/images/oswaldo_awake.png',
	'/images/oswaldo_sleeping.png',
	'/images/sydney_coffee_morning.png',
	'/images/sydney_frustrated.png',
	'/images/sydney_laptop.png',
	'/images/sydney_oswaldo_tension.png',
	'/images/sydney_phone_anxious.png',
	'/images/sydney_thinking.png',
	'/images/sydney_tired.png',
	'/images/sydney_window_dawn.png',
	'/images/the_door.png',
	'/images/trina_crashed.png'
].map((path) => encodeURI(path));

export const noVacanciesCartridge: StoryCartridge = {
	id: 'no-vacancies',
	title: 'No Vacancies',
	initialSceneId: SceneIds.OPENING,
	createInitialStoryThreads: () => createStoryThreads(),
	prompts: {
		systemPrompt: SYSTEM_PROMPT,
		getOpeningPrompt,
		getContinuePromptFromContext: (
			narrativeContext: NarrativeContext,
			suggestedEnding: string | null = null
		) => getContinuePromptFromContext(narrativeContext, suggestedEnding),
		getRecoveryPrompt
	},
	lessons: {
		all: lessons,
		getById: (lessonId: number) => getLessonById(lessonId) ?? null
	},
	ui: {
		imagePaths,
		pregeneratedImagePool
	}
};
