export const EndingTypes = {
	LOOP: 'loop',
	SHIFT: 'shift',
	EXIT: 'exit',
	RARE: 'rare'
} as const;

export type CanonicalEndingType = (typeof EndingTypes)[keyof typeof EndingTypes];
export type EndingType = CanonicalEndingType | (string & {});

export const SceneIds = {
	OPENING: 'opening'
} as const;

export const ImageKeys = {
	HOTEL_ROOM: 'hotel_room',
	SYDNEY_LAPTOP: 'sydney_laptop',
	SYDNEY_THINKING: 'sydney_thinking',
	SYDNEY_FRUSTRATED: 'sydney_frustrated',
	SYDNEY_TIRED: 'sydney_tired',
	SYDNEY_PHONE: 'sydney_phone',
	SYDNEY_COFFEE: 'sydney_coffee',
	SYDNEY_WINDOW: 'sydney_window',
	OSWALDO_SLEEPING: 'oswaldo_sleeping',
	OSWALDO_AWAKE: 'oswaldo_awake',
	THE_DOOR: 'the_door',
	EMPTY_ROOM: 'empty_room',
	MOTEL_EXTERIOR: 'motel_exterior'
} as const;

export const Moods = {
	NEUTRAL: 'neutral',
	TENSE: 'tense',
	HOPEFUL: 'hopeful',
	DARK: 'dark',
	TRIUMPHANT: 'triumphant'
} as const;

export type Mood = (typeof Moods)[keyof typeof Moods];

export interface Choice {
	id: string;
	text: string;
	outcome?: string;
	nextSceneId?: string;
}

export type MechanicValue = number | boolean | string[];

export interface Scene {
	sceneId: string;
	sceneText: string;
	choices: Choice[];
	lessonId: number | null;
	imageKey: string;
	imagePrompt?: string;
	isEnding: boolean;
	endingType: EndingType | null;
	mood?: Mood;
	storyThreadUpdates?: Partial<StoryThreads> | null;
	mechanicUpdates?: Record<string, MechanicValue> | null;
}

export interface StoryThreads {
	oswaldoConflict: number;
	trinaTension: number;
	moneyResolved: boolean;
	carMentioned: boolean;
	sydneyRealization: number;
	boundariesSet: string[];
	oswaldoAwareness: number;
	exhaustionLevel: number;
	dexTriangulation: number;
}

export interface SceneLogEntry {
	sceneId: string;
	sceneText: string;
	viaChoiceText?: string;
	isEnding?: boolean;
}

export interface ChoiceHistoryEntry {
	sceneId: string;
	choiceId: string;
	choiceText?: string;
	timestamp: number;
}

export interface RuntimeFeatureFlags {
	narrativeContextV2: boolean;
	transitionBridges: boolean;
}

export interface NarrativeContext {
	sceneCount: number;
	arcPosition: string;
	lastChoiceText: string;
	threadState: StoryThreads | null;
	threadNarrativeLines: string[];
	boundaryNarrativeLines: string[];
	lessonHistoryLines: string[];
	recentBeats: string[];
	recentSceneProse: Array<{ sceneId: string; text: string; viaChoiceText: string }>;
	olderSceneSummaries: string[];
	transitionBridge: { keys: string[]; lines: string[] } | null;
	meta: {
		contextChars: number;
		budgetChars: number;
		truncated: boolean;
		droppedOlderSummaries: number;
		droppedRecentProse: number;
	};
}

export interface GameState {
	storyId: string;
	currentSceneId: string;
	history: ChoiceHistoryEntry[];
	lessonsEncountered: number[];
	storyThreads: StoryThreads;
	mechanics: Record<string, MechanicValue>;
	sceneLog: SceneLogEntry[];
	pendingTransitionBridge: { keys: string[]; lines: string[] } | null;
	featureFlags: RuntimeFeatureFlags;
	apiKey: string | null;
	sceneCount: number;
	startTime: number;
}

export interface GameSettings {
	showLessons: boolean;
	apiKey: string;
	unlockedEndings: EndingType[];
	featureFlags: RuntimeFeatureFlags;
}

export const DEFAULT_FEATURE_FLAGS: RuntimeFeatureFlags = Object.freeze({
	narrativeContextV2: true,
	transitionBridges: true
});

export const DEFAULT_SETTINGS: GameSettings = Object.freeze({
	showLessons: true,
	apiKey: '',
	unlockedEndings: [],
	featureFlags: DEFAULT_FEATURE_FLAGS
});

export function normalizeFeatureFlags(
	candidate: Partial<RuntimeFeatureFlags> = {}
): RuntimeFeatureFlags {
	return {
		narrativeContextV2:
			typeof candidate.narrativeContextV2 === 'boolean'
				? candidate.narrativeContextV2
				: DEFAULT_FEATURE_FLAGS.narrativeContextV2,
		transitionBridges:
			typeof candidate.transitionBridges === 'boolean'
				? candidate.transitionBridges
				: DEFAULT_FEATURE_FLAGS.transitionBridges
	};
}

/**
 * Creates a new StoryThreads object populated with default narrative thread values.
 *
 * @returns A StoryThreads object with numeric counters set to 0 (except `exhaustionLevel` set to 1), boolean flags `moneyResolved` and `carMentioned` set to `false`, and an empty `boundariesSet` array.
 */
export function createStoryThreads(): StoryThreads {
	return {
		oswaldoConflict: 0,
		trinaTension: 0,
		moneyResolved: false,
		carMentioned: false,
		sydneyRealization: 0,
		boundariesSet: [],
		oswaldoAwareness: 0,
		exhaustionLevel: 1,
		dexTriangulation: 0
	};
}

/**
 * Create a new initial GameState with optional overrides.
 *
 * @param options - Optional overrides for the initial state
 * @param options.storyId - Identifier for the story; defaults to `'no-vacancies'`
 * @param options.featureFlags - Partial runtime feature flags to merge with defaults
 * @param options.apiKey - Optional API key to attach to the state; defaults to `null`
 * @param options.now - Function returning the current time in milliseconds; defaults to `Date.now`
 * @returns The initialized GameState with default structures (threads, mechanics, history, etc.) and `startTime` set to the current epoch milliseconds
 */
export function createGameState(options?: {
	storyId?: string;
	featureFlags?: Partial<RuntimeFeatureFlags>;
	apiKey?: string | null;
	now?: () => number;
}): GameState {
	const now = options?.now ?? Date.now;
	return {
		storyId: options?.storyId ?? 'no-vacancies',
		currentSceneId: SceneIds.OPENING,
		history: [],
		lessonsEncountered: [],
		storyThreads: createStoryThreads(),
		mechanics: {},
		sceneLog: [],
		pendingTransitionBridge: null,
		featureFlags: normalizeFeatureFlags(options?.featureFlags),
		apiKey: options?.apiKey ?? null,
		sceneCount: 0,
		startTime: now()
	};
}

/**
 * Merge partial StoryThreads updates into an existing StoryThreads object, concatenating any provided `boundariesSet` entries onto the existing list.
 *
 * @param currentThreads - The source StoryThreads to apply updates to
 * @param updates - Partial updates to apply; if omitted or null, `currentThreads` is returned unchanged. Provided non-undefined fields replace the corresponding values on the result; when `boundariesSet` is provided and non-empty, its elements are appended to the existing `boundariesSet` array.
 * @returns A new StoryThreads object with the updates applied. `boundariesSet` contains the original entries followed by any appended entries from `updates`.
 */
export function mergeThreadUpdates(
	currentThreads: StoryThreads,
	updates?: Partial<StoryThreads> | null
): StoryThreads {
	if (!updates) return currentThreads;

	const merged: StoryThreads = {
		...currentThreads,
		boundariesSet: [...currentThreads.boundariesSet]
	};

	for (const key of Object.keys(updates) as Array<keyof StoryThreads>) {
		if (key === 'boundariesSet') {
			if (Array.isArray(updates.boundariesSet) && updates.boundariesSet.length > 0) {
				merged.boundariesSet = [...merged.boundariesSet, ...updates.boundariesSet];
			}
			continue;
		}

		const nextValue = updates[key];
		if (typeof nextValue !== 'undefined') {
			(merged[key] as StoryThreads[typeof key]) = nextValue as StoryThreads[typeof key];
		}
	}

	return merged;
}

/**
 * Merge mechanic updates into the current mechanics, appending arrays and overwriting non-array values.
 *
 * @param current - The existing mechanics map to merge into
 * @param updates - Optional updates to apply; if `null` or `undefined`, a shallow copy of `current` is returned
 * @returns A new mechanics map with array values concatenated onto existing arrays and non-array values replaced
 */
export function mergeMechanicUpdates(
	current: Record<string, MechanicValue>,
	updates?: Record<string, MechanicValue> | null
): Record<string, MechanicValue> {
	if (!updates) return { ...current };
	const merged = { ...current };

	for (const [key, value] of Object.entries(updates)) {
		if (Array.isArray(value)) {
			// Append for sets
			const existing = Array.isArray(merged[key]) ? (merged[key] as string[]) : [];
			merged[key] = [...existing, ...value];
		} else {
			// Overwrite for others
			merged[key] = value;
		}
	}
	return merged;
}

/**
 * Determines whether a value matches the required Scene structure.
 *
 * @param scene - Value to validate as a Scene
 * @returns `true` if `scene` has the required Scene properties (`sceneId`, `sceneText`, `choices` array, `isEnding`, and `endingType` when `isEnding` is true), `false` otherwise.
 */
export function validateScene(scene: unknown): scene is Scene {
	if (!scene || typeof scene !== 'object') return false;
	const typedScene = scene as Scene;
	if (typeof typedScene.sceneId !== 'string') return false;
	if (typeof typedScene.sceneText !== 'string') return false;
	if (!Array.isArray(typedScene.choices)) return false;
	if (typeof typedScene.isEnding !== 'boolean') return false;
	if (typedScene.isEnding && !typedScene.endingType) return false;
	return true;
}

export function validateChoice(choice: unknown): choice is Choice {
	if (!choice || typeof choice !== 'object') return false;
	const typedChoice = choice as Choice;
	if (typeof typedChoice.id !== 'string') return false;
	if (typeof typedChoice.text !== 'string') return false;
	return true;
}

export function validateEndingType(type: unknown): EndingType {
	if (!type || typeof type !== 'string') return EndingTypes.LOOP;
	const normalized = type.toLowerCase().trim();
	if (Object.values(EndingTypes).includes(normalized as CanonicalEndingType)) {
		return normalized;
	}
	if (/^[a-z\s]{3,30}$/.test(normalized)) {
		return normalized as EndingType;
	}
	return EndingTypes.LOOP;
}

export function isValidChoiceId(choiceId: unknown): choiceId is string {
	return typeof choiceId === 'string' && /^[a-z0-9_-]{1,80}$/i.test(choiceId);
}

/**
 * Creates a cloned Scene where the top-level object and key nested collections are copied to avoid shared mutation.
 *
 * The returned Scene is a shallow copy of `scene` with deep copies of the `choices` array (each choice object), a copied
 * `storyThreadUpdates.boundariesSet` array when present, and a deep-cloned `mechanicUpdates` object; other nested fields are preserved by shallow copy.
 *
 * @param scene - The Scene to clone
 * @returns A new Scene object equal in value to `scene` but safe to mutate without affecting the original
 */
export function cloneScene(scene: Scene): Scene {
	return {
		...scene,
		choices: scene.choices.map((choice) => ({ ...choice })),
		storyThreadUpdates: scene.storyThreadUpdates
			? {
				...scene.storyThreadUpdates,
				...(Array.isArray(scene.storyThreadUpdates.boundariesSet)
					? { boundariesSet: [...scene.storyThreadUpdates.boundariesSet] }
					: {})
			}
			: scene.storyThreadUpdates ?? null,
		mechanicUpdates: scene.mechanicUpdates ? JSON.parse(JSON.stringify(scene.mechanicUpdates)) : null
	};
}

/**
 * Create a deep clone of a GameState that does not share nested mutable structures with the original.
 *
 * @param state - The GameState to clone
 * @returns A new GameState whose nested arrays and objects (history, lessonsEncountered, storyThreads.boundariesSet, mechanics, sceneLog, pendingTransitionBridge, featureFlags, etc.) are copied so mutations do not affect the source
 */
export function cloneGameState(state: GameState): GameState {
	return {
		...state,
		history: state.history.map((entry) => ({ ...entry })),
		lessonsEncountered: [...state.lessonsEncountered],
		storyThreads: {
			...state.storyThreads,
			boundariesSet: [...state.storyThreads.boundariesSet]
		},
		mechanics: JSON.parse(JSON.stringify(state.mechanics)),
		sceneLog: state.sceneLog.map((entry) => ({ ...entry })),
		pendingTransitionBridge: state.pendingTransitionBridge
			? {
				keys: [...state.pendingTransitionBridge.keys],
				lines: [...state.pendingTransitionBridge.lines]
			}
			: null,
		featureFlags: { ...state.featureFlags }
	};
}