import { json, type RequestHandler } from '@sveltejs/kit';
import { callBuilderModel } from '$lib/server/ai/builder/modelClient';
import { extractJsonObject } from '$lib/server/ai/builder/normalizers';
import { getLessonById, type Lesson } from '$lib/narrative/lessonsCatalog';
import { emitAiServerTelemetry } from '$lib/server/ai/telemetry';
import {
	assertDraftWithinLimits,
	delimitedField,
	MAX_PREMISE_LENGTH,
	MAX_SYSTEM_PROMPT_LENGTH,
	MAX_VOICE_CEILING_LINE_LENGTH,
	PayloadLimitError,
	PROMPT_INJECTION_NOTE
} from '$lib/server/ai/builder/payloadGuards';
import { isBuilderStoryDraft, type BuilderStoryDraft } from '$lib/stories/types';

export interface AlignmentGap {
	field: string;
	issue: string;
	suggestion: string;
}

export interface AlignmentResult {
	score: number;
	summary: string;
	gaps: AlignmentGap[];
}

export interface AlignmentResponse {
	alignment: AlignmentResult;
	lesson: { id: number; title: string };
	source: 'ai' | 'fallback';
}

const KNOWN_FIELDS = new Set([
	'title',
	'premise',
	'setting',
	'aestheticStatement',
	'voiceCeilingLines',
	'characters',
	'mechanics',
	'openingPrompt',
	'systemPrompt'
]);

function coerceLessonId(raw: unknown): number | null {
	if (typeof raw === 'number' && Number.isFinite(raw)) return Math.trunc(raw);
	if (typeof raw === 'string' && raw.trim()) {
		const parsed = Number.parseInt(raw.trim(), 10);
		if (Number.isFinite(parsed)) return parsed;
	}
	return null;
}

function clampScore(value: unknown): number {
	if (typeof value !== 'number' || !Number.isFinite(value)) return 1;
	return Math.max(1, Math.min(10, Math.round(value)));
}

function normalizeGaps(value: unknown): AlignmentGap[] {
	if (!Array.isArray(value)) return [];
	const out: AlignmentGap[] = [];
	for (const raw of value) {
		if (!raw || typeof raw !== 'object') continue;
		const typed = raw as Partial<AlignmentGap>;
		const field =
			typeof typed.field === 'string' && typed.field.trim() ? typed.field.trim() : 'general';
		const issue =
			typeof typed.issue === 'string' && typed.issue.trim()
				? typed.issue.trim()
				: 'Unspecified gap.';
		const suggestion =
			typeof typed.suggestion === 'string' && typed.suggestion.trim()
				? typed.suggestion.trim()
				: 'Rewrite the field so it directly invokes the lesson.';
		out.push({ field, issue, suggestion });
	}
	return out;
}

function normalizeAlignment(candidate: unknown): AlignmentResult {
	if (!candidate || typeof candidate !== 'object') {
		return {
			score: 1,
			summary: 'Evaluator returned an invalid payload.',
			gaps: []
		};
	}
	const typed = candidate as Partial<AlignmentResult>;
	return {
		score: clampScore(typed.score),
		summary:
			typeof typed.summary === 'string' && typed.summary.trim()
				? typed.summary.trim()
				: 'No summary returned.',
		gaps: normalizeGaps(typed.gaps)
	};
}

function summarizeDraft(draft: BuilderStoryDraft): string {
	const characterSummary = (draft.characters ?? [])
		.map((character, index) => {
			const name = character?.name?.trim() || `Character ${index + 1}`;
			const role = character?.role?.trim() || 'role';
			const description = character?.description?.trim() || '(no description)';
			return delimitedField(
				`DRAFT_CHARACTER_${index + 1}`,
				`${name} (${role}): ${description}`,
				1000
			);
		})
		.join('\n');

	const mechanicSummary = (draft.mechanics ?? [])
		.map((mechanic, index) => {
			const key = mechanic?.key?.trim() || `mechanic_${index + 1}`;
			const label = mechanic?.label?.trim() || 'unlabeled';
			const voiceLines = (mechanic?.voiceMap ?? [])
				.map((entry) => `    [${entry?.value ?? '?'}] ${entry?.line ?? ''}`)
				.join('\n');
			return delimitedField(
				`DRAFT_MECHANIC_${index + 1}`,
				`${key} (${label})\n${voiceLines || '    (no voice map lines)'}`,
				1500
			);
		})
		.join('\n');

	const voiceLines = (draft.voiceCeilingLines ?? [])
		.map((line, index) =>
			delimitedField(
				`DRAFT_VOICE_CEILING_LINE_${index + 1}`,
				line,
				MAX_VOICE_CEILING_LINE_LENGTH
			)
		)
		.join('\n');

	return [
		delimitedField('DRAFT_TITLE', draft.title, 500),
		delimitedField('DRAFT_PREMISE', draft.premise, MAX_PREMISE_LENGTH),
		delimitedField('DRAFT_SETTING', draft.setting, 2000),
		delimitedField('DRAFT_AESTHETIC_STATEMENT', draft.aestheticStatement, 2000),
		`Voice ceiling lines:\n${voiceLines || '(none)'}`,
		`Characters:\n${characterSummary || '(none)'}`,
		`Mechanics:\n${mechanicSummary || '(none)'}`,
		delimitedField('DRAFT_OPENING_PROMPT', draft.openingPrompt, 4000),
		delimitedField('DRAFT_SYSTEM_PROMPT', draft.systemPrompt, MAX_SYSTEM_PROMPT_LENGTH)
	].join('\n\n');
}

function buildAlignmentPrompts(lesson: Lesson, draft: BuilderStoryDraft): {
	systemPrompt: string;
	userPrompt: string;
} {
	const allowedFields = Array.from(KNOWN_FIELDS).join(', ');
	const systemPrompt = `${PROMPT_INJECTION_NOTE}

You are an editorial alignment evaluator. Given a story builder draft and a target lesson, score how well the draft's fields will surface that lesson when the story is played.

Scoring rubric (1-10):
- 10: Every load-bearing field directly invokes the lesson's storyTriggers, emotionalStakes, and unconventionalAngle without explaining them.
- 7-9: The premise and at least one of (openingPrompt, systemPrompt, mechanics) clearly serve the lesson; minor fields drift.
- 4-6: The draft gestures at the lesson but stages it through trait/feeling words or off-target mechanics.
- 1-3: The draft does not put the lesson under pressure; mechanics or prompts work against it.

For each field that does not yet serve the lesson, return one gap with:
- field: one of ${allowedFields} (use the exact key)
- issue: one specific sentence about what's missing or off
- suggestion: one specific sentence the author can act on

Check, in order:
1. Does the premise/setting invoke the lesson's storyTriggers?
2. Does the openingPrompt set up the emotionalStakes the lesson requires?
3. Does the systemPrompt's voice/constraint serve the lesson's unconventionalAngle?
4. Do the mechanics reinforce the lesson or work against it?

Return valid JSON only, with this exact shape:
{
  "score": number,
  "summary": string,
  "gaps": [{ "field": string, "issue": string, "suggestion": string }]
}

No prose outside the JSON. No markdown fencing.`;

	const userPrompt = `Lesson #${lesson.id}: ${lesson.title}
Quote: ${lesson.quote}
Insight: ${lesson.insight}
Emotional stakes:
${lesson.emotionalStakes.map((stake) => `- ${stake}`).join('\n')}
Story triggers:
${lesson.storyTriggers.map((trigger) => `- ${trigger}`).join('\n')}
Unconventional angle: ${lesson.unconventionalAngle}

Builder draft:
${summarizeDraft(draft)}

Score the alignment. Return JSON only.`;

	return { systemPrompt, userPrompt };
}

function fallbackAlignment(lesson: Lesson, draft: BuilderStoryDraft): AlignmentResult {
	const gaps: AlignmentGap[] = [];
	const triggerWords = lesson.storyTriggers
		.flatMap((trigger) => trigger.toLowerCase().split(/[^a-z0-9]+/))
		.filter((word) => word.length > 4);
	const stakeWords = lesson.emotionalStakes
		.flatMap((stake) => stake.toLowerCase().split(/[^a-z0-9]+/))
		.filter((word) => word.length > 4);
	const angleWords = lesson.unconventionalAngle
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter((word) => word.length > 4);

	function hasOverlap(text: string, words: string[]): boolean {
		if (!text) return false;
		const haystack = text.toLowerCase();
		return words.some((word) => haystack.includes(word));
	}

	const premiseBlob = `${draft.premise ?? ''} ${draft.setting ?? ''}`.trim();
	if (!hasOverlap(premiseBlob, triggerWords)) {
		gaps.push({
			field: 'premise',
			issue: 'Premise/setting does not echo any of the lesson’s story triggers.',
			suggestion: `Reference one concrete trigger, e.g. “${lesson.storyTriggers[0]}”.`
		});
	}
	if (!hasOverlap(draft.openingPrompt ?? '', stakeWords)) {
		gaps.push({
			field: 'openingPrompt',
			issue: 'Opening prompt does not stage the lesson’s emotional stakes.',
			suggestion: `Open inside the stake “${lesson.emotionalStakes[0]}” — show it as behavior, not naming.`
		});
	}
	if (!hasOverlap(draft.systemPrompt ?? '', angleWords)) {
		gaps.push({
			field: 'systemPrompt',
			issue: 'System prompt does not constrain voice toward the lesson’s unconventional angle.',
			suggestion: `Add a voice rule pointing at “${lesson.unconventionalAngle}”.`
		});
	}
	if (!(draft.mechanics ?? []).length) {
		gaps.push({
			field: 'mechanics',
			issue: 'No mechanics defined; the lesson has nothing to reinforce it under pressure.',
			suggestion: 'Add one mechanic whose escalated state stages the lesson’s emotional cost.'
		});
	}

	const score = Math.max(1, Math.min(10, 10 - gaps.length * 2));
	return {
		score,
		summary:
			gaps.length === 0
				? 'Heuristic fallback: surface-level alignment looks plausible. Re-run when Grok is available for a real score.'
				: `Heuristic fallback: ${gaps.length} field(s) do not yet invoke this lesson.`,
		gaps
	};
}

export const POST: RequestHandler = async ({ request, locals, url }) => {
	if (!locals.sessionUser) {
		return json(
			{ error: 'No session user; sign in before running alignment.', code: 'no_session' },
			{ status: 401 }
		);
	}

	const payload = (await request.json().catch(() => ({}))) as {
		draft?: unknown;
		lessonId?: unknown;
	};
	const draft = payload.draft;
	const lessonId = coerceLessonId(payload.lessonId);

	if (!isBuilderStoryDraft(draft)) {
		return json(
			{ error: 'Missing or invalid builder draft in request body.', code: 'invalid_request' },
			{ status: 400 }
		);
	}
	if (lessonId === null) {
		return json(
			{ error: 'Missing or invalid lessonId in request body.', code: 'invalid_request' },
			{ status: 400 }
		);
	}

	try {
		assertDraftWithinLimits(draft);
	} catch (error) {
		if (error instanceof PayloadLimitError) {
			return json({ error: error.message, code: error.code }, { status: error.status });
		}
		throw error;
	}

	const lesson = getLessonById(lessonId);
	if (!lesson) {
		return json(
			{ error: `Lesson ${lessonId} not found in catalog.`, code: 'lesson_not_found' },
			{ status: 404 }
		);
	}

	const { systemPrompt, userPrompt } = buildAlignmentPrompts(lesson, draft);

	let alignment: AlignmentResult;
	let source: 'ai' | 'fallback';
	try {
		const raw = await callBuilderModel(systemPrompt, userPrompt);
		const parsed = JSON.parse(extractJsonObject(raw));
		alignment = normalizeAlignment(parsed);
		source = 'ai';
	} catch (error) {
		console.warn(
			`[alignment] grok unavailable, using fallback: ${error instanceof Error ? error.message : 'unknown'}`
		);
		alignment = fallbackAlignment(lesson, draft);
		source = 'fallback';
	}

	emitAiServerTelemetry('builder_audit', {
		action: 'check_alignment',
		userId: locals.sessionUser?.userId ?? 'unknown',
		lessonId,
		source,
		score: alignment.score,
		gapCount: alignment.gaps.length,
		route: url.pathname
	});

	const response: AlignmentResponse = {
		alignment,
		lesson: { id: lesson.id, title: lesson.title },
		source
	};
	return json(response);
};
