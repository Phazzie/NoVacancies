import { starterKitCartridge } from '$lib/stories/starter-kit';
import type { BuilderStoryDraft } from '$lib/stories/types';
import { deriveSettingFromPremise, deriveTitleFromPremise } from './normalizers';

export function createFallbackDraft(premise: string): BuilderStoryDraft {
	const referenceDraft = starterKitCartridge.builder.createEmptyDraft();
	const normalizedPremise = premise.trim();
	const title = normalizedPremise ? deriveTitleFromPremise(normalizedPremise) : referenceDraft.title;
	const setting = normalizedPremise
		? deriveSettingFromPremise(normalizedPremise)
		: referenceDraft.setting;

	// The fallback keeps authoring moving even when Grok is unavailable; it is scaffolding, not quality parity.
	return {
		...referenceDraft,
		title,
		premise: normalizedPremise,
		setting,
		aestheticStatement:
			'Keep the prose motive-driven and behavioral. Let objects, rooms, and silence act like people with leverage.',
		voiceCeilingLines: [
			`${title} starts with the room already keeping score.`,
			'The cost shows up before anybody explains it.'
		],
		characters: [
			{
				name: 'Protagonist',
				role: 'lead',
				description:
					'The person keeping the structure standing, already exhausted by how invisible that work has become.'
			},
			{
				name: 'Pressure Source',
				role: 'foil',
				description:
					'Someone who benefits from the protagonist carrying the load and resents being reminded where the weight lives.'
			}
		],
		mechanics: [
			{
				key: 'pressure',
				label: 'Pressure',
				voiceMap: [
					{ value: '0', line: 'The pressure is here already. It just has not been named yet.' },
					{
						value: '2',
						line: 'The room has stopped pretending the pressure is temporary.'
					}
				]
			},
			{
				key: 'clarity',
				label: 'Clarity',
				voiceMap: [
					{
						value: '0',
						line: 'The protagonist is still translating repeated behavior into isolated bad luck.'
					},
					{
						value: '2',
						line: 'The pattern is too clean to call an accident anymore.'
					}
				]
			}
		],
		openingPrompt: `Generate an opening scene for this premise: ${normalizedPremise}`,
		systemPrompt: `You are writing a grounded interactive narrative about this premise: ${normalizedPremise}. Keep the prose concrete, behavioral, and free of therapy-summary language.`
	};
}
