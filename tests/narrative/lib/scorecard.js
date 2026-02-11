/**
 * Tier 2 narrative quality scorecard.
 *
 * Defines the rubric for Claude to evaluate scenes against.
 * Parses Claude's structured response into the score format.
 *
 * This file contains NO heuristics. All scoring is done by Claude
 * via the claude-code-action in CI.
 *
 * 15 criteria total: 8 conventional (craft) + 7 unconventional (NoVacancies-specific)
 */

// ---------------------------------------------------------------------------
// Rubric definition
// ---------------------------------------------------------------------------

export const RUBRIC = {
	conventional: {
		grammar: {
			name: 'Grammar',
			weight: 0.10,
			question: 'Is the text well-formed English?'
		},
		pacing: {
			name: 'Pacing',
			weight: 0.10,
			question: 'Is scene length 150-300 words, not rushed or padded?'
		},
		characterVoice: {
			name: 'Character Voice',
			weight: 0.15,
			question: 'Does Sydney sound like Sydney (dry, exhausted, competent, resentful)?'
		},
		emotionalResonance: {
			name: 'Emotional Resonance',
			weight: 0.15,
			question: 'Does the scene make you feel what the mood tag says you should feel?'
		},
		dialogue: {
			name: 'Dialogue',
			weight: 0.10,
			question: 'Does dialogue reveal character or advance plot (not just fill space)?'
		},
		plotCoherence: {
			name: 'Plot Coherence',
			weight: 0.20,
			question: 'Does scene logically follow from what came before?'
		},
		descriptiveDetail: {
			name: 'Descriptive Detail',
			weight: 0.10,
			question: 'Is atmosphere built with sensory detail, not purple prose?'
		},
		choiceQuality: {
			name: 'Choice Quality',
			weight: 0.10,
			question: 'Are the offered choices distinct and forward-moving?'
		}
	},
	unconventional: {
		emergence: {
			name: 'Emergence',
			weight: 0.15,
			question: 'Does the scene feel like it responded to the player\'s choice, or would it exist regardless?'
		},
		loadBearingDynamics: {
			name: 'Load-Bearing Dynamics',
			weight: 0.20,
			question: 'Does the scene show Sydney doing invisible labor that others depend on?'
		},
		agencyAuthenticity: {
			name: 'Agency Authenticity',
			weight: 0.15,
			question: 'Are offered choices genuinely different paths, or the same outcome reworded?'
		},
		narrativeDebt: {
			name: 'Narrative Debt',
			weight: 0.15,
			question: 'Are earlier story promises (relationships, money, boundaries) being paid off?'
		},
		subtextDensity: {
			name: 'Subtext Density',
			weight: 0.15,
			question: 'How much character work happens between the lines vs stated explicitly?'
		},
		constraintSatisfaction: {
			name: 'Constraint Satisfaction',
			weight: 0.10,
			question: 'Given 150-300 word limit, how much story is packed in?'
		},
		complexityGradient: {
			name: 'Complexity Gradient',
			weight: 0.10,
			question: 'Does moral/emotional complexity increase as the game progresses?'
		}
	}
};

export const CONVENTIONAL_KEYS = Object.keys(RUBRIC.conventional);
export const UNCONVENTIONAL_KEYS = Object.keys(RUBRIC.unconventional);
export const ALL_KEYS = [...CONVENTIONAL_KEYS, ...UNCONVENTIONAL_KEYS];

// ---------------------------------------------------------------------------
// Response parser
// ---------------------------------------------------------------------------

/**
 * Parse Claude's JSON response into the structured score format.
 * Handles markdown fences, extra text, etc.
 */
export function parseClaudeScores(responseText) {
	const trimmed = responseText.trim();
	let jsonStr = trimmed;

	// Strip markdown fences if present
	const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
	if (fencedMatch?.[1]) jsonStr = fencedMatch[1].trim();

	// Extract JSON object
	const first = jsonStr.indexOf('{');
	const last = jsonStr.lastIndexOf('}');
	if (first !== -1 && last > first) {
		jsonStr = jsonStr.slice(first, last + 1);
	}

	const raw = JSON.parse(jsonStr);
	const clamp = (v) => Math.max(1, Math.min(5, Math.round(Number(v) || 3)));

	const conventional = {};
	for (const k of CONVENTIONAL_KEYS) {
		conventional[k] = clamp(raw[k]);
	}

	const unconventional = {};
	for (const k of UNCONVENTIONAL_KEYS) {
		unconventional[k] = clamp(raw[k]);
	}

	const weightedAvg = (obj, rubricSection) => {
		let totalWeight = 0;
		let weightedSum = 0;
		for (const [k, v] of Object.entries(obj)) {
			const w = rubricSection[k]?.weight || (1 / Object.keys(obj).length);
			totalWeight += w;
			weightedSum += v * w;
		}
		return totalWeight > 0 ? weightedSum / totalWeight : 0;
	};

	const conventionalAvg = Math.round(weightedAvg(conventional, RUBRIC.conventional) * 100) / 100;
	const unconventionalAvg = Math.round(weightedAvg(unconventional, RUBRIC.unconventional) * 100) / 100;

	// Overall weighted average (conventional weights sum to 1.0, unconventional weights sum to 1.0)
	// Equal weight to both categories
	const overallAvg = Math.round(((conventionalAvg + unconventionalAvg) / 2) * 100) / 100;

	return {
		conventional,
		unconventional,
		summary: {
			conventionalAvg,
			unconventionalAvg,
			overallAvg,
			totalCriteria: ALL_KEYS.length,
			maxPossible: ALL_KEYS.length * 5
		}
	};
}
