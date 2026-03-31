import { expect, test } from '@playwright/test';
import { createAiRateLimitHandle } from '../../../src/lib/server/middleware/aiRateLimit';

function createEvent(pathname: string, ip = '127.0.0.1') {
	return {
		url: new URL(`https://example.test${pathname}`),
		getClientAddress: () => ip
	} as any;
}

test.describe('aiRateLimit middleware', () => {
	test('bypasses non-AI routes', async () => {
		let resolveCalls = 0;
		const handle = createAiRateLimitHandle({ max: 1, windowMs: 60_000 });

		const result = await handle({
			event: createEvent('/play'),
			resolve: async () => {
				resolveCalls += 1;
				return new Response('ok', { status: 200 });
			}
		} as any);

		expect(resolveCalls).toBe(1);
		expect(result.status).toBe(200);
	});

	test('allows requests within the limit and blocks when exceeded', async () => {
		let resolveCalls = 0;
		const handle = createAiRateLimitHandle({ max: 2, windowMs: 60_000 });

		const resolve = async () => {
			resolveCalls += 1;
			return new Response('ok', { status: 200 });
		};

		const first = await handle({ event: createEvent('/api/story/opening'), resolve } as any);
		const second = await handle({ event: createEvent('/api/story/opening'), resolve } as any);
		const third = await handle({ event: createEvent('/api/story/opening'), resolve } as any);

		expect(first.status).toBe(200);
		expect(second.status).toBe(200);
		expect(third.status).toBe(429);
		expect(resolveCalls).toBe(2);
		expect(third.headers.get('Retry-After')).toBe('60');
		expect(third.headers.get('Content-Type')).toContain('application/json');
		await expect(third.json()).resolves.toEqual({
			error: 'rate_limit',
			message: 'Too many requests. Please wait a moment before continuing.'
		});
	});

	test('tracks limits independently per client IP', async () => {
		const handle = createAiRateLimitHandle({ max: 1, windowMs: 60_000 });

		const firstIpFirst = await handle({
			event: createEvent('/api/image', '1.1.1.1'),
			resolve: async () => new Response('ok')
		} as any);
		const secondIpFirst = await handle({
			event: createEvent('/api/image', '2.2.2.2'),
			resolve: async () => new Response('ok')
		} as any);
		const firstIpSecond = await handle({
			event: createEvent('/api/image', '1.1.1.1'),
			resolve: async () => new Response('ok')
		} as any);

		expect(firstIpFirst.status).toBe(200);
		expect(secondIpFirst.status).toBe(200);
		expect(firstIpSecond.status).toBe(429);
	});

	test('resets counters when window expires', async () => {
		let now = 0;
		const handle = createAiRateLimitHandle({ max: 1, windowMs: 1000, now: () => now });
		const resolve = async () => new Response('ok', { status: 200 });

		const first = await handle({ event: createEvent('/api/story/next'), resolve } as any);
		const blocked = await handle({ event: createEvent('/api/story/next'), resolve } as any);

		now = 1001;
		const afterReset = await handle({ event: createEvent('/api/story/next'), resolve } as any);

		expect(first.status).toBe(200);
		expect(blocked.status).toBe(429);
		expect(afterReset.status).toBe(200);
		expect(blocked.headers.get('Retry-After')).toBe('1');
	});
});
