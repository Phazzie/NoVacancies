import type { GameState, NarrativeContext, StoryThreads } from '$lib/contracts';

type TransitionBridgeMap = Record<string, Record<string, string>>;
type ThreadKey =
	| 'oswaldoConflict'
	| 'trinaTension'
	| 'exhaustionLevel'
	| 'sydneyRealization'
	| 'oswaldoAwareness'
	| 'moneyResolved';

type TransitionBridge = { keys: string[]; lines: string[] } | null;

export const NARRATIVE_CONTEXT_CHAR_BUDGET = 12000;
const MAX_RECENT_SCENE_PROSE = 2;
const MAX_OLDER_SCENE_SUMMARIES = 6;

export const OSWALDO_CONFLICT_TRANSLATIONS: Record<string, string> = Object.freeze({
	'-2': "He's weirdly helpful today, like he wants credit for doing the bare minimum without being asked.",
	'-1': "He's not fighting, but every answer has an attitude tucked inside it.",
	'0': "Oswaldo hasn't been challenged. The resentment is still underground.",
	'1': 'Every question turns into a dodge. He acts accused before anyone accuses him.',
	'2': "Things with Oswaldo are actively hostile. He's in full deflection mode."
});

export const TRINA_TENSION_TRANSLATIONS: Record<string, string> = Object.freeze({
	'0': "Trina's just furniture. Annoying furniture, but furniture.",
	'1': 'The snack cake wrappers are piling up. The entitlement is starting to show.',
	'2': "Trina's taking and taking and does not even see it as taking.",
	'3': "Something has to happen with Trina. The math does not work anymore."
});

export const MONEY_TRANSLATIONS: Record<string, string> = Object.freeze({
	true: 'The room is paid. One less fire to put out.',
	false: 'Still eighteen short. The clock does not care.'
});

export const CAR_TRANSLATIONS: Record<string, string> = Object.freeze({
	true: 'Once the car incident is named, the air changes. Nobody can pretend this is random bad luck.',
	false: 'Nobody says the car thing out loud, but it sits in the room anyway.'
});

export const SYDNEY_REALIZATION_TRANSLATIONS: Record<string, string> = Object.freeze({
	'0': "She thinks Oswaldo cannot help. He's just not built for this.",
	'1': "She's starting to see it is not 'can't.' It's 'won't.'",
	'2': 'He helps other people. He rides five miles for other people. So why not her?',
	'3': 'He helps everyone except her. On purpose. That is not neglect. That is a choice.'
});

export const OSWALDO_AWARENESS_TRANSLATIONS: Record<string, string> = Object.freeze({
	'0': 'He treats rent money like weather. It happens around him, not because of him.',
	'1': "He gets flashes that she's carrying this place, then slides back into convenience.",
	'2': 'He can name what she does now, but still acts like naming it is the same as helping.',
	'3': 'He finally sees her labor as labor, not mood, and changes behavior without being managed.'
});

export const EXHAUSTION_TRANSLATIONS: Record<string, string> = Object.freeze({
	'0': "She's awake, alert, and has not spent herself yet.",
	'1': "She is steady enough to run the board, but only because she's forcing it.",
	'2': 'Her fuse is shorter and her patience now costs interest.',
	'3': 'Small disrespect lands big. She can still perform, but the seams are visible.',
	'4': 'Sydney is running on fumes. Every interaction costs more than it should.',
	'5': 'Her body clocks out before her responsibilities do. Survival mode takes over the room.'
});

export const BOUNDARY_TRANSLATIONS: Record<string, string> = Object.freeze({
	'no guests without asking': 'She told him the room is not a lobby.',
	'no lending money to dex': 'The bank of Sydney is closed for Dex. Out loud, on record.',
	'no eating saved food': "She labeled her food. That sentence should not need to exist.",
	'wake up before noon': 'She set a wake-up line. He can be mad and vertical at the same time.',
	'no phone snooping': 'Her phone is not communal property. She said it plain.',
	'no bringing krystal around': 'Krystal is now a hard no. No nostalgia loopholes.'
});

export const LESSON_HISTORY_TRANSLATIONS: Record<string, string> = Object.freeze({
	1: "She's already felt the weight of being the only one holding this place up.",
	2: 'She has already watched people miss the load right in front of them.',
	3: 'She has already tasted resentment from the same people she is carrying.',
	4: 'She has already seen that her energy is the engine keeping this dynamic alive.',
	5: 'She has already asked herself if they love her or just her output.',
	6: 'She has already watched clean stability erase the evidence of effort.',
	7: 'She has already heard that if they cannot feel her strain, it must not be hard.',
	8: "She already reached out for help and got told she'd figure it out.",
	9: 'She has already seen discomfort flip into criticism and rebellion.',
	10: "She has already craved one line: 'I see what would break if you were not here.'",
	11: 'She has already learned that acknowledgment without changed behavior is empty.',
	12: 'She has already considered letting friction surface so reality can be felt.',
	13: "She has already caught herself turning 'won't' into 'can't.'",
	14: 'She has already measured the room by load distribution, not explanations.',
	15: 'She has already lived how infrastructure gets blamed when one thing slips.',
	16: 'She has already framed partnership as risk reduction, not good intentions.',
	17: 'She has already asked what she is to them if her presence changes nothing.'
});

export const TRANSITION_BRIDGE_MAP: TransitionBridgeMap = Object.freeze({
	oswaldoConflict: {
		'0->2': "It goes from swallowed comments to open war after he calls her 'dramatic' while she's counting rent money.",
		'2->1': 'He backs off only after she stops negotiating and starts enforcing.'
	},
	trinaTension: {
		'1->3': 'Wrappers on the floor turns into open disrespect, and the room finally says the quiet part out loud.'
	},
	exhaustionLevel: {
		'2->4': "One missed hour of sleep and three fresh asks push her from tired to done pretending she's fine.",
		'4->3': 'A paid room and one uninterrupted hour lower the heat, but not the history.'
	},
	sydneyRealization: {
		'1->3': 'The pattern gets too clean to deny: he can show up for everybody else, just not for her.'
	},
	oswaldoAwareness: {
		'0->2': 'He overhears the hustle, the rent math, and the cleanup, and loses the excuse that he did not know.'
	},
	moneyResolved: {
		'false->true': 'She patches it with one ugly move, buys one day of air, and everyone mistakes that for stability.'
	}
});

function summarizeNarrativeArc(sceneCount: number): string {
	if (sceneCount <= 3) return 'opening pressure';
	if (sceneCount <= 7) return 'rising pressure';
	if (sceneCount <= 11) return 'consequence phase';
	return 'endgame pressure';
}

function normalizeBoundary(boundary: string): string {
	return typeof boundary === 'string' ? boundary.trim().toLowerCase() : '';
}

export function translateBoundaries(boundaries: string[] = []): string[] {
	if (!Array.isArray(boundaries) || boundaries.length === 0) {
		return ["Anything goes means Sydney pays for everything, including everybody else's bad habits."];
	}

	return boundaries.map((boundary) => {
		const normalized = normalizeBoundary(boundary);
		if (BOUNDARY_TRANSLATIONS[normalized]) {
			return BOUNDARY_TRANSLATIONS[normalized];
		}
		return `Boundary set: ${boundary}. The room now has one less loophole.`;
	});
}

export function translateLessonHistory(lessonsEncountered: number[] = []): string[] {
	if (!Array.isArray(lessonsEncountered) || lessonsEncountered.length === 0) {
		return ['No lesson has clearly landed yet; keep discovery mode active.'];
	}

	const uniqueIds = [...new Set(lessonsEncountered)]
		.map((value) => Number(value))
		.filter((value) => Number.isInteger(value))
		.sort((a, b) => a - b);

	return uniqueIds.map((lessonId) => {
		const line = LESSON_HISTORY_TRANSLATIONS[String(lessonId)];
		return line || `Lesson ${lessonId} has appeared already; do not re-teach it directly.`;
	});
}

export function translateThreadStateNarrative(threads: StoryThreads | null): string[] {
	if (!threads) {
		return ['Thread state unavailable; keep continuity conservative.'];
	}

	const boundariesCount = Array.isArray(threads.boundariesSet) ? threads.boundariesSet.length : 0;
	let boundaryCountLine = "Anything goes means Sydney pays for everything, including everybody else's bad habits.";
	if (boundariesCount === 1) {
		boundaryCountLine = "One line in the sand changes the room's weather, even if nobody likes it.";
	} else if (boundariesCount > 1) {
		boundaryCountLine = 'With rules in place, chaos has to knock before it comes in.';
	}

	return [
		OSWALDO_CONFLICT_TRANSLATIONS[String(threads.oswaldoConflict)] ||
			"Oswaldo's current posture is unclear; treat him as unpredictable.",
		TRINA_TENSION_TRANSLATIONS[String(threads.trinaTension)] ||
			"Trina's pressure level is unclear; keep her as an ambient stressor.",
		MONEY_TRANSLATIONS[String(!!threads.moneyResolved)],
		CAR_TRANSLATIONS[String(!!threads.carMentioned)],
		SYDNEY_REALIZATION_TRANSLATIONS[String(threads.sydneyRealization)] ||
			"Sydney's realization state is uncertain; keep her in observation mode.",
		OSWALDO_AWARENESS_TRANSLATIONS[String(threads.oswaldoAwareness)] ||
			"Oswaldo's awareness is unstable; assume low accountability.",
		EXHAUSTION_TRANSLATIONS[String(threads.exhaustionLevel)] ||
			'Her exhaustion is hard to read; keep the cost of every interaction visible.',
		boundaryCountLine
	];
}

function compressSceneForSummary(sceneText = ''): string {
	const oneLine = sceneText.replace(/\s+/g, ' ').trim();
	if (!oneLine) return '';
	const firstSentence = oneLine.split(/[.!?]/)[0] || oneLine;
	return firstSentence.slice(0, 160);
}

function estimateContextChars(context: unknown): number {
	try {
		return JSON.stringify(context).length;
	} catch {
		return 0;
	}
}

function applyContextBudget(context: NarrativeContext, maxChars: number): NarrativeContext {
	const budgeted = {
		...context,
		recentSceneProse: [...context.recentSceneProse],
		olderSceneSummaries: [...context.olderSceneSummaries],
		lessonHistoryLines: [...context.lessonHistoryLines],
		boundaryNarrativeLines: [...context.boundaryNarrativeLines],
		threadNarrativeLines: [...context.threadNarrativeLines]
	};

	const dropped = {
		olderSummaries: 0,
		recentProse: 0
	};

	while (estimateContextChars(budgeted) > maxChars && budgeted.olderSceneSummaries.length > 0) {
		budgeted.olderSceneSummaries.shift();
		dropped.olderSummaries += 1;
	}

	budgeted.meta = {
		...budgeted.meta,
		contextChars: estimateContextChars(budgeted),
		budgetChars: maxChars,
		truncated: dropped.olderSummaries > 0 || dropped.recentProse > 0,
		droppedOlderSummaries: dropped.olderSummaries,
		droppedRecentProse: dropped.recentProse
	};

	return budgeted;
}

function resolveTransitionBridge(gameState: GameState | null | undefined): TransitionBridge {
	const bridge = gameState?.pendingTransitionBridge;
	if (!bridge || !Array.isArray(bridge.lines) || bridge.lines.length === 0) {
		return null;
	}
	return {
		keys: Array.isArray(bridge.keys) ? bridge.keys : [],
		lines: bridge.lines.slice(0, 2)
	};
}

export function detectThreadTransitions(
	previousThreads: StoryThreads | null | undefined,
	currentThreads: StoryThreads | null | undefined
): { keys: string[]; lines: string[] } {
	if (!previousThreads || !currentThreads) {
		return { keys: [], lines: [] };
	}

	const changedKeys: string[] = [];
	const lines: string[] = [];

	const maybeAddTransition = (field: ThreadKey, fromValue: number | boolean, toValue: number | boolean) => {
		if (fromValue === toValue) return;
		changedKeys.push(field);
		const map = TRANSITION_BRIDGE_MAP[field];
		if (!map) return;
		const transitionKey = `${String(fromValue)}->${String(toValue)}`;
		if (map[transitionKey]) {
			lines.push(map[transitionKey]);
		}
	};

	maybeAddTransition('oswaldoConflict', previousThreads.oswaldoConflict, currentThreads.oswaldoConflict);
	maybeAddTransition('trinaTension', previousThreads.trinaTension, currentThreads.trinaTension);
	maybeAddTransition('exhaustionLevel', previousThreads.exhaustionLevel, currentThreads.exhaustionLevel);
	maybeAddTransition('sydneyRealization', previousThreads.sydneyRealization, currentThreads.sydneyRealization);
	maybeAddTransition('oswaldoAwareness', previousThreads.oswaldoAwareness, currentThreads.oswaldoAwareness);
	maybeAddTransition('moneyResolved', previousThreads.moneyResolved, currentThreads.moneyResolved);

	return { keys: changedKeys, lines };
}

export function buildNarrativeContext(
	gameState: GameState | null | undefined,
	options: { lastChoiceText?: string; maxChars?: number } = {}
): NarrativeContext {
	const { lastChoiceText = '', maxChars = NARRATIVE_CONTEXT_CHAR_BUDGET } = options;

	const sceneLog = Array.isArray(gameState?.sceneLog) ? gameState.sceneLog : [];
	const recentEntries = sceneLog.slice(-MAX_RECENT_SCENE_PROSE);
	const olderEntries = sceneLog.slice(0, Math.max(0, sceneLog.length - MAX_RECENT_SCENE_PROSE));

	const recentSceneProse = recentEntries.map((entry) => ({
		sceneId: entry.sceneId,
		text: entry.sceneText || '',
		viaChoiceText: entry.viaChoiceText || ''
	}));

	const olderSceneSummaries = olderEntries
		.slice(-MAX_OLDER_SCENE_SUMMARIES)
		.map((entry) => `[Choice: ${entry.viaChoiceText || 'n/a'}] ${compressSceneForSummary(entry.sceneText || '')}`);

	const context: NarrativeContext = {
		sceneCount: Number(gameState?.sceneCount || 0),
		arcPosition: summarizeNarrativeArc(Number(gameState?.sceneCount || 0)),
		lastChoiceText: lastChoiceText || '',
		threadState: gameState?.storyThreads || null,
		threadNarrativeLines: translateThreadStateNarrative(gameState?.storyThreads || null),
		boundaryNarrativeLines: translateBoundaries(gameState?.storyThreads?.boundariesSet || []),
		lessonHistoryLines: translateLessonHistory(gameState?.lessonsEncountered || []),
		recentSceneProse,
		olderSceneSummaries,
		transitionBridge: resolveTransitionBridge(gameState),
		meta: {
			contextChars: 0,
			budgetChars: maxChars,
			truncated: false,
			droppedOlderSummaries: 0,
			droppedRecentProse: 0
		}
	};

	context.meta.contextChars = estimateContextChars(context);
	return applyContextBudget(context, maxChars);
}
