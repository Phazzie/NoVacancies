import { expect, test } from '@playwright/test';
import {
    evaluateBuilderDraft,
    fallbackEvaluateDraft
} from '../../../src/lib/server/ai/builder/draftEvaluator';
import { starterKitCartridge } from '../../../src/lib/stories/starter-kit';

test.describe('draftEvaluator', () => {
    test('fallback evaluator blocks drafts with no mechanics', () => {
        const draft = starterKitCartridge.builder.createEmptyDraft();
        draft.mechanics = [];

        const evaluation = fallbackEvaluateDraft(draft);

        expect(evaluation.readiness).toBe('blocked');
        expect(evaluation.publishable).toBeFalsy();
        expect(evaluation.dimensionScores.mechanicClarity).toBe(1);
        expect(evaluation.findings.some((finding) => finding.severity === 'blocker')).toBeTruthy();
    });

    test('fallback evaluator penalizes repeated phrasing and summary language', () => {
        const draft = starterKitCartridge.builder.createEmptyDraft();
        draft.aestheticStatement = 'She realized the lesson and understood what this teaches.';
        draft.openingPrompt = draft.aestheticStatement;
        draft.systemPrompt = draft.aestheticStatement;
        draft.voiceCeilingLines = [
            'She realized the lesson and understood what this teaches.',
            'She realized the lesson and understood what this teaches.'
        ];

        const evaluation = fallbackEvaluateDraft(draft);

        expect(evaluation.dimensionScores.repetitionRisk).toBeLessThan(10);
        expect(evaluation.dimensionScores.behavioralSpecificity).toBeLessThan(10);
        expect(
            evaluation.findings.some((finding) =>
                /summary language|Repeated phrasing/i.test(finding.message)
            )
        ).toBeTruthy();
    });

    test('evaluateBuilderDraft falls back when model call is unavailable', async () => {
        delete process.env.XAI_API_KEY;
        process.env.AI_PROVIDER = 'grok';
        process.env.AI_OUTAGE_MODE = 'hard_fail';
        process.env.ENABLE_GROK_TEXT = '1';

        const draft = starterKitCartridge.builder.createEmptyDraft();
        const result = await evaluateBuilderDraft(draft);

        expect(result.source).toBe('fallback');
        expect(result.evaluation.overallScore).toBeGreaterThan(0);
    });

    test('evaluateBuilderDraft returns ai source for valid model payload', async () => {
        const originalFetch = globalThis.fetch;
        process.env.AI_PROVIDER = 'grok';
        process.env.AI_OUTAGE_MODE = 'hard_fail';
        process.env.ENABLE_GROK_TEXT = '1';
        process.env.XAI_API_KEY = 'test-key';
        process.env.GROK_TEXT_MODEL = 'grok-test';
        process.env.AI_MAX_OUTPUT_TOKENS = '1200';
        process.env.AI_REQUEST_TIMEOUT_MS = '5000';

        globalThis.fetch = (async () => {
            const payload = {
                choices: [
                    {
                        message: {
                            content: JSON.stringify({
                                dimensionScores: {
                                    voiceConsistency: 9,
                                    behavioralSpecificity: 8,
                                    mechanicClarity: 8,
                                    promptCoherence: 9,
                                    repetitionRisk: 8
                                },
                                findings: [
                                    {
                                        severity: 'info',
                                        dimension: 'voiceConsistency',
                                        fieldKey: 'aestheticStatement',
                                        message: 'Looks coherent.'
                                    }
                                ]
                            })
                        }
                    }
                ]
            };
            return new Response(JSON.stringify(payload), { status: 200 });
        }) as typeof fetch;

        try {
            const draft = starterKitCartridge.builder.createEmptyDraft();
            const result = await evaluateBuilderDraft(draft);

            expect(result.source).toBe('ai');
            expect(result.evaluation.dimensionScores.voiceConsistency).toBe(9);
            expect(result.evaluation.publishable).toBeTruthy();
        } finally {
            globalThis.fetch = originalFetch;
        }
    });
});
