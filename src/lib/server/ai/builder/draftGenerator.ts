import { noVacanciesCartridge } from '$lib/stories/no-vacancies';
import type { BuilderStoryDraft } from '$lib/stories/types';
import { createFallbackDraft } from './fallbackDraftFactory';
import { callBuilderModel, extractJsonObject } from './modelClient';
import { normalizeLineArray } from './normalizers';

export function normalizeDraft(candidate: unknown, premise: string): BuilderStoryDraft {
	const fallback = createFallbackDraft(premise);
	if (!candidate || typeof candidate !== 'object') {
		return fallback;
	}

	const typed = candidate as Partial<BuilderStoryDraft>;
	const mechanics = Array.isArray(typed.mechanics)
		? typed.mechanics
				.filter((mechanic): mechanic is NonNullable<typeof mechanic> => Boolean(mechanic))
				.map((mechanic) => ({
					key: typeof mechanic.key === 'string' ? mechanic.key : 'mechanic',
					label: typeof mechanic.label === 'string' ? mechanic.label : 'Mechanic',
					voiceMap: Array.isArray(mechanic.voiceMap)
						? mechanic.voiceMap
								.filter((entry): entry is { value: string; line: string } => {
									return Boolean(
										entry && typeof entry.value === 'string' && typeof entry.line === 'string'
									);
								})
						: []
				}))
		: fallback.mechanics;

	const characters = Array.isArray(typed.characters)
		? typed.characters
				.filter((character): character is NonNullable<typeof character> => Boolean(character))
				.map((character) => ({
					name: typeof character.name === 'string' ? character.name : 'Character',
					role: typeof character.role === 'string' ? character.role : 'role',
					description:
						typeof character.description === 'string'
							? character.description
							: 'Replace with story-authored behavior.'
				}))
		: fallback.characters;

	return {
		title: typeof typed.title === 'string' ? typed.title : fallback.title,
		premise: typeof typed.premise === 'string' ? typed.premise : premise || fallback.premise,
		setting: typeof typed.setting === 'string' ? typed.setting : fallback.setting,
		aestheticStatement:
			typeof typed.aestheticStatement === 'string'
				? typed.aestheticStatement
				: fallback.aestheticStatement,
		voiceCeilingLines: normalizeLineArray(typed.voiceCeilingLines, fallback.voiceCeilingLines),
		characters,
		mechanics: mechanics.length > 0 ? mechanics : fallback.mechanics,
		openingPrompt:
			typeof typed.openingPrompt === 'string' ? typed.openingPrompt : fallback.openingPrompt,
		systemPrompt:
			typeof typed.systemPrompt === 'string' ? typed.systemPrompt : fallback.systemPrompt
	};
}

export async function generateDraftFromPremise(
	premise: string,
	dependencies: { callModel?: typeof callBuilderModel } = {}
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

	const callModel = dependencies.callModel ?? callBuilderModel;
	try {
		const raw = await callModel(systemPrompt, userPrompt);
		const parsed = JSON.parse(extractJsonObject(raw));
		return {
			draft: normalizeDraft(parsed, trimmedPremise),
			source: 'ai'
		};
	} catch {
		// Builder creation is AI-first, but it should never dead-end on missing keys or transient provider failures.
		return {
			draft: createFallbackDraft(trimmedPremise),
			source: 'fallback'
		};
	}
}
