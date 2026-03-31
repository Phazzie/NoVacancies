import { test, expect } from '@playwright/test';
import { MemoryRateLimitStore } from '../../../src/lib/server/rateLimit/memoryStore';

test.describe('MemoryRateLimitStore', () => {
	test('allows requests up to maxRequests then blocks', () => {
		const store = new MemoryRateLimitStore({ maxRequests: 2, windowMs: 60_000 });

		expect(store.consume('1.2.3.4', 1000).allowed).toBe(true);
		expect(store.consume('1.2.3.4', 1500).allowed).toBe(true);

		const blocked = store.consume('1.2.3.4', 2000);
		expect(blocked.allowed).toBe(false);
		expect(blocked.retryAfterSeconds).toBe(59);
	});

	test('tracks counters independently per key', () => {
		const store = new MemoryRateLimitStore({ maxRequests: 1, windowMs: 60_000 });

		expect(store.consume('ip-a', 1000).allowed).toBe(true);
		expect(store.consume('ip-b', 1000).allowed).toBe(true);
		expect(store.consume('ip-a', 2000).allowed).toBe(false);
		expect(store.consume('ip-b', 2000).allowed).toBe(false);
	});
});
