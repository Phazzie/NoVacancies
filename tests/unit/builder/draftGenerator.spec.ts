import { expect, test } from '@playwright/test';
import { generateDraftFromPremise, normalizeDraft } from '../../../src/lib/server/ai/builder/draftGenerator';

test.describe('draftGenerator', () => {
	test('uses fallback when premise is empty', async () => {
		const result = await generateDraftFromPremise('   ');

		expect(result.source).toBe('fallback');
		expect(result.draft.title).toBe('Starter Story');
	});

	test('returns ai source when model returns valid draft payload', async () => {
		const result = await generateDraftFromPremise('A janitor unravels a cover-up in a freezer.', {
			callModel: async () =>
				JSON.stringify({
					title: 'Freezer Debt',
					premise: 'A janitor unravels a cover-up in a freezer.',
					setting: 'A warehouse freezer at midnight.',
					aestheticStatement: 'Concrete and behavior-led.',
					voiceCeilingLines: ['The fan counts what nobody says.'],
					characters: [{ name: 'Rhea', role: 'lead', description: 'She keeps the floor moving.' }],
					mechanics: [
						{
							key: 'debt',
							label: 'Debt',
							voiceMap: [
								{ value: '0', line: 'Nobody says it out loud.' },
								{ value: '2', line: 'Everybody invoices her silence.' }
							]
						}
					],
					openingPrompt: 'Write the opening.',
					systemPrompt: 'System'
				})
		});

		expect(result.source).toBe('ai');
		expect(result.draft.title).toBe('Freezer Debt');
		expect(result.draft.mechanics[0]?.voiceMap.length).toBe(2);
	});

	test('normalizeDraft fills invalid arrays with safe defaults', () => {
		const normalized = normalizeDraft(
			{
				title: 'Only Title',
				voiceCeilingLines: [123, 'Valid line'],
				characters: [{}],
				mechanics: [{ voiceMap: [{ value: 1, line: 'nope' }] }]
			},
			'Fallback premise'
		);

		expect(normalized.voiceCeilingLines).toEqual(['Valid line']);
		expect(normalized.characters[0]?.name).toBe('Character');
		expect(normalized.mechanics[0]?.key).toBe('mechanic');
	});
});
