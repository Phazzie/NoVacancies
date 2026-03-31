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
	} catch {
		return {
			draft: createFallbackDraft(trimmedPremise),
			source: 'fallback'
		};
	}
}
