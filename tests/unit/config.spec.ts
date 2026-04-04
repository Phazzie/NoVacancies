import { expect, test } from '@playwright/test';
import { loadAiConfig } from '../../src/lib/server/ai/config';

test.describe('ai config loading', () => {
    test('parses booleans and clamps numeric ranges', () => {
        const config = loadAiConfig({
            AI_PROVIDER: 'grok',
            AI_OUTAGE_MODE: 'hard_fail',
            ENABLE_GROK_TEXT: 'enabled',
            ENABLE_GROK_IMAGES: 'yes',
            ENABLE_PROVIDER_PROBE: 'on',
            XAI_API_KEY: 'test-key',
            AI_MAX_OUTPUT_TOKENS: '999999',
            AI_REQUEST_TIMEOUT_MS: '1',
            AI_MAX_RETRIES: '-10'
        });

        expect(config.provider).toBe('grok');
        expect(config.enableGrokText).toBeTruthy();
        expect(config.enableGrokImages).toBeTruthy();
        expect(config.enableProviderProbe).toBeTruthy();
        expect(config.maxOutputTokens).toBe(3200);
        expect(config.requestTimeoutMs).toBe(5000);
        expect(config.maxRetries).toBe(0);
    });

    test('throws when AI_AUTH_BYPASS is enabled', () => {
        expect(() =>
            loadAiConfig({
                AI_PROVIDER: 'grok',
                AI_OUTAGE_MODE: 'hard_fail',
                AI_AUTH_BYPASS: '1',
                XAI_API_KEY: 'test-key'
            })
        ).toThrow(/AI_AUTH_BYPASS is disabled/i);
    });

    test('throws in prod-like env when outage mode is missing', () => {
        expect(() =>
            loadAiConfig({
                AI_PROVIDER: 'grok',
                NODE_ENV: 'production',
                XAI_API_KEY: 'test-key'
            })
        ).toThrow(/AI_OUTAGE_MODE must be set/i);
    });

    test('throws when xai key is missing in grok-only mode', () => {
        expect(() =>
            loadAiConfig({
                AI_PROVIDER: 'grok',
                AI_OUTAGE_MODE: 'hard_fail',
                ENABLE_GROK_TEXT: '1',
                XAI_API_KEY: ' '
            })
        ).toThrow(/XAI_API_KEY is required/i);
    });
});
