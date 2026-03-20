import { createStoryThreads, ImageKeys, SceneIds, type NarrativeContext } from '$lib/contracts';
import type { StoryDefinition } from '$lib/stories/types';

function translateThreadStateNarrative(): string[] {
	return [
		'The starter cartridge is intentionally generic. Replace these lines with your own mechanics and behavioral prose.',
		'Nothing in this cartridge should sound like No Vacancies.'
	];
}

function translateBoundaries(boundaries: string[] = []): string[] {
	if (!Array.isArray(boundaries) || boundaries.length === 0) {
		return ['No authored boundaries exist yet. Define what counts as a line in the sand for this story.'];
	}

	return boundaries.map((boundary) => `Boundary currently in play: ${boundary}. Rewrite this in your story voice.`);
}

function translateLessonHistory(lessonsEncountered: number[] = []): string[] {
	if (lessonsEncountered.length === 0) {
		return ['No lesson history is authored yet. Let discovery stay live.'];
	}

	return lessonsEncountered.map((lessonId) => `Lesson ${lessonId} already happened. Replace with story-specific consequence prose.`);
}

function detectThreadTransitions(): { keys: string[]; moments: [] } {
	return { keys: [], moments: [] };
}

function createEmptyDraft() {
	return {
		title: 'Starter Story',
		premise: '',
		setting: '',
		aestheticStatement:
			'Write concrete behavioral prose with motive and consequence. Replace every placeholder with story-specific language.',
		voiceCeilingLines: ['Replace me with two authored lines that prove the story voice.'],
		characters: [
			{
				name: 'Protagonist',
				role: 'lead',
				description: 'Who is carrying the load and what are they pretending not to know yet?'
			}
		],
		mechanics: [
			{
				key: 'pressure',
				label: 'Pressure',
				voiceMap: [
					{ value: '0', line: 'Pressure exists but has not shown its teeth yet.' },
					{ value: '2', line: 'Pressure is now visible in the room, not just in the protagonist.' }
				]
			}
		],
		openingPrompt:
			'Generate the opening scene. Establish the room, the pressure, and the first real decision.',
		systemPrompt:
			'You are authoring a new narrative cartridge. Keep the prose behavioral, specific, and uncomfortably concrete.'
	};
}

const genericSystemPrompt = `You are an AI storyteller running a starter cartridge reference. Keep continuity strict, write behavioral prose, and output valid JSON only.`;

function getOpeningPrompt(): string {
	return `Generate an opening scene for a generic starter story with 2-3 choices. Keep the language concrete and output valid JSON only.`;
}

function getContinuePromptFromContext(narrativeContext: NarrativeContext): string {
	return `Continue the story using this authored context:
- Scene count: ${narrativeContext.sceneCount}
- Recent openings:
${narrativeContext.recentOpenings.map((line) => `  - ${line}`).join('\n') || '  - none'}
- Recent choices:
${narrativeContext.recentChoiceTexts.map((line) => `  - ${line}`).join('\n') || '  - none'}
- Thread lines:
${narrativeContext.threadNarrativeLines.map((line) => `  - ${line}`).join('\n')}

Output valid JSON only.`;
}

function getRecoveryPrompt(invalidOutput: string): string {
	return `Your previous response was invalid JSON. Recover to valid JSON only while preserving story intent.

Previous output:
${invalidOutput.slice(0, 300)}`;
}

export const starterKitCartridge: StoryDefinition = {
	id: 'starter-kit',
	title: 'Starter Kit Story',
	summary:
		'Reference cartridge proving the engine can swap stories without leaking flagship-story prose into prompts, images, or readiness surfaces.',
	initialSceneId: SceneIds.OPENING,
	createInitialStoryThreads: () => createStoryThreads(),
	prompts: {
		systemPrompt: genericSystemPrompt,
		getOpeningPrompt,
		getContinuePromptFromContext,
		getRecoveryPrompt
	},
	lessons: {
		all: [],
		getById: () => null,
		detectInScene: () => null
	},
	context: {
		translateThreadStateNarrative,
		translateBoundaries,
		translateLessonHistory,
		detectThreadTransitions
	},
	characters: [
		{
			id: 'lead',
			name: 'Lead',
			role: 'protagonist',
			description: 'Placeholder character demonstrating that story metadata can swap without inheriting another story’s detail.'
		}
	],
	voice: {
		aestheticStatement:
			'Behavior first. Replace every placeholder with story-authored, motive-driven language.',
		voiceCeilingLines: ['Replace me with your own voice ceiling line.']
	},
	builder: {
		referencePromptGuide:
			'Use this cartridge as a neutral scaffold when you need a blank-but-not-empty authored starting point.',
		proseRubric: [
			'Does the line behave instead of summarizing?',
			'Is there at least one concrete detail?',
			'Is the line concise?',
			'Would a reader feel the situation before being told what it means?'
		],
		createEmptyDraft
	},
	presentation: {
		metaDescription:
			'A neutral starter cartridge proving the story engine, shell, and builder can swap stories without inheriting another story’s visible copy.',
		shellKicker: 'Story engine / starter cartridge',
		homeKicker: 'Interactive fiction / story engine / starter scaffold',
		homeSubtitle: 'Swap The Story, Keep The Engine',
		homeTagline:
			'A reference story proving the app can change cartridges without leaking another story’s branding into the visible shell.',
		homeSupportCopy:
			'This cartridge is intentionally generic. It exists to validate story swapping, neutral scaffolding, and authoring flow before a fully authored second story lands.',
		storyBriefItems: [
			'Reference story metadata should replace the active shell branding cleanly.',
			'Builder defaults should stay generic even when live AI is unavailable.',
			'Operational surfaces should still show the active cartridge clearly.'
		]
	},
	ui: {
		imagePaths: {
			[ImageKeys.HOTEL_ROOM]: '/images/hotel_room.png'
		},
		pregeneratedImagePool: []
	}
};
