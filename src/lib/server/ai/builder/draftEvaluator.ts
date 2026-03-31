import { noVacanciesCartridge } from '$lib/stories/no-vacancies';
import type {
	BuilderDraftDimension,
	BuilderDraftEvaluation,
	BuilderDraftFinding,
	BuilderStoryDraft
} from '$lib/stories/types';
import { callBuilderModel } from './modelClient';
import { extractJsonObject } from './normalizers';

const DRAFT_QA_THRESHOLDS = {
	minOverallScore: 8,
	minDimensionScore: 7,
	maxBlockers: 0
} as const;

const ACTION_WORD_REGEX =
	/(walk|eat|drag|lean|drop|count|watch|text|ride|ask|lock|leave|stand|spill|open|close|push|pull|grab|shut|stare|wipe|stack|turn|tap|pace)/i;
const CONCRETE_WORD_REGEX =
	/\b\d+\b|phone|door|table|floor|rent|cup|window|shirt|wrapper|bike|money|room|hallway|car|desk|counter|keys|receipt|bag|clock|bed|wall|stair/i;
const SUMMARY_WORD_REGEX =
	/(realized|felt|learned|understood|safe space|process this|the lesson is|what this teaches|healing|closure|journey)/i;

function clampScore(value: number): number {
	return Math.max(1, Math.min(10, Math.round(value)));
}

function buildReadiness(
	dimensionScores: Record<BuilderDraftDimension, number>,
	findings: BuilderDraftFinding[]
): Pick<BuilderDraftEvaluation, 'overallScore' | 'readiness' | 'publishable' | 'thresholds'> {
	const overallScore = clampScore(
		Object.values(dimensionScores).reduce((sum, score) => sum + score, 0) / Object.keys(dimensionScores).length
	);
	const blockerCount = findings.filter((finding) => finding.severity === 'blocker').length;
	const failedDimension = Object.values(dimensionScores).some(
		(score) => score < DRAFT_QA_THRESHOLDS.minDimensionScore
	);
	const publishable =
		overallScore >= DRAFT_QA_THRESHOLDS.minOverallScore &&
		!failedDimension &&
		blockerCount <= DRAFT_QA_THRESHOLDS.maxBlockers;

	return {
		overallScore,
		readiness: blockerCount > 0 ? 'blocked' : publishable ? 'publishable' : 'needs-revision',
		publishable,
		thresholds: DRAFT_QA_THRESHOLDS
	};
}

type DraftTextField = { key: string; text: string; dimension: BuilderDraftDimension };

function collectDraftTextFields(draft: BuilderStoryDraft): DraftTextField[] {
	const fields: DraftTextField[] = [
		{ key: 'title', text: draft.title, dimension: 'voiceConsistency' },
		{ key: 'premise', text: draft.premise, dimension: 'promptCoherence' },
		{ key: 'setting', text: draft.setting, dimension: 'behavioralSpecificity' },
		{ key: 'aestheticStatement', text: draft.aestheticStatement, dimension: 'voiceConsistency' },
		{ key: 'openingPrompt', text: draft.openingPrompt, dimension: 'promptCoherence' },
		{ key: 'systemPrompt', text: draft.systemPrompt, dimension: 'promptCoherence' }
	];

	draft.voiceCeilingLines.forEach((line, index) => {
		fields.push({ key: `voice:${index}`, text: line, dimension: 'voiceConsistency' });
	});
	draft.characters.forEach((character, index) => {
		fields.push({
			key: `character:${index}`,
			text: character.description,
			dimension: 'behavioralSpecificity'
		});
	});
	draft.mechanics.forEach((mechanic, mechanicIndex) => {
		fields.push({
			key: `mechanic:${mechanicIndex}:label`,
			text: mechanic.label,
			dimension: 'mechanicClarity'
		});
		mechanic.voiceMap.forEach((entry, lineIndex) => {
			fields.push({
				key: `mechanic:${mechanicIndex}:${lineIndex}`,
				text: entry.line,
				dimension: 'mechanicClarity'
			});
		});
	});

	return fields;
}

export function fallbackEvaluateDraft(draft: BuilderStoryDraft): BuilderDraftEvaluation {
	const findings: BuilderDraftFinding[] = [];
	const dimensionScores: Record<BuilderDraftDimension, number> = {
		voiceConsistency: 10,
		behavioralSpecificity: 10,
		mechanicClarity: 10,
		promptCoherence: 10,
		repetitionRisk: 10
	};

	if (draft.voiceCeilingLines.length < 2) {
		dimensionScores.voiceConsistency -= 3;
		findings.push({
			severity: 'warning',
			dimension: 'voiceConsistency',
			fieldKey: 'voice:0',
			message: 'Add at least two voice ceiling lines so tone checks are meaningful.'
		});
	}

	draft.voiceCeilingLines.forEach((line, index) => {
		const words = line.trim().split(/\s+/).filter(Boolean).length;
		if (words > 20) {
			dimensionScores.voiceConsistency -= 1;
			findings.push({
				severity: 'warning',
				dimension: 'voiceConsistency',
				fieldKey: `voice:${index}`,
				message: 'Voice ceiling line is long; trim to a sharper behavioral beat.'
			});
		}
	});

	const behaviorFields = collectDraftTextFields(draft).filter(
		(field) => field.dimension === 'behavioralSpecificity' || field.dimension === 'voiceConsistency'
	);
	for (const field of behaviorFields) {
		const trimmed = field.text.trim();
		if (!trimmed) continue;
		if (!ACTION_WORD_REGEX.test(trimmed) || !CONCRETE_WORD_REGEX.test(trimmed)) {
			dimensionScores.behavioralSpecificity -= 1;
			findings.push({
				severity: 'warning',
				dimension: 'behavioralSpecificity',
				fieldKey: field.key,
				message: 'Needs clearer behavior and concrete objects/actions.'
			});
		}
		if (SUMMARY_WORD_REGEX.test(trimmed)) {
			dimensionScores.behavioralSpecificity -= 1;
			findings.push({
				severity: 'warning',
				dimension: 'behavioralSpecificity',
				fieldKey: field.key,
				message: 'Reads like summary language; stage behavior instead of conclusions.'
			});
		}
	}

	if (draft.mechanics.length === 0) {
		dimensionScores.mechanicClarity = 1;
		findings.push({
			severity: 'blocker',
			dimension: 'mechanicClarity',
			fieldKey: 'mechanic:0:label',
			message: 'Add at least one mechanic before publishing.'
		});
	}

	draft.mechanics.forEach((mechanic, mechanicIndex) => {
		if (mechanic.voiceMap.length < 2) {
			dimensionScores.mechanicClarity -= 3;
			findings.push({
				severity: 'blocker',
				dimension: 'mechanicClarity',
				fieldKey: `mechanic:${mechanicIndex}:0`,
				message: 'Each mechanic needs at least two voice map lines.'
			});
		}
		if (!mechanic.key.trim() || !mechanic.label.trim()) {
			dimensionScores.mechanicClarity -= 2;
			findings.push({
				severity: 'warning',
				dimension: 'mechanicClarity',
				fieldKey: `mechanic:${mechanicIndex}:label`,
				message: 'Mechanic key and label should both be explicit.'
			});
		}
	});

	const promptText = `${draft.openingPrompt}\n${draft.systemPrompt}`.toLowerCase();
	if (!promptText.includes('interactive')) {
		dimensionScores.promptCoherence -= 2;
		findings.push({
			severity: 'info',
			dimension: 'promptCoherence',
			fieldKey: 'systemPrompt',
			message: 'Prompt likely needs clearer interactive framing.'
		});
	}
	const premiseAnchor = draft.premise.trim().split(/\s+/)[0]?.toLowerCase();
	if (premiseAnchor && !promptText.includes(premiseAnchor)) {
		dimensionScores.promptCoherence -= 2;
		findings.push({
			severity: 'warning',
			dimension: 'promptCoherence',
			fieldKey: 'openingPrompt',
			message: 'Opening/system prompts should visibly reflect premise language.'
		});
	}

	const repeated = new Map<string, string[]>();
	for (const field of collectDraftTextFields(draft)) {
		const normalized = field.text.trim().toLowerCase().replace(/\s+/g, ' ');
		if (!normalized || normalized.length < 12) continue;
		const existing = repeated.get(normalized) ?? [];
		existing.push(field.key);
		repeated.set(normalized, existing);
	}
	for (const [, keys] of repeated) {
		if (keys.length > 1) {
			dimensionScores.repetitionRisk -= 3;
			findings.push({
				severity: 'warning',
				dimension: 'repetitionRisk',
				fieldKey: keys[0],
				message: 'Repeated phrasing detected across multiple fields; vary wording.'
			});
		}
	}

	if (findings.length === 0) {
		findings.push({
			severity: 'info',
			dimension: 'voiceConsistency',
			fieldKey: 'aestheticStatement',
			message: 'No major issues detected in fallback rubric.'
		});
	}

	dimensionScores.voiceConsistency = clampScore(dimensionScores.voiceConsistency);
	dimensionScores.behavioralSpecificity = clampScore(dimensionScores.behavioralSpecificity);
	dimensionScores.mechanicClarity = clampScore(dimensionScores.mechanicClarity);
	dimensionScores.promptCoherence = clampScore(dimensionScores.promptCoherence);
	dimensionScores.repetitionRisk = clampScore(dimensionScores.repetitionRisk);

	return {
		dimensionScores,
		findings,
		...buildReadiness(dimensionScores, findings)
	};
}

function normalizeDraftEvaluationPayload(candidate: unknown): BuilderDraftEvaluation | null {
	if (!candidate || typeof candidate !== 'object') return null;
	const typed = candidate as Partial<BuilderDraftEvaluation>;
	if (!typed.dimensionScores || typeof typed.dimensionScores !== 'object') return null;
	const dimensions = typed.dimensionScores as Partial<Record<BuilderDraftDimension, number>>;
	const dimensionScores: Record<BuilderDraftDimension, number> = {
		voiceConsistency: clampScore(dimensions.voiceConsistency ?? 1),
		behavioralSpecificity: clampScore(dimensions.behavioralSpecificity ?? 1),
		mechanicClarity: clampScore(dimensions.mechanicClarity ?? 1),
		promptCoherence: clampScore(dimensions.promptCoherence ?? 1),
		repetitionRisk: clampScore(dimensions.repetitionRisk ?? 1)
	};
	const findings = Array.isArray(typed.findings)
		? typed.findings
				.filter((finding): finding is BuilderDraftFinding => {
					return Boolean(
						finding &&
							(finding.severity === 'blocker' ||
								finding.severity === 'warning' ||
								finding.severity === 'info') &&
							typeof finding.dimension === 'string' &&
							typeof finding.fieldKey === 'string' &&
							typeof finding.message === 'string'
					);
				})
				.map((finding) => ({
					severity: finding.severity,
					dimension:
						finding.dimension in dimensionScores
							? (finding.dimension as BuilderDraftDimension)
							: ('voiceConsistency' as BuilderDraftDimension),
					fieldKey: finding.fieldKey,
					message: finding.message
				}))
		: [];

	return {
		dimensionScores,
		findings,
		...buildReadiness(dimensionScores, findings)
	};
}

export async function evaluateBuilderDraft(
	draft: BuilderStoryDraft
): Promise<{ evaluation: BuilderDraftEvaluation; source: 'ai' | 'fallback' }> {
	const systemPrompt = `You are a draft QA evaluator for interactive narrative authoring.
Score this full draft (not a single field) across these dimensions from 1-10:
- voiceConsistency
- behavioralSpecificity
- mechanicClarity
- promptCoherence
- repetitionRisk

Return JSON only with shape:
{
  "dimensionScores": {
    "voiceConsistency": number,
    "behavioralSpecificity": number,
    "mechanicClarity": number,
    "promptCoherence": number,
    "repetitionRisk": number
  },
  "findings": [
    {
      "severity": "blocker" | "warning" | "info",
      "dimension": "voiceConsistency" | "behavioralSpecificity" | "mechanicClarity" | "promptCoherence" | "repetitionRisk",
      "fieldKey": string,
      "message": string
    }
  ]
}

Rules:
- Give blockers only for publish-stopping issues.
- Use fieldKey values that map to builder fields (aestheticStatement, voice:<index>, character:<index>, mechanic:<mechanicIndex>:<lineIndex>, openingPrompt, systemPrompt, setting, title, premise).
- Keep findings concrete and actionable.
- Ground standards in this voice guidance:
${noVacanciesCartridge.voice.aestheticStatement}
${noVacanciesCartridge.voice.voiceCeilingLines.map((line) => `- ${line}`).join('\n')}`;

	const userPrompt = `Evaluate this draft JSON:\n${JSON.stringify(draft, null, 2)}`;

	try {
		const raw = await callBuilderModel(systemPrompt, userPrompt);
		const parsed = normalizeDraftEvaluationPayload(JSON.parse(extractJsonObject(raw)));
		if (!parsed) throw new Error('Invalid draft evaluation payload');
		return { evaluation: parsed, source: 'ai' };
	} catch {
		return { evaluation: fallbackEvaluateDraft(draft), source: 'fallback' };
	}
}
