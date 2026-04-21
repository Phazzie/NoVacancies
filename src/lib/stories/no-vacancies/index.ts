import { createStoryThreads, ImageKeys, SceneIds } from '$lib/contracts';
import { getLessonById, lessons } from '$lib/narrative/lessonsCatalog';
import type { StoryDefinition } from '$lib/stories/types';
import {
	detectThreadTransitions,
	translateBoundaries,
	translateLessonHistory,
	translateThreadStateNarrative
} from '$lib/stories/no-vacancies/context';
import {
	getContinuePromptFromContext,
	getOpeningPrompt,
	getRecoveryPrompt,
	SYSTEM_PROMPT,
	VOICE_CEILING_LINES
} from '$lib/stories/no-vacancies/prompts';

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

function createEmptyDraft() {
	return {
		title: 'No Vacancies',
		premise:
			'A functional meth addict in a daily-rate motel keeps paying for everyone else until survival itself becomes the trap.',
		setting: 'A daily-rate motel room at dawn, rent due by 11 AM, with 3-5 phones glowing in the dark.',
		aestheticStatement:
			'Motive-driven anthropomorphism: every line behaves, nothing explains itself, consequences are felt before they are named.',
		voiceCeilingLines: [...VOICE_CEILING_LINES],
		characters: [
			{
				name: 'Sydney',
				role: 'protagonist',
				description:
					'44, functional, exhausted, doing invisible labor while everybody else treats her competence like room service.'
			},
			{
				name: 'Oswaldo',
				role: 'boyfriend',
				description:
					'Selectively helpful to strangers, useless to Sydney, allergic to admitting fault, heroic only where validation is public.'
			},
			{
				name: 'Trina',
				role: 'crasher',
				description:
					'Entitlement tax in human form, treating the room like a resource field that replenishes itself.'
			},
			{
				name: 'Dex',
				role: 'subtle saboteur',
				description:
					'Mirrors whoever is in front of him, validates for access, and spends concern like a keycard.'
			}
		],
		mechanics: [
			{
				key: 'oswaldoConflict',
				label: 'Oswaldo Conflict',
				voiceMap: [
					{
						value: '0',
						line: "Oswaldo hasn't been challenged yet. The resentment waits underneath like a dog that has not decided whether to bark."
					},
					{
						value: '2',
						line: "Things with Oswaldo do not argue anymore. They just collide and wait to see who apologizes first."
					}
				]
			},
			{
				key: 'dexTriangulation',
				label: 'Dex Triangulation',
				voiceMap: [
					{ value: '0', line: 'Dex is ambient for now. He smiles, listens, and takes inventory.' },
					{
						value: '3',
						line: 'Dex is actively triangulating. Validation in one room, ridicule in the next, access preserved either way.'
					}
				]
			}
		],
		openingPrompt: getOpeningPrompt(),
		systemPrompt: SYSTEM_PROMPT
	};
}

export const noVacanciesCartridge: StoryDefinition = {
	id: 'no-vacancies',
	title: 'No Vacancies',
	summary:
		'Sydney is the functional load-bearing beam in a daily-rate motel room full of people who treat her survival labor like background infrastructure.',
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
	context: {
		translateThreadStateNarrative,
		translateBoundaries,
		translateLessonHistory,
		detectThreadTransitions
	},
	characters: [
		{
			id: 'sydney',
			name: 'Sydney',
			role: 'protagonist',
			description:
				'44, brunette, asymmetric bob, blue eyes, functional on meth, carrying the room through fraud, scheduling, and invisible labor.'
		},
		{
			id: 'oswaldo',
			name: 'Oswaldo',
			role: 'boyfriend',
			description:
				'Hero to strangers, burden to her; selectively useful where validation is public and conveniently helpless when she needs him.'
		},
		{
			id: 'trina',
			name: 'Trina',
			role: 'crasher',
			description:
				'Accumulated obligation with snack-cake wrappers and instant entitlement.'
		},
		{
			id: 'dex',
			name: 'Dex',
			role: 'subtle saboteur',
			description:
				'Agreement as camouflage, betrayal as operations model, access as the real loyalty.'
		}
	],
	voice: {
		aestheticStatement:
			'Motive-driven anthropomorphism. Make every line behave. Give objects, rooms, and silence motives. Nothing explains itself.',
		voiceCeilingLines: [...VOICE_CEILING_LINES],
		behaviorSeeds: [
			{
				incident:
					'Rides five miles for Dex\'s smokes, then asks Sydney to DoorDash him water because he is "too sore" to walk to the machine.',
				pattern: 'Selectively allocates effort based on who validates him, not who needs him.'
			},
			{
				incident:
					'Dex listens like a friend, then her private complaint comes back from somebody else with different punctuation.',
				pattern: 'Concern is the entry fee; betrayal is the operating model.'
			}
		],
		comboStateLines: [
			{
				when: 'When exhaustion is high and the room is still unpaid',
				line: 'She is too tired to be diplomatic and too broke to be gentle.'
			},
			{
				when: 'When Oswaldo conflict is high and awareness is still low',
				line: 'He feels accused before he feels responsible.'
			}
		]
	},
	builder: {
		referencePromptGuide:
			'Use No Vacancies as the behavioral reference: concrete motive, sensory detail, and consequences that arrive through action rather than explanation.',
		proseRubric: [
			'Does the line describe behavior instead of summarizing a trait or feeling?',
			'Does it contain a concrete object, action, name, number, or socially specific detail?',
			'Is it under 50 words?',
			'Does it avoid self-explaining language and Hallmark-card summary phrasing?'
		],
		createEmptyDraft
	},
	presentation: {
		metaDescription:
			'A motel-noir interactive narrative about invisible labor, pressure, and what finally changes.',
		shellKicker: 'Daily-rate motel / live narrative build',
		homeKicker: 'Interactive fiction / motel noir / live AI run',
		homeSubtitle: 'Carry What Matters',
		homeTagline:
			'A story about invisible labor, pressure, and the moment the room stops mistaking endurance for love.',
		homeSupportCopy:
			'Sydney is 44, holding together a daily-rate motel life with five burner phones, too many obligations, and no clean exit. Each scene pushes the load-bearing math harder.',
		storyBriefItems: [
			'AI-written scenes with structural guardrails and bounded recovery.',
			'Three choices per turn, with quick keys for faster live demos.',
			'Debug and settings stay close when a run needs operator intervention.'
		]
	},
	ui: {
		imagePaths,
		pregeneratedImagePool
	}
};
