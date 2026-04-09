import { expect, test } from '@playwright/test';
import { loadAiConfig } from '../../src/lib/server/ai/config';

const BASE_ENV = {
    AI_PROVIDER: 'grok',
    AI_OUTAGE_MODE: 'hard_fail',
    XAI_API_KEY: 'test-key'
};

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

    test.describe('AI_RETRY_BACKOFF_MS', () => {
        test('defaults to [400, 1200] when unset', () => {
            const config = loadAiConfig(BASE_ENV);
            expect(config.retryBackoffMs).toEqual([400, 1200]);
        });

        test('parses a valid comma-separated list', () => {
            const config = loadAiConfig({ ...BASE_ENV, AI_RETRY_BACKOFF_MS: '100,500' });
            expect(config.retryBackoffMs).toEqual([100, 500]);
        });

        test('falls back to default when any entry is non-numeric', () => {
            const config = loadAiConfig({ ...BASE_ENV, AI_RETRY_BACKOFF_MS: '100,abc,500' });
            expect(config.retryBackoffMs).toEqual([400, 1200]);
        });

        test('falls back to default when the first entry is non-numeric', () => {
            const config = loadAiConfig({ ...BASE_ENV, AI_RETRY_BACKOFF_MS: 'abc,100,500' });
            expect(config.retryBackoffMs).toEqual([400, 1200]);
        });

        test('takes only the first 4 values when more than 4 are provided', () => {
            const config = loadAiConfig({ ...BASE_ENV, AI_RETRY_BACKOFF_MS: '10,20,30,40,50' });
            expect(config.retryBackoffMs).toEqual([10, 20, 30, 40]);
        });

        test('clamps individual values to [0, 10000]', () => {
            const config = loadAiConfig({ ...BASE_ENV, AI_RETRY_BACKOFF_MS: '0,20000' });
            expect(config.retryBackoffMs).toEqual([0, 10000]);
        });
    });

    test.describe('aiAuthBypass removed from AiConfig', () => {
        test('returned config does not contain aiAuthBypass property', () => {
            const config = loadAiConfig(BASE_ENV);
            expect('aiAuthBypass' in config).toBe(false);
        });

        test('still throws when AI_AUTH_BYPASS env var is set to true', () => {
            expect(() =>
                loadAiConfig({ ...BASE_ENV, AI_AUTH_BYPASS: 'true' })
            ).toThrow(/AI_AUTH_BYPASS is disabled/i);
        });
    });
});
