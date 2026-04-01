import type {
	NarrativeContext,
	StoryThreads,
	TransitionBridge
} from '$lib/contracts';
import type { Lesson } from '$lib/narrative/lessonsCatalog';

export interface StoryThemeOverrides {
	accentColor?: string;
	backgroundClassName?: string;
}

export interface StoryPresentationDef {
	metaDescription: string;
	shellKicker: string;
	homeKicker: string;
	homeSubtitle: string;
	homeTagline: string;
	homeSupportCopy: string;
	storyBriefItems: string[];
}

export interface StoryCharacterDef {
	id: string;
	name: string;
	role: string;
	description: string;
}

export interface BehaviorSeed {
	incident: string;
	pattern: string;
}

export interface ComboStateLine {
	when: string;
	line: string;
}

export interface StoryVoiceDef {
	aestheticStatement: string;
	voiceCeilingLines: string[];
	behaviorSeeds?: BehaviorSeed[];
	comboStateLines?: ComboStateLine[];
}

export interface StoryPromptDefinition {
	systemPrompt: string;
	getOpeningPrompt: () => string;
	getContinuePromptFromContext: (
		narrativeContext: NarrativeContext,
		suggestedEnding?: string | null
	) => string;
	getRecoveryPrompt: (invalidOutput: string) => string;
}

export interface StoryContextDefinition {
	translateThreadStateNarrative: (threads: StoryThreads | null) => string[];
	translateBoundaries: (boundaries?: string[]) => string[];
	translateLessonHistory: (lessonsEncountered?: number[]) => string[];
	detectThreadTransitions: (
		previousThreads: StoryThreads | null | undefined,
		currentThreads: StoryThreads | null | undefined
	) => TransitionBridge;
}

export interface BuilderFieldFeedback {
	score: number;
	flags: string[];
	suggestion: string;
}

export type BuilderDraftDimension =
	| 'voiceConsistency'
	| 'behavioralSpecificity'
	| 'mechanicClarity'
	| 'promptCoherence'
	| 'repetitionRisk';

export type BuilderDraftFindingSeverity = 'blocker' | 'warning' | 'info';

export interface BuilderDraftFinding {
	severity: BuilderDraftFindingSeverity;
	dimension: BuilderDraftDimension;
	fieldKey: string;
	message: string;
}

export interface BuilderDraftReadinessThresholds {
	minOverallScore: number;
	minDimensionScore: number;
	maxBlockers: number;
}

export interface BuilderDraftEvaluation {
	overallScore: number;
	dimensionScores: Record<BuilderDraftDimension, number>;
	findings: BuilderDraftFinding[];
	thresholds: BuilderDraftReadinessThresholds;
	readiness: 'publishable' | 'needs-revision' | 'blocked';
	publishable: boolean;
}

export interface BuilderStoryCharacterDraft {
	name: string;
	role: string;
	description: string;
}

export interface BuilderStoryMechanicDraft {
	key: string;
	label: string;
	voiceMap: Array<{ value: string; line: string }>;
}

export interface BuilderStoryDraft {
	title: string;
	premise: string;
	setting: string;
	aestheticStatement: string;
	voiceCeilingLines: string[];
	characters: BuilderStoryCharacterDraft[];
	mechanics: BuilderStoryMechanicDraft[];
	openingPrompt: string;
	systemPrompt: string;
}

export interface StoryBuilderDefinition {
	referencePromptGuide: string;
	proseRubric: string[];
	createEmptyDraft: () => BuilderStoryDraft;
}

export interface StoryDefinition {
	id: string;
	title: string;
	summary: string;
	initialSceneId: string;
	createInitialStoryThreads: () => StoryThreads;
	prompts: StoryPromptDefinition;
	lessons: {
		all: Lesson[];
		getById: (lessonId: number) => Lesson | null;
		detectInScene?: (sceneText: string) => number | null;
	};
	context: StoryContextDefinition;
	characters: StoryCharacterDef[];
	voice: StoryVoiceDef;
	builder: StoryBuilderDefinition;
	presentation: StoryPresentationDef;
	ui: {
		imagePaths: Record<string, string>;
		pregeneratedImagePool: string[];
		theme?: StoryThemeOverrides;
	};
}

export type StoryCartridge = StoryDefinition;
