import { json, type RequestHandler } from '@sveltejs/kit';
import { callBuilderModel } from '$lib/server/ai/builder/modelClient';
import { extractJsonObject } from '$lib/server/ai/builder/normalizers';
import { emitAiServerTelemetry } from '$lib/server/ai/telemetry';
import type { BuilderStoryDraft } from '$lib/stories/types';

export interface VoiceLineEvaluation {
	moment: string;
	text: string;
	flags: string[];
	isClean: boolean;
}

export interface VoiceEvaluationResult {
	lines: VoiceLineEvaluation[];
	overallVoiceScore: number;
	summary: string;
}

export interface VoiceEvaluationResponse {
	evaluation: VoiceEvaluationResult;
	source: 'ai' | 'fallback';
}

const SYDNEY_MOMENTS: readonly string[] = [
	'Receiving a low rating from a customer.',
	'Being asked to pick up more shifts on top of an already-long day.',
	'Explaining her situation to a stranger who has just asked what she does for work.',
	'Deciding in the moment whether to accept another booking when she is already past her limit.',
	'Noticing, in passing, that she has not slept in a long time.'
];

function clampScore(value: unknown): number {
	if (typeof value !== 'number' || !Number.isFinite(value)) return 1;
	return Math.max(1, Math.min(10, Math.round(value)));
}

function normalizeFlags(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	const out: string[] = [];
	for (const raw of value) {
		if (typeof raw !== 'string') continue;
		const trimmed = raw.trim();
		if (!trimmed) continue;
		out.push(trimmed);
	}
	return out;
}

function normalizeLines(value: unknown): VoiceLineEvaluation[] {
	if (!Array.isArray(value)) return [];
	const out: VoiceLineEvaluation[] = [];
	for (let index = 0; index < value.length; index++) {
		const raw = value[index];
		if (!raw || typeof raw !== 'object') continue;
		const typed = raw as Partial<VoiceLineEvaluation>;
		const moment =
			typeof typed.moment === 'string' && typed.moment.trim()
				? typed.moment.trim()
				: SYDNEY_MOMENTS[index] ?? `Moment ${index + 1}`;
		const text =
			typeof typed.text === 'string' && typed.text.trim()
				? typed.text.trim()
				: '(no line returned)';
		const flags = normalizeFlags(typed.flags);
		const isClean = typeof typed.isClean === 'boolean' ? typed.isClean : flags.length === 0;
		out.push({ moment, text, flags, isClean });
	}
	return out;
}

function normalizeEvaluation(candidate: unknown): VoiceEvaluationResult {
	if (!candidate || typeof candidate !== 'object') {
		return {
			lines: [],
			overallVoiceScore: 1,
			summary: 'Evaluator returned an invalid payload.'
		};
	}
	const typed = candidate as Partial<VoiceEvaluationResult>;
	const lines = normalizeLines(typed.lines);
	const summary =
		typeof typed.summary === 'string' && typed.summary.trim()
			? typed.summary.trim()
			: lines.length === 0
				? 'No sample lines were returned.'
				: 'No summary returned.';
	return {
		lines,
		overallVoiceScore: clampScore(typed.overallVoiceScore),
		summary
	};
}

function buildVoicePrompts(draft: BuilderStoryDraft): {
	systemPrompt: string;
	userPrompt: string;
} {
	const momentsList = SYDNEY_MOMENTS.map((moment, index) => `${index + 1}. ${moment}`).join('\n');
	const voiceLines = (draft.voiceCeilingLines ?? [])
		.map((line, index) => `${index + 1}. ${line}`)
		.join('\n');

	const systemPrompt = `You are a voice consistency evaluator for the story protagonist "Sydney" — a gig worker who has become infrastructure. She is so embedded in the platforms that she cannot see it clearly.

Sydney's voice ceiling:
- Tired but still hustling.
- Practical, not philosophical.
- She rationalises her situation; she does NOT have insight into it.
- She would NOT say anything that signals she understands she is being exploited.
- She would NOT use corporate/platform language ironically — when she uses it, she means it sincerely.
- She would NOT be articulate about her own condition, self-aware about systems, or eloquent about labour.
- She would NOT be passive or resigned in a literary way; she is busy.

You will do two things in one response:

Part 1 — Generate: Write exactly 5 sample lines Sydney might say, one for each of the moments listed in the user prompt, in order. Keep each line short (one or two sentences), in-character, in Sydney's actual mouth. Use the draft's systemPrompt and voiceCeilingLines as the binding voice constraint.

Part 2 — Evaluate: For each generated line, decide whether it violates the ceiling or feels off-character. Flag specific failure modes you observe. Use flags drawn from this vocabulary when they fit, and add other specific notes when they don't:
- "too self-aware" — she understands her own exploitation
- "too articulate" — sentence-level eloquence she would not have
- "too philosophical" — abstracts instead of describing the next concrete thing
- "too passive" — resigned/literary instead of busy/hustling
- "ironic corporate-speak" — uses platform language with distance instead of sincerity
- "out of register" — wrong vocabulary, wrong rhythm, wrong concreteness
- "explains the theme" — names the lesson the story is meant to surface

Mark a line isClean: true ONLY if it sounds like Sydney across every dimension.

Then score the draft's voice constraints (its systemPrompt + voiceCeilingLines) from 1–10 on how reliably they would produce a Sydney that sounds right across random generations:
- 10: Every generated line lands clean; the constraints fully bind voice.
- 7–9: Most lines clean; one or two soft flags.
- 4–6: Mixed; constraints permit too much drift.
- 1–3: Constraints fail; Sydney comes out wrong (too articulate, too self-aware, off register).

Return valid JSON only, with this exact shape:
{
  "lines": [
    { "moment": string, "text": string, "flags": string[], "isClean": boolean }
  ],
  "overallVoiceScore": number,
  "summary": string
}

No prose outside the JSON. No markdown fencing. Exactly 5 entries in lines, in the same order as the moments.`;

	const userPrompt = `Draft voice constraints to evaluate.

System prompt:
${draft.systemPrompt?.trim() || '(empty)'}

Voice ceiling lines:
${voiceLines || '(none)'}

Aesthetic statement:
${draft.aestheticStatement?.trim() || '(empty)'}

Moments (generate one Sydney line per moment, in order):
${momentsList}

Return JSON only.`;

	return { systemPrompt, userPrompt };
}

function fallbackEvaluation(draft: BuilderStoryDraft): VoiceEvaluationResult {
	const constraintBlob = `${draft.systemPrompt ?? ''} ${(draft.voiceCeilingLines ?? []).join(' ')}`
		.toLowerCase()
		.trim();
	const hasConstraints = constraintBlob.length > 0;
	const ceilingCount = (draft.voiceCeilingLines ?? []).filter(
		(line) => typeof line === 'string' && line.trim().length > 0
	).length;

	const lines: VoiceLineEvaluation[] = SYDNEY_MOMENTS.map((moment, index) => {
		const flags: string[] = [];
		if (!hasConstraints) {
			flags.push('No systemPrompt or voiceCeilingLines provided — Sydney cannot be bound.');
		}
		if (ceilingCount < 2) {
			flags.push('Voice ceiling has fewer than two lines; voice will drift.');
		}
		return {
			moment,
			text: `(fallback) Sample line ${index + 1} could not be generated; Grok is unavailable.`,
			flags,
			isClean: false
		};
	});

	const overallVoiceScore = Math.max(
		1,
		Math.min(10, hasConstraints ? Math.max(1, ceilingCount * 2) : 1)
	);
	return {
		lines,
		overallVoiceScore,
		summary:
			'Heuristic fallback: Grok was unavailable, so no real sample lines were generated. Re-run when AI is configured to see whether the constraints actually produce a Sydney that sounds right.'
	};
}

export const POST: RequestHandler = async ({ request, locals, url }) => {
	const payload = (await request.json().catch(() => ({}))) as {
		draft?: BuilderStoryDraft;
	};
	const draft = payload.draft && typeof payload.draft === 'object' ? payload.draft : null;

	if (!draft) {
		return json(
			{ error: 'Missing builder draft in request body.', code: 'invalid_request' },
			{ status: 400 }
		);
	}

	const { systemPrompt, userPrompt } = buildVoicePrompts(draft);

	let evaluation: VoiceEvaluationResult;
	let source: 'ai' | 'fallback';
	try {
		const raw = await callBuilderModel(systemPrompt, userPrompt);
		const parsed = JSON.parse(extractJsonObject(raw));
		evaluation = normalizeEvaluation(parsed);
		if (evaluation.lines.length === 0) {
			throw new Error('Evaluator returned no sample lines.');
		}
		source = 'ai';
	} catch (error) {
		console.warn(
			`[evaluate-voice] grok unavailable, using fallback: ${
				error instanceof Error ? error.message : 'unknown'
			}`
		);
		evaluation = fallbackEvaluation(draft);
		source = 'fallback';
	}

	const flaggedCount = evaluation.lines.filter((line) => !line.isClean).length;

	emitAiServerTelemetry('builder_audit', {
		action: 'evaluate_voice',
		userId: locals.sessionUser?.userId ?? 'unknown',
		source,
		score: evaluation.overallVoiceScore,
		lineCount: evaluation.lines.length,
		flaggedCount,
		route: url.pathname
	});

	const response: VoiceEvaluationResponse = { evaluation, source };
	return json(response);
};
