import { expect, test } from '@playwright/test';
import { generateDraftFromPremise } from '../../../src/lib/server/ai/builder/draftGenerator';

test.describe('draftGenerator', () => {
	test('returns fallback draft for empty premise', async () => {
		const result = await generateDraftFromPremise('   ');

		expect(result.source).toBe('fallback');
		expect(result.draft.title).toBe('Starter Story');
		expect(result.draft.characters.length).toBeGreaterThan(0);
	});

	test('returns normalized AI draft when model response is valid JSON', async () => {
		const originalFetch = globalThis.fetch;
		const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
		const previousApiKey = env?.env?.XAI_API_KEY;
		if (env?.env) env.env.XAI_API_KEY = 'test-key';

		globalThis.fetch = async () =>
			new Response(
				JSON.stringify({
					choices: [
						{
							message: {
								content: '```json\n{"title":"Midnight Debt","premise":"Custom","setting":"Back room","aestheticStatement":"Concrete","voiceCeilingLines":["line 1"],"characters":[{"name":"A","role":"lead","description":"desc"}],"mechanics":[{"key":"pressure","label":"Pressure","voiceMap":[{"value":"0","line":"calm"},{"value":"1","line":"tight"}]}],"openingPrompt":"open","systemPrompt":"system"}\n```'
							}
						}
					]
				}),
				{ status: 200 }
			) as Response;

		try {
			const result = await generateDraftFromPremise('A courier hides cash in frozen pizzas.');

			expect(result.source).toBe('ai');
			expect(result.draft.title).toBe('Midnight Debt');
			expect(result.draft.mechanics[0]?.voiceMap.length).toBe(2);
		} finally {
			globalThis.fetch = originalFetch;
			if (env?.env) env.env.XAI_API_KEY = previousApiKey;
		}
	});
});
