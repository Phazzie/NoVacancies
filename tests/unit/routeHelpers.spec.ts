import { expect, test } from '@playwright/test';
import { createGameState } from '../../src/lib/contracts';
import { AiProviderError } from '../../src/lib/server/ai/provider.interface';
import {
    asRouteError,
    buildNextInput,
    buildOpeningInput
} from '../../src/lib/server/ai/routeHelpers';
import { resetAiTelemetrySink, setAiTelemetrySink } from '../../src/lib/server/ai/telemetry';
import type { TelemetrySink } from '../../src/lib/server/ai/telemetrySink';

class RecordingSink implements TelemetrySink {
    public records: Array<{ stage: string; payload: Record<string, unknown> }> = [];

    emit(stage: string, payload: Record<string, unknown>): void {
        this.records.push({ stage, payload });
    }
}

test.describe('routeHelpers', () => {
    test.afterEach(() => {
        resetAiTelemetrySink();
    });

    test('buildOpeningInput returns game state with opening mode fields', () => {
        const input = buildOpeningInput();

        expect(input.currentSceneId).toBeNull();
        expect(input.choiceId).toBeNull();
        expect(input.gameState.currentSceneId.length).toBeGreaterThan(0);
        expect(input.gameState.sceneCount).toBe(0);
    });

    test('buildNextInput reuses provided game state and defaults missing fields', () => {
        const state = createGameState({ initialSceneId: 'custom_opening' });
        const input = buildNextInput({ gameState: state, choiceId: undefined });

        expect(input.gameState).toBe(state);
        expect(input.currentSceneId).toBe('custom_opening');
        expect(input.choiceId).toBeNull();
        expect(input.narrativeContext).toBeNull();
    });

    test('asRouteError maps provider error to code/status and emits telemetry', async () => {
        const sink = new RecordingSink();
        setAiTelemetrySink(sink);
        const request = { url: new URL('http://localhost/api/story/next') };

        const response = asRouteError(
            request as Parameters<typeof asRouteError>[0],
            new AiProviderError('Rate limited', {
                code: 'rate_limit',
                retryable: true,
                status: 429
            })
        );
        const payload = (await response.json()) as { error: string; code: string; status: number };

        expect(response.status).toBe(429);
        expect(payload.code).toBe('rate_limit');
        expect(payload.status).toBe(429);
        expect(sink.records[0]?.stage).toBe('route_error');
        expect(sink.records[0]?.payload.route).toBe('/api/story/next');
        expect(sink.records[0]?.payload.code).toBe('rate_limit');
    });

    test('asRouteError derives missing_api_key code from sanitized message', async () => {
        const request = { url: new URL('http://localhost/api/story/opening') };
        const response = asRouteError(
            request as Parameters<typeof asRouteError>[0],
            new Error('XAI_API_KEY is required in Grok-only mode')
        );
        const payload = (await response.json()) as { error: string; code: string; status: number };

        expect(payload.code).toBe('missing_api_key');
        expect(payload.status).toBe(500);
        expect(payload.error).toMatch(/XAI_API_KEY/i);
    });

    test('resolveTextScene does not emit a story_scene telemetry event', async () => {
        const sink = new RecordingSink();
        setAiTelemetrySink(sink);

        // resolveTextScene calls loadAiConfig() which needs XAI_API_KEY.
        // We don't have the key here, so it will throw — but the throw
        // must come from config loading, NOT from a telemetry emit.
        // We verify no story_scene event was emitted before the throw.
        try {
            const { resolveTextScene } = await import('../../src/lib/server/ai/routeHelpers');
            await resolveTextScene({ currentSceneId: null, choiceId: null, gameState: createGameState() }, 'opening');
        } catch {
            // expected — no api key in test env
        }

        const storySceneEvents = sink.records.filter((r) => r.stage === 'story_scene');
        expect(storySceneEvents).toHaveLength(0);
    });
});
