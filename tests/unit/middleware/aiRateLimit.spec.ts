import { expect, test } from '@playwright/test';

import {
    aiRateLimit,
    resetAiRateLimitForTests
} from '../../../src/lib/server/middleware/aiRateLimit';

type HandleInput = Parameters<typeof aiRateLimit>[0];

function createEvent(pathname: string, ip = '198.51.100.7', method = 'POST'): HandleInput['event'] {
    const request = new Request(`https://example.com${pathname}`, { method });
    // Only the fields the middleware reads; the full RequestEvent is not needed here.
    return {
        url: new URL(request.url),
        request,
        locals: {},
        getClientAddress: () => ip
    } as unknown as HandleInput['event'];
}

test.beforeEach(() => {
    resetAiRateLimitForTests();
});

test.describe('aiRateLimit middleware', () => {
    test('passes through non-AI routes', async () => {
        let resolveCalls = 0;
        const response = await aiRateLimit({
            event: createEvent('/api/health'),
            resolve: async () => {
                resolveCalls += 1;
                return new Response('ok', { status: 200 });
            }
        } as HandleInput);

        expect(resolveCalls).toBe(1);
        expect(response.status).toBe(200);
    });

    test('allows up to 20 AI requests per IP per minute and blocks request 21', async () => {
        for (let i = 0; i < 20; i += 1) {
            const response = await aiRateLimit({
                event: createEvent('/api/story/opening'),
                resolve: async () => new Response('ok', { status: 200 })
            } as HandleInput);
            expect(response.status).toBe(200);
        }

        let resolveCalls = 0;
        const blockedResponse = await aiRateLimit({
            event: createEvent('/api/story/opening'),
            resolve: async () => {
                resolveCalls += 1;
                return new Response('should-not-run', { status: 200 });
            }
        } as HandleInput);

        expect(resolveCalls).toBe(0);
        expect(blockedResponse.status).toBe(429);
        expect(blockedResponse.headers.get('Retry-After')).toBe('60');
        await expect(blockedResponse.json()).resolves.toMatchObject({
            code: 'rate_limit',
            status: 429,
            retryAfterSeconds: 60,
            error: 'Too many requests. Please wait a moment before continuing.'
        });
    });

    test('tracks limits independently per IP', async () => {
        for (let i = 0; i < 20; i += 1) {
            await aiRateLimit({
                event: createEvent('/api/image', '198.51.100.9'),
                resolve: async () => new Response('ok', { status: 200 })
            } as HandleInput);
        }

        const freshIpResponse = await aiRateLimit({
            event: createEvent('/api/image', '198.51.100.10'),
            resolve: async () => new Response('ok', { status: 200 })
        } as HandleInput);
        expect(freshIpResponse.status).toBe(200);
    });

    test('guards builder generation routes', async () => {
        for (let i = 0; i < 20; i += 1) {
            await aiRateLimit({
                event: createEvent('/api/builder/generate-draft', '198.51.100.11'),
                resolve: async () => new Response('ok', { status: 200 })
            } as HandleInput);
        }

        const blocked = await aiRateLimit({
            event: createEvent('/api/builder/remix', '198.51.100.11'),
            resolve: async () => new Response('ok', { status: 200 })
        } as HandleInput);
        expect(blocked.status).toBe(429);
    });

    test('a handler failure is not retried', async () => {
        let resolveCalls = 0;
        await expect(
            aiRateLimit({
                event: createEvent('/api/builder/generate-draft', '198.51.100.12'),
                resolve: async () => {
                    resolveCalls += 1;
                    throw new Error('provider exploded');
                }
            } as HandleInput)
        ).rejects.toThrow('provider exploded');
        expect(resolveCalls).toBe(1);
    });

    test('image status polling does not consume quota; generate POST does', async () => {
        for (let i = 0; i < 25; i += 1) {
            const res = await aiRateLimit({
                event: createEvent('/api/image', '198.51.100.13', 'GET'),
                resolve: async () => new Response('ok', { status: 200 })
            } as HandleInput);
            expect(res.status).toBe(200);
        }
        const post = await aiRateLimit({
            event: createEvent('/api/image', '198.51.100.13', 'POST'),
            resolve: async () => new Response('ok', { status: 200 })
        } as HandleInput);
        expect(post.headers.get('X-RateLimit-Remaining')).toBe('19');
    });

    test('guards the readiness route, which can run a live provider probe', async () => {
        const res = await aiRateLimit({
            event: createEvent('/api/demo/readiness', '198.51.100.14', 'GET'),
            resolve: async () => new Response('ok', { status: 200 })
        } as HandleInput);
        expect(res.headers.get('X-RateLimit-Remaining')).toBe('19');
    });
});
