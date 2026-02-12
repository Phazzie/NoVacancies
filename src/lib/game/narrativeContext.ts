import type { GameState, NarrativeContext, StoryThreads } from '../contracts';

type TransitionBridgeMap = Record<string, Record<string, string>>;
type ThreadKey =
	| 'oswaldoConflict'
	| 'trinaTension'
	| 'exhaustionLevel'
	| 'sydneyRealization'
	| 'oswaldoAwareness'
	| 'moneyResolved'
	| 'dexTriangulation';

type TransitionBridge = { keys: string[]; lines: string[] } | null;

export const NARRATIVE_CONTEXT_CHAR_BUDGET = 12000;
const MAX_RECENT_SCENE_PROSE = 2;
const MAX_OLDER_SCENE_SUMMARIES = 6;
const MIN_RECENT_SCENE_PROSE_CHARS = 120;
const RECENT_SCENE_PROSE_TRIM_STEP = 240;

export const OSWALDO_CONFLICT_TRANSLATIONS: Record<string, string> = Object.freeze({
	'-2': "He's doing things before being asked. The gestures have audition energy.",
	'-1': "He's not fighting, but every answer has an attitude tucked inside it.",
	'0': "Oswaldo hasn't been challenged yet. The resentment waits underneath like a dog that has not decided whether to bark.",
	'1': 'Every question turns into a dodge. He acts accused before anyone accuses him.',
	'2': "Things with Oswaldo do not argue anymore. They just collide and wait to see who apologizes first."
});

export const TRINA_TENSION_TRANSLATIONS: Record<string, string> = Object.freeze({
	'0': "Trina moves through the room like furniture someone else paid for.",
	'1': 'The wrappers pile up in places wrappers go when nobody thinks cleanup is their job.',
	'2': "Trina takes without asking. Not because she's bold. Because the question never occurs to her.",
	'3': "Something has to give with Trina. The room already picked what. It's waiting on Sydney to notice."
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
	'0': "Oswaldo cannot help. That's what Sydney tells herself. The story holds until she stops repeating it.",
	'1': "The 'cannot' is starting to look like 'will not' if she squints. She is not squinting yet. Almost.",
	'2': "He rides five miles for strangers. He cannot walk five feet for her. The pattern does not explain itself. It does not have to.",
	'3': 'He helps everyone but her. Not by accident. Not because he forgot. He chose this distribution and keeps choosing it.'
});

export const OSWALDO_AWARENESS_TRANSLATIONS: Record<string, string> = Object.freeze({
	'0': 'He treats rent money like weather. It happens around him, not because of him.',
	'1': "He gets flashes of what she's carrying, then slides back into convenience before the flash costs him anything.",
	'2': 'He can name what she does now. The naming sits where the helping should be.',
	'3': 'He sees her labor as labor, not mood. The behavior changed. She did not have to ask, manage, or explain this time.'
});

export const EXHAUSTION_TRANSLATIONS: Record<string, string> = Object.freeze({
	'0': "She's awake, alert, and has not spent herself yet. The day is still borrowing at zero percent.",
	'1': "She's steady enough to run the board, but it costs her to look this functional.",
	'2': 'Her fuse is shorter and her patience now costs interest.',
	'3': "Small disrespect lands big. She can still perform, but the seams show when nobody's trying to see them.",
	'4': "Every interaction costs more than it should. Her body is negotiating terms she cannot afford.",
	'5': "Her body clocked out three hours ago. Survival mode is running the shift now and does not take requests."
});

export const DEX_TRIANGULATION_TRANSLATIONS: Record<string, string> = Object.freeze({
	'0': 'Dex is ambient for now. He smiles, listens, and takes inventory.',
	'1': "Dex is mirroring hard. Every sentence sounds like agreement before it sounds like thought.",
	'2': 'He is relaying selectively. What Sydney says in confidence returns with different punctuation.',
	'3': 'Dex is actively triangulating. Validation in one room, ridicule in the next, access preserved either way.'
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
	1: 'She carried the room and the room spent the lift like petty cash.',
	2: 'She closed the gap and nobody asked what it cost to close it.',
	3: 'The people leaning on her started sounding irritated at the beam.',
	4: 'The dynamic kept breathing because she kept feeding it.',
	5: 'They noticed the output and skipped the person producing it.',
	6: 'Stability showed up and the labor that built it disappeared on arrival.',
	7: 'Because she looked composed, they billed the strain to nowhere.',
	8: 'The one time she asked for help, everyone treated it like weather.',
	9: 'Her competence made the room defensive before anyone said a word.',
	10: "She is still waiting for one line: 'I see what would break if you were not here.'",
	11: 'Acknowledgment got spoken out loud and died before it reached behavior.',
	12: 'She let one thing drop and the room finally stopped pretending.',
	13: "She watched herself translating 'will not' into 'cannot' one excuse at a time.",
	14: 'The explanation changed. The load distribution did not.',
	15: 'One failure got remembered. A hundred prevented failures did not.',
	16: 'She measured partnership in risk reduction and came up short.',
	17: 'The question stayed: if her presence changes nothing, what is she here for?'
});

export const TRANSITION_BRIDGE_MAP: TransitionBridgeMap = Object.freeze({
	oswaldoConflict: {
		'0->2': "It goes from swallowed comments to open war the moment he calls her 'dramatic' while she's counting rent money.",
		'2->1': 'He backs off. Not because he changed his mind. Because she stopped negotiating and started enforcing.'
	},
	trinaTension: {
		'1->3': "Wrappers on the floor become something the room cannot pretend not to see anymore."
	},
	exhaustionLevel: {
		'2->4': "One missed hour of sleep and three fresh asks push her past tired into done pretending she's fine.",
		'4->3': 'A paid room and one uninterrupted hour drop the temperature. The history stays at full volume.'
	},
	sydneyRealization: {
		'1->3': 'The pattern gets too clean to call coincidence. He shows up for everyone else. Just not for her.'
	},
	oswaldoAwareness: {
		'0->2': "He overhears the hustle, the rent math, the cleanup. The excuse that he did not know just expired."
	},
	moneyResolved: {
		'false->true': "She patches it with one ugly move and buys one day of air. Everyone calls that stability because they do not know the cost."
	},
	dexTriangulation: {
		'0->2': 'Dex listens like a friend, then the private conversation shows up in someone else’s mouth.',
		'1->3': 'The mask drops: concern becomes currency, and everybody gets a different version of the same story.'
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
		return ["Anything goes means Sydney pays for everything, including everybody's bad habits."];
	}

	return boundaries.map((boundary) => {
		const normalized = normalizeBoundary(boundary);
		if (BOUNDARY_TRANSLATIONS[normalized]) {
			return BOUNDARY_TRANSLATIONS[normalized];
		}
		return `She drew a new line: ${boundary}. One more loophole just lost its key.`;
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
		return line || `Lesson ${lessonId} is already in motion. Advance the consequence; do not replay the reveal.`;
	});
}

export function translateThreadStateNarrative(threads: StoryThreads | null): string[] {
	if (!threads) {
		return ['Continuity memory dropped this turn. Keep behavior conservative and avoid abrupt reversals.'];
	}

	const boundariesCount = Array.isArray(threads.boundariesSet) ? threads.boundariesSet.length : 0;
	let boundaryCountLine = "Anything goes means Sydney pays for everything, including everybody's bad habits.";
	if (boundariesCount === 1) {
		boundaryCountLine = "One line in the sand changes the room's weather, even if nobody likes it.";
	} else if (boundariesCount > 1) {
		boundaryCountLine = 'With rules in place, chaos has to knock before it comes in.';
	}

	return [
		OSWALDO_CONFLICT_TRANSLATIONS[String(threads.oswaldoConflict)] ||
			'Oswaldo is unreadable this turn. Assume fast pivots between charm, dodge, and blame.',
		TRINA_TENSION_TRANSLATIONS[String(threads.trinaTension)] ||
			"Trina's pressure is off-camera right now. Keep her as ambient drain with entitlement intact.",
		MONEY_TRANSLATIONS[String(!!threads.moneyResolved)],
		CAR_TRANSLATIONS[String(!!threads.carMentioned)],
		SYDNEY_REALIZATION_TRANSLATIONS[String(threads.sydneyRealization)] ||
			'She has not named the pattern yet. Keep her observing the mismatch between words and labor.',
		OSWALDO_AWARENESS_TRANSLATIONS[String(threads.oswaldoAwareness)] ||
			'His awareness is unstable. Even if he names the load, make behavior lag unless earned.',
		DEX_TRIANGULATION_TRANSLATIONS[String(threads.dexTriangulation)] ||
			'Dex is playing both sides off-camera. Keep him socially useful and informationally dangerous.',
		EXHAUSTION_TRANSLATIONS[String(threads.exhaustionLevel)] ||
			'Her fatigue is underreported. Keep a visible cost on every ask.',
		boundaryCountLine
	];
}

function compressSceneForSummary(sceneText = ''): string {
	const oneLine = sceneText.replace(/\s+/g, ' ').trim();
	if (!oneLine) return '';
	const firstSentence = oneLine.split(/[.!?]/)[0] || oneLine;
	return firstSentence.slice(0, 160);
}

function containsAny(text: string, terms: string[]): boolean {
	return terms.some((term) => text.includes(term));
}

function detectBeatLabel(sceneText = '', viaChoiceText = ''): string | null {
	const combined = `${viaChoiceText} ${sceneText}`.toLowerCase();
	if (!combined.trim()) return null;

	if (containsAny(combined, ['rent', 'eighteen', '11 am', 'clock', 'sixty-five', '$65', '$18'])) {
		return 'rent clock pressure';
	}
	if (containsAny(combined, ['oswaldo', 'keep score', 'dramatic', 'not what happened', 'controlling'])) {
		return 'oswaldo deflection spiral';
	}
	if (containsAny(combined, ['trina', 'wrapper', 'snack cake', 'catfish', 'hotspot'])) {
		return 'trina entitlement drag';
	}
	if (containsAny(combined, ['dex', 'paranoid', 'bitching', 'sleeping together', 'two-faced'])) {
		return 'dex triangulation pass';
	}
	if (containsAny(combined, ['boundary', 'line in the sand', 'told him', 'no guests', 'no lending'])) {
		return 'boundary enforcement push';
	}
	if (containsAny(combined, ['leave', 'walk out', 'door', 'exit', 'pack'])) {
		return 'exit calculus';
	}
	return null;
}

function buildRecentBeats(
	sceneLog: Array<{ sceneText?: string; viaChoiceText?: string }> = [],
	lastChoiceText = ''
): string[] {
	const labels: string[] = [];
	const seen = new Set<string>();

	const pushLabel = (label: string | null) => {
		if (!label || seen.has(label)) return;
		seen.add(label);
		labels.push(label);
	};

	const recentEntries = sceneLog.slice(-6).reverse();
	for (const entry of recentEntries) {
		pushLabel(detectBeatLabel(entry.sceneText || '', entry.viaChoiceText || ''));
		if (labels.length >= 3) break;
	}

	if (labels.length < 3) {
		pushLabel(detectBeatLabel('', lastChoiceText));
	}

	return labels.slice(0, 3);
}

function estimateContextChars(context: unknown): number {
	try {
		return JSON.stringify(context).length;
	} catch {
		return 0;
	}
}

function trimRecentSceneProse(text: string): string {
	if (text.length <= MIN_RECENT_SCENE_PROSE_CHARS) return text;
	const nextLength = Math.max(MIN_RECENT_SCENE_PROSE_CHARS, text.length - RECENT_SCENE_PROSE_TRIM_STEP);
	const trimmed = text.slice(0, nextLength).trimEnd();
	return trimmed.endsWith('...') || trimmed.endsWith('…') ? trimmed : `${trimmed}…`;
}

function applyContextBudget(context: NarrativeContext, maxChars: number): NarrativeContext {
	const budgeted = {
		...context,
		recentSceneProse: [...context.recentSceneProse],
		olderSceneSummaries: [...context.olderSceneSummaries],
		lessonHistoryLines: [...context.lessonHistoryLines],
		boundaryNarrativeLines: [...context.boundaryNarrativeLines],
		threadNarrativeLines: [...context.threadNarrativeLines],
		recentBeats: [...context.recentBeats]
	};

	const dropped = {
		olderSummaries: 0,
		recentProse: 0
	};

	while (estimateContextChars(budgeted) > maxChars && budgeted.olderSceneSummaries.length > 0) {
		budgeted.olderSceneSummaries.shift();
		dropped.olderSummaries += 1;
	}

	// Preserve critical continuity sections while enforcing a true cap.
	while (estimateContextChars(budgeted) > maxChars) {
		let trimmed = false;
		for (let i = 0; i < budgeted.recentSceneProse.length; i += 1) {
			const prose = budgeted.recentSceneProse[i];
			if (prose.text.length > MIN_RECENT_SCENE_PROSE_CHARS) {
				budgeted.recentSceneProse[i] = {
					...prose,
					text: trimRecentSceneProse(prose.text)
				};
				dropped.recentProse += 1;
				trimmed = true;
				break;
			}
		}
		if (!trimmed) break;
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
	maybeAddTransition('dexTriangulation', previousThreads.dexTriangulation, currentThreads.dexTriangulation);

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
		recentBeats: buildRecentBeats(sceneLog, lastChoiceText),
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
