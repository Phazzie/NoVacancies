import { expect, test } from '@playwright/test';
import { callBuilderModel } from '../../../src/lib/server/ai/builder/modelClient';

type MockFetch = typeof fetch;

const REQUIRED_ENV_KEYS = [
    'AI_PROVIDER',
    'AI_OUTAGE_MODE',
    'ENABLE_GROK_TEXT',
    'XAI_API_KEY',
    'GROK_TEXT_MODEL',
    'AI_MAX_OUTPUT_TOKENS',
    'AI_REQUEST_TIMEOUT_MS'
] as const;

function applyBaseEnv(): void {
    process.env.AI_PROVIDER = 'grok';
    process.env.AI_OUTAGE_MODE = 'hard_fail';
    process.env.ENABLE_GROK_TEXT = '1';
    process.env.XAI_API_KEY = 'test-key';
    process.env.GROK_TEXT_MODEL = 'grok-test';
    process.env.AI_MAX_OUTPUT_TOKENS = '2000';
    process.env.AI_REQUEST_TIMEOUT_MS = '5000';
}

test.describe('builder modelClient', () => {
    let originalFetch: MockFetch;
    let originalSetTimeout: typeof setTimeout;
    let originalClearTimeout: typeof clearTimeout;

    test.beforeEach(() => {
        originalFetch = globalThis.fetch;
        originalSetTimeout = globalThis.setTimeout;
        originalClearTimeout = globalThis.clearTimeout;
        applyBaseEnv();
    });

    test.afterEach(() => {
        globalThis.fetch = originalFetch;
        globalThis.setTimeout = originalSetTimeout;
        globalThis.clearTimeout = originalClearTimeout;
        for (const key of REQUIRED_ENV_KEYS) {
            delete process.env[key];
        }
    });

    test('sends expected request payload and returns first content choice', async () => {
        let body: Record<string, unknown> | null = null;
        globalThis.fetch = (async (_url, init) => {
            body = JSON.parse(String(init?.body));
            return new Response(
                JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }] }),
                { status: 200 }
            );
        }) as MockFetch;

        const result = await callBuilderModel('system prompt', 'user prompt');

        expect(result).toBe('{"ok":true}');
        expect(body?.model).toBe('grok-test');
        expect(body?.max_tokens).toBe(1400);
        expect(body?.messages).toEqual([
            { role: 'system', content: 'system prompt' },
            { role: 'user', content: 'user prompt' }
        ]);
    });

    test('throws a timeout error when request is aborted', async () => {
        globalThis.fetch = (async () => {
            const err = new Error('aborted');
            (err as Error & { name: string }).name = 'AbortError';
            throw err;
        }) as MockFetch;

        await expect(callBuilderModel('system', 'user')).rejects.toThrow(/timed out/i);
    });

    test('throws when provider returns empty content', async () => {
        globalThis.fetch = (async () =>
            new Response(JSON.stringify({ choices: [{ message: { content: null } }] }), {
                status: 200
            })) as MockFetch;

        await expect(callBuilderModel('system', 'user')).rejects.toThrow(/empty content/i);
    });

    test('throws when provider responds with non-ok status', async () => {
        globalThis.fetch = (async () => new Response('down', { status: 503 })) as MockFetch;

        await expect(callBuilderModel('system', 'user')).rejects.toThrow(/failed \(503\)/i);
    });
});
