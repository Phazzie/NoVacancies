import { getLessonById, type Lesson } from '$lib/narrative/lessonsCatalog';
import { noVacanciesCartridge } from '$lib/stories/no-vacancies';
import type { BuilderStoryDraft } from '$lib/stories/types';
import { createFallbackDraft } from './fallbackDraftFactory';
import { callBuilderModel } from './modelClient';
import { extractJsonObject, normalizeDraft } from './normalizers';

export async function generateDraftFromPremise(
	premise: string
): Promise<{ draft: BuilderStoryDraft; source: 'ai' | 'fallback' }> {
	const trimmedPremise = premise.trim();
	if (!trimmedPremise) {
		return {
			draft: createFallbackDraft(''),
			source: 'fallback'
		};
	}

	const systemPrompt = `You are drafting a StoryDefinition-like JSON object for a new interactive narrative. Use No Vacancies as the reference for behavioral specificity, motive-driven prose, and pressure-loaded mechanics, but do not copy its setting or names.

Return valid JSON only with this shape:
{
  "title": string,
  "premise": string,
  "setting": string,
  "aestheticStatement": string,
  "voiceCeilingLines": string[],
  "characters": [{ "name": string, "role": string, "description": string }],
  "mechanics": [{ "key": string, "label": string, "voiceMap": [{ "value": string, "line": string }] }],
  "openingPrompt": string,
  "systemPrompt": string
}

Rules:
- write behavioral prose, not trait-summary prose
- include 2-4 characters
- include 3-5 mechanics
- each mechanic must have at least 2 voiceMap entries
- keep voice ceiling lines sharp, concrete, and under 20 words
- avoid copying No Vacancies-specific names, motel details, drugs, or incidents unless the premise explicitly asks for them`;

	const userPrompt = `Premise:
${trimmedPremise}

Reference voice statement:
${noVacanciesCartridge.voice.aestheticStatement}

Reference voice ceiling lines:
${noVacanciesCartridge.voice.voiceCeilingLines.map((line) => `- ${line}`).join('\n')}

Reference behavior seeds:
${(noVacanciesCartridge.voice.behaviorSeeds || [])
	.map((seed) => `- Incident: ${seed.incident}\n  Pattern: ${seed.pattern}`)
	.join('\n')}

Generate the first draft now.`;

	try {
		const raw = await callBuilderModel(systemPrompt, userPrompt);
		const parsed = JSON.parse(extractJsonObject(raw));
		return {
			draft: normalizeDraft(parsed, trimmedPremise),
			source: 'ai'
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(
			'[draftGenerator:generateDraftFromPremise] error — returning fallback draft:',
			message
		);
		return {
			draft: createFallbackDraft(trimmedPremise),
			source: 'fallback'
		};
	}
}

/**
 * Remix an existing draft against a different lesson.
 *
 * Preserves author-crafted identity fields:
 *   title, setting, characters, aestheticStatement, voiceCeilingLines.
 *
 * Rewrites the lesson-coupled fields:
 *   premise, openingPrompt, systemPrompt, mechanics.
 *
 * Falls back to a passthrough of the existing draft if the new lesson is
 * missing or Grok fails — so a failed remix never wipes the author's work.
 */
export async function remixDraft(
	currentDraft: BuilderStoryDraft,
	newLessonId: number
): Promise<{ draft: BuilderStoryDraft; source: 'ai' | 'fallback'; lesson: Lesson }> {
	const lesson = getLessonById(newLessonId);
	if (!lesson) {
		throw new Error(`Unknown lesson id: ${newLessonId}`);
	}

	const preserved = {
		title: currentDraft.title,
		setting: currentDraft.setting,
		characters: currentDraft.characters,
		aestheticStatement: currentDraft.aestheticStatement,
		voiceCeilingLines: currentDraft.voiceCeilingLines
	};

	const systemPrompt = `You are remixing an existing interactive-narrative draft so it teaches a different lesson while keeping the author's hand-crafted identity intact.

Hard rules:
- Return the preserved fields EXACTLY as they are provided. Do not paraphrase title, setting, characters, aestheticStatement, or voiceCeilingLines. Copy them verbatim into the response.
- Rewrite ONLY these four fields so they put the new lesson under behavioral pressure: premise, openingPrompt, systemPrompt, mechanics.
- Use No Vacancies-style behavioral specificity: motive-driven prose, concrete objects and actions, no trait-summary or therapy-speak.
- 3-5 mechanics, each with at least 2 voiceMap entries. Mechanic keys/labels should be short and evocative.
- The new mechanics should track states that surface the new lesson under pressure inside this same setting with these same characters.

Return valid JSON only with this shape:
{
  "title": string,
  "premise": string,
  "setting": string,
  "aestheticStatement": string,
  "voiceCeilingLines": string[],
  "characters": [{ "name": string, "role": string, "description": string }],
  "mechanics": [{ "key": string, "label": string, "voiceMap": [{ "value": string, "line": string }] }],
  "openingPrompt": string,
  "systemPrompt": string
}`;

	const userPrompt = `New lesson:
#${lesson.id} — ${lesson.title}
Quote: ${lesson.quote}
Insight: ${lesson.insight}
Emotional stakes:
${lesson.emotionalStakes.map((stake) => `- ${stake}`).join('\n')}
Story triggers:
${lesson.storyTriggers.map((trigger) => `- ${trigger}`).join('\n')}
Unconventional angle: ${lesson.unconventionalAngle}

Preserved fields (return these VERBATIM):
${JSON.stringify(preserved, null, 2)}

Current draft (for context — rewrite premise, openingPrompt, systemPrompt, mechanics to reorient around the new lesson):
${JSON.stringify(currentDraft, null, 2)}

Remix the draft now. Return JSON only.`;

	try {
		const raw = await callBuilderModel(systemPrompt, userPrompt);
		const parsed = JSON.parse(extractJsonObject(raw));
		// Pass an empty premise as the fallback: in a remix the premise MUST change
		// to reflect the new lesson. If Grok omits `premise`, surface that as an
		// empty field (visible to the author) rather than silently preserving the
		// old, lesson-mismatched premise.
		const normalized = normalizeDraft(parsed, '');
		// Force-preserve the author-crafted fields regardless of what the model
		// returned. Grok occasionally rephrases them despite the prompt rules.
		const merged: BuilderStoryDraft = {
			...normalized,
			title: preserved.title,
			setting: preserved.setting,
			characters: preserved.characters,
			aestheticStatement: preserved.aestheticStatement,
			voiceCeilingLines: preserved.voiceCeilingLines
		};
		return {
			draft: merged,
			source: 'ai',
			lesson
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(
			'[draftGenerator:remixDraft] error — returning current draft as fallback:',
			message
		);
		return {
			draft: currentDraft,
			source: 'fallback',
			lesson
		};
	}
}
