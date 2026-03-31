import { test, expect } from '@playwright/test';
import { MemoryRateLimitStore } from '../../../src/lib/server/rateLimit/memoryStore';

test.describe('MemoryRateLimitStore window reset behavior', () => {
	test('resets count when the time window has elapsed', () => {
		const store = new MemoryRateLimitStore({ maxRequests: 2, windowMs: 60_000 });

		expect(store.consume('1.2.3.4', 1000).allowed).toBe(true);
		expect(store.consume('1.2.3.4', 2000).allowed).toBe(true);
		expect(store.consume('1.2.3.4', 3000).allowed).toBe(false);

		const afterReset = store.consume('1.2.3.4', 61_000);
		expect(afterReset.allowed).toBe(true);
		expect(afterReset.retryAfterSeconds).toBe(60);
	});

	test('treats boundary timestamp (now === resetAt) as reset', () => {
		const store = new MemoryRateLimitStore({ maxRequests: 1, windowMs: 60_000 });

		expect(store.consume('1.2.3.4', 1000).allowed).toBe(true);
		expect(store.consume('1.2.3.4', 2000).allowed).toBe(false);

		const atBoundary = store.consume('1.2.3.4', 61_000);
		expect(atBoundary.allowed).toBe(true);
	});
});
