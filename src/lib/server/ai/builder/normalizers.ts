import { extractJsonObject as extractJsonObjectShared } from '$lib/server/ai/json/extractJsonObject';
import type { BuilderFieldFeedback, BuilderStoryDraft } from '$lib/stories/types';
import { createFallbackDraft } from './fallbackDraftFactory';

export function extractJsonObject(text: string): string {
	return extractJsonObjectShared(text, {
		emptyErrorMessage: 'Empty builder response',
		notFoundErrorMessage: 'No JSON object found in builder response'
	});
}

function normalizeLineArray(value: unknown, fallback: string[]): string[] {
	if (!Array.isArray(value)) return fallback;
	return value.filter((line): line is string => typeof line === 'string' && line.trim().length > 0);
}

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
						? mechanic.voiceMap.filter((entry): entry is { value: string; line: string } => {
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
		systemPrompt: typeof typed.systemPrompt === 'string' ? typed.systemPrompt : fallback.systemPrompt
	};
}

export function normalizeProseFeedback(candidate: Partial<BuilderFieldFeedback>): BuilderFieldFeedback {
	return {
		score:
			typeof candidate.score === 'number' && Number.isFinite(candidate.score)
				? Math.max(1, Math.min(10, Math.round(candidate.score)))
				: 1,
		flags: Array.isArray(candidate.flags)
			? candidate.flags.filter((flag): flag is string => typeof flag === 'string')
			: ['AI evaluator returned an invalid flags payload.'],
		suggestion:
			typeof candidate.suggestion === 'string'
				? candidate.suggestion
				: 'Rewrite around behavior, concrete detail, and implied consequence.'
	};
}
