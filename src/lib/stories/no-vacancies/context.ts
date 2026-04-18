import type { StoryThreads, TransitionBridge, TransitionBridgeMoment } from '$lib/contracts';

type ThreadKey =
	| 'oswaldoConflict'
	| 'trinaTension'
	| 'moneyResolved'
	| 'carMentioned'
	| 'sydneyRealization'
	| 'boundariesSet'
	| 'oswaldoAwareness'
	| 'exhaustionLevel'
	| 'dexTriangulation';

export const OSWALDO_CONFLICT_TRANSLATIONS: Record<string, string> = Object.freeze({
	'-2': "He's weirdly helpful today, like he wants credit for doing the bare minimum without being asked.",
	'-1': "He's not fighting, but every answer has an attitude tucked inside it.",
	'0': "Oswaldo hasn't been challenged. The resentment is still underground.",
	'1': 'Every question turns into a dodge. He acts accused before anyone accuses him.',
	'2': "Things with Oswaldo are actively hostile. He's in full deflection mode."
});

export const TRINA_TENSION_TRANSLATIONS: Record<string, string> = Object.freeze({
	'0': "Trina's just furniture. Annoying furniture, but furniture.",
	'1': "The snack cake wrappers are piling up. The entitlement is starting to show. She wakes up every hour on the hour to eat a snack cake and throws the wrapper on the floor.",
	'2': "Trina's taking and taking and doesn't even see it as taking. She catfishes a guy on Facebook Dating for forty dollars, buys smokes, orders DoorDash for herself, and calls that survival.",
	'3': "Something has to happen with Trina. The math doesn't work anymore. Sydney fronts Trina the referral money, Trina hits six hundred at the casino, vanishes without a thank-you, then comes back broke two days later."
});

export const MONEY_TRANSLATIONS: Record<string, string> = Object.freeze({
	true: 'The room is paid. One less fire to put out.',
	false: 'The eighteen-dollar gap is still open, and the clock keeps moving like it gets paid to panic her.'
});

export const CAR_TRANSLATIONS: Record<string, string> = Object.freeze({
	true: 'Once the car incident is named, the air changes. Nobody can pretend this is random bad luck.',
	false: 'Nobody says the car thing out loud, but it sits in the room anyway.'
});

export const SYDNEY_REALIZATION_TRANSLATIONS: Record<string, string> = Object.freeze({
	'0': "She thinks Oswaldo can't help. He's just not built for this.",
	'1': "She's starting to see it's not 'can't.' It's 'won't.'",
	'2': "He helps other people. He rides his bike five miles for other people. So why not her?",
	'3': "He helps everyone except her. On purpose. That's not neglect. That's a choice."
});

export const OSWALDO_AWARENESS_TRANSLATIONS: Record<string, string> = Object.freeze({
	'0': 'He treats rent money like weather. It happens around him, not because of him.',
	'1': "He gets flashes that she's carrying this place, then slides back into convenience.",
	'2': "He can name what she does now, but he still acts like naming it is the same as helping.",
	'3': "He finally sees her labor as labor, not mood, and he changes behavior without being managed."
});

export const EXHAUSTION_TRANSLATIONS: Record<string, string> = Object.freeze({
	'0': "She's awake, alert, and has not spent herself yet. The day is still borrowing at zero percent.",
	'1': "She is steady enough to run the board, but only because she's forcing it.",
	'2': 'Her fuse is shorter and her patience now costs interest.',
	'3': "Small disrespect lands big. She can still perform, but the seams show when nobody's trying to see them.",
	'4': "Sydney is running on fumes. Every interaction costs more than it should.",
	'5': "Her body clocks out before her responsibilities do. Survival mode takes over the whole room."
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

function normalizeBoundary(boundary: string): string {
	return typeof boundary === 'string' ? boundary.trim().toLowerCase() : '';
}

function boundaryCountLine(boundaries: string[] = []): string {
	const boundariesCount = Array.isArray(boundaries) ? boundaries.length : 0;
	if (boundariesCount === 1) {
		return "One line in the sand changes the room's weather, even if nobody likes it.";
	}
	if (boundariesCount > 1) {
		return 'With rules in place, chaos has to knock before it comes in.';
	}
	return "Anything goes means Sydney pays for everything, including everybody's bad habits.";
}

function translateThreadKey(key: ThreadKey, threads: StoryThreads | null): string {
	if (!threads) {
		return 'Continuity memory blanked this turn. Keep moves small, causal, and costly.';
	}

	switch (key) {
		case 'oswaldoConflict':
			return (
				OSWALDO_CONFLICT_TRANSLATIONS[String(threads.oswaldoConflict)] ??
				'Oswaldo keeps switching masks mid-sentence. Expect charm, dodge, then blame.'
			);
		case 'trinaTension':
			return (
				TRINA_TENSION_TRANSLATIONS[String(threads.trinaTension)] ??
				'Trina is quiet on-screen, not harmless. Keep her as a steady entitlement tax.'
			);
		case 'moneyResolved':
			return MONEY_TRANSLATIONS[String(Boolean(threads.moneyResolved))];
		case 'carMentioned':
			return CAR_TRANSLATIONS[String(Boolean(threads.carMentioned))];
		case 'sydneyRealization':
			return (
				SYDNEY_REALIZATION_TRANSLATIONS[String(threads.sydneyRealization)] ??
				'She still calls it chaos, not pattern. Keep the mismatch visible until she says it plain.'
			);
		case 'oswaldoAwareness':
			return (
				OSWALDO_AWARENESS_TRANSLATIONS[String(threads.oswaldoAwareness)] ??
				'He can clock the load and still sidestep it. Let words outrun behavior unless earned.'
			);
		case 'exhaustionLevel':
			return (
				EXHAUSTION_TRANSLATIONS[String(threads.exhaustionLevel)] ??
				'Her tank reads higher than it is. Charge interest on every ask.'
			);
		case 'dexTriangulation':
			return (
				DEX_TRIANGULATION_TRANSLATIONS[String(threads.dexTriangulation)] ??
				'Dex is playing both sides off-camera. Keep him socially useful and informationally dangerous.'
			);
		case 'boundariesSet':
			return boundaryCountLine(threads.boundariesSet);
		default:
			return 'Continuity memory blanked this turn. Keep moves small, causal, and costly.';
	}
}

function bridgeWorthyChange(
	key: ThreadKey,
	previousThreads: StoryThreads,
	currentThreads: StoryThreads
): boolean {
	if (key === 'boundariesSet') {
		return previousThreads.boundariesSet.length !== currentThreads.boundariesSet.length;
	}

	const previousValue = previousThreads[key];
	const currentValue = currentThreads[key];

	if (typeof previousValue === 'number' && typeof currentValue === 'number') {
		return Math.abs(previousValue - currentValue) > 1;
	}
	if (typeof previousValue === 'boolean' && typeof currentValue === 'boolean') {
		return previousValue !== currentValue;
	}
	return previousValue !== currentValue;
}

function createBridgeMoment(
	key: ThreadKey,
	previousThreads: StoryThreads,
	currentThreads: StoryThreads
): TransitionBridgeMoment {
	const before = translateThreadKey(key, previousThreads);
	const after = translateThreadKey(key, currentThreads);
	return {
		key,
		before,
		after,
		// Keep the bridge instruction authored-by-context, but generate it from the exact before/after voice lines.
		bridge: `STATE SHIFT: ${key} moved from "${before}" to "${after}". Integrate this in one sentence. Let behavior show it. Do not announce it.`
	};
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
		return ['Nothing has landed clean yet. Keep discovery active and make each choice draw blood.'];
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
		return ['Continuity memory blanked this turn. Keep moves small, causal, and costly.'];
	}

	return [
		translateThreadKey('oswaldoConflict', threads),
		translateThreadKey('trinaTension', threads),
		translateThreadKey('moneyResolved', threads),
		translateThreadKey('carMentioned', threads),
		translateThreadKey('sydneyRealization', threads),
		translateThreadKey('oswaldoAwareness', threads),
		translateThreadKey('dexTriangulation', threads),
		translateThreadKey('exhaustionLevel', threads),
		translateThreadKey('boundariesSet', threads)
	];
}

export function detectThreadTransitions(
	previousThreads: StoryThreads | null | undefined,
	currentThreads: StoryThreads | null | undefined
): TransitionBridge {
	if (!previousThreads || !currentThreads) {
		return { keys: [], moments: [] };
	}

	const orderedKeys: ThreadKey[] = [
		'oswaldoConflict',
		'trinaTension',
		'moneyResolved',
		'carMentioned',
		'sydneyRealization',
		'oswaldoAwareness',
		'dexTriangulation',
		'exhaustionLevel',
		'boundariesSet'
	];

	const keys: string[] = [];
	const moments: TransitionBridgeMoment[] = [];

	for (const key of orderedKeys) {
		if (!bridgeWorthyChange(key, previousThreads, currentThreads)) continue;
		keys.push(key);
		moments.push(createBridgeMoment(key, previousThreads, currentThreads));
	}

	return { keys, moments };
}
