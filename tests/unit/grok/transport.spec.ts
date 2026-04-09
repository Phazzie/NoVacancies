import { expect, test } from '@playwright/test';
import { executeJsonRequest } from '../../../src/lib/server/ai/providers/grok/transport';
import { AiProviderError } from '../../../src/lib/server/ai/provider.interface';

function makeFetch(status: number, body: unknown = {}): typeof fetch {
    return async () =>
        ({
            ok: status >= 200 && status < 300,
            status,
            json: async () => body
        }) as Response;
}

function makeThrowingFetch(error: Error): typeof fetch {
    return async () => {
        throw error;
    };
}

const BASE_OPTIONS = {
    url: 'https://api.x.ai/v1/chat/completions',
    apiKey: 'test-key',
    requestTimeoutMs: 5000,
    body: { model: 'grok-test', messages: [] } as Record<string, unknown>,
    requestType: 'chat' as const
};

test.describe('executeJsonRequest (transport)', () => {
    test('resolves with parsed JSON on a successful 200 response', async () => {
        const result = await executeJsonRequest<{ data: string }>({
            ...BASE_OPTIONS,
            fetchImpl: makeFetch(200, { data: 'ok' })
        });
        expect(result).toEqual({ data: 'ok' });
    });

    test('throws AiProviderError with code:auth and retryable:false on 401', async () => {
        await expect(
            executeJsonRequest({ ...BASE_OPTIONS, fetchImpl: makeFetch(401) })
        ).rejects.toMatchObject({
            name: 'AiProviderError',
            code: 'auth',
            status: 401,
            retryable: false
        });
    });

    test('throws AiProviderError with code:auth and retryable:false on 403', async () => {
        await expect(
            executeJsonRequest({ ...BASE_OPTIONS, fetchImpl: makeFetch(403) })
        ).rejects.toMatchObject({
            name: 'AiProviderError',
            code: 'auth',
            status: 403,
            retryable: false
        });
    });

    test('throws AiProviderError with code:rate_limit and retryable:true on 429', async () => {
        await expect(
            executeJsonRequest({ ...BASE_OPTIONS, fetchImpl: makeFetch(429) })
        ).rejects.toMatchObject({
            name: 'AiProviderError',
            code: 'rate_limit',
            retryable: true
        });
    });

    test('throws AiProviderError with code:provider_down and retryable:true on 503', async () => {
        await expect(
            executeJsonRequest({ ...BASE_OPTIONS, fetchImpl: makeFetch(503) })
        ).rejects.toMatchObject({
            name: 'AiProviderError',
            code: 'provider_down',
            retryable: true
        });
    });

    test('throws AiProviderError with code:timeout and retryable:true on AbortError', async () => {
        const abortError = Object.assign(new Error('The operation was aborted'), {
            name: 'AbortError'
        });
        await expect(
            executeJsonRequest({
                ...BASE_OPTIONS,
                fetchImpl: makeThrowingFetch(abortError)
            })
        ).rejects.toMatchObject({
            name: 'AiProviderError',
            code: 'timeout',
            retryable: true,
            status: 504
        });
    });

    test('throws AiProviderError with code:unknown and retryable:false on generic network error', async () => {
        const networkError = new Error('socket hang up');
        await expect(
            executeJsonRequest({
                ...BASE_OPTIONS,
                fetchImpl: makeThrowingFetch(networkError)
            })
        ).rejects.toMatchObject({
            name: 'AiProviderError',
            code: 'unknown',
            retryable: false
        });
    });

    test('throws AiProviderError that is an instance of AiProviderError on 401', async () => {
        let caughtError: unknown;
        try {
            await executeJsonRequest({ ...BASE_OPTIONS, fetchImpl: makeFetch(401) });
        } catch (err) {
            caughtError = err;
        }
        expect(caughtError).toBeInstanceOf(AiProviderError);
    });
});
