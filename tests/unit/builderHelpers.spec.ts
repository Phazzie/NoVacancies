import { expect, test } from '@playwright/test';
import {
	evaluateBuilderDraft,
	evaluateBuilderProse,
	generateDraftFromPremise
} from '../../src/lib/server/ai/builder';
import { starterKitCartridge } from '../../src/lib/stories/starter-kit';

test.describe('Builder helpers', () => {
	test('empty-premise draft falls back to a neutral starter scaffold', async () => {
		const result = await generateDraftFromPremise('');

		expect(result.source).toBe('fallback');
		expect(result.draft.title).toBe('Starter Story');
		expect(JSON.stringify(result.draft)).not.toMatch(/No Vacancies|Sydney|daily-rate motel/i);
	});

	test('generates a structured draft from a premise even without live AI', async () => {
		const result = await generateDraftFromPremise(
			'A night janitor at a frozen warehouse keeps covering for her brother until the cold starts sounding personal.'
		);

		expect(result.draft.title.length).toBeGreaterThan(0);
		expect(result.draft.characters.length).toBeGreaterThan(0);
		expect(result.draft.mechanics.length).toBeGreaterThan(0);
		expect(result.draft.voiceCeilingLines.length).toBeGreaterThan(0);
		expect(JSON.stringify(result.draft)).not.toMatch(/Sydney|daily-rate motel/i);
	});

	test('flags hallmark-card summary prose in evaluator fallback', async () => {
		const result = await evaluateBuilderProse(
			'She realized how much she had been carrying and finally understood the lesson.'
		);

		expect(result.feedback.score).toBeLessThan(8);
		expect(result.feedback.flags.join(' ')).toMatch(/Explains the feeling|Hallmark|lesson/i);
	});

	test('evaluates full drafts with deterministic fallback readiness output', async () => {
		const draft = starterKitCartridge.builder.createEmptyDraft();
		draft.mechanics = [];
		draft.voiceCeilingLines = ['She realized the lesson and healed at last.'];

		const result = await evaluateBuilderDraft(draft);

		expect(result.evaluation.overallScore).toBeGreaterThan(0);
		expect(result.evaluation.dimensionScores.mechanicClarity).toBeLessThan(6);
		expect(result.evaluation.findings.some((finding) => finding.severity === 'blocker')).toBeTruthy();
		expect(result.evaluation.readiness).toBe('blocked');
		expect(result.evaluation.publishable).toBeFalsy();
	});
});
