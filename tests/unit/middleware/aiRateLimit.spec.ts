import { expect, test } from '@playwright/test';

import { aiRateLimit, resetAiRateLimitForTests } from '../../../src/lib/server/middleware/aiRateLimit';

function createEvent(pathname: string, ip = '198.51.100.7') {
	const request = new Request(`https://example.com${pathname}`);
	return {
		url: new URL(request.url),
		request,
		getClientAddress: () => ip
	} as any;
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
		} as any);

		expect(resolveCalls).toBe(1);
		expect(response.status).toBe(200);
	});

	test('allows up to 20 AI requests per IP per minute and blocks request 21', async () => {
		for (let i = 0; i < 20; i += 1) {
			const response = await aiRateLimit({
				event: createEvent('/api/story/opening'),
				resolve: async () => new Response('ok', { status: 200 })
			} as any);
			expect(response.status).toBe(200);
		}

		let resolveCalls = 0;
		const blockedResponse = await aiRateLimit({
			event: createEvent('/api/story/opening'),
			resolve: async () => {
				resolveCalls += 1;
				return new Response('should-not-run', { status: 200 });
			}
		} as any);

		expect(resolveCalls).toBe(0);
		expect(blockedResponse.status).toBe(429);
		expect(blockedResponse.headers.get('Retry-After')).toBe('60');
		await expect(blockedResponse.json()).resolves.toEqual({
			error: 'rate_limit',
			message: 'Too many requests. Please wait a moment before continuing.'
		});
	});

	test('tracks limits independently per IP', async () => {
		for (let i = 0; i < 20; i += 1) {
			await aiRateLimit({
				event: createEvent('/api/image', '198.51.100.9'),
				resolve: async () => new Response('ok', { status: 200 })
			} as any);
		}

		const freshIpResponse = await aiRateLimit({
			event: createEvent('/api/image', '198.51.100.10'),
			resolve: async () => new Response('ok', { status: 200 })
		} as any);
		expect(freshIpResponse.status).toBe(200);
	});
});
