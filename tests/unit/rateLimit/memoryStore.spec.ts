import { test, expect } from '@playwright/test';

import { MemoryRateLimitStore } from '../../../src/lib/server/rateLimit/memoryStore';

test.describe('MemoryRateLimitStore', () => {
	test('starts at count 1 and increments within a window', () => {
		const store = new MemoryRateLimitStore();

		const first = store.increment('ip:1', { now: 1_000, windowMs: 60_000 });
		const second = store.increment('ip:1', { now: 2_000, windowMs: 60_000 });

		expect(first.count).toBe(1);
		expect(second.count).toBe(2);
		expect(second.resetAt).toBe(first.resetAt);
	});

	test('resets after window expiry', () => {
		const store = new MemoryRateLimitStore();

		const first = store.increment('ip:1', { now: 10_000, windowMs: 60_000 });
		const reset = store.increment('ip:1', { now: first.resetAt, windowMs: 60_000 });

		expect(reset.count).toBe(1);
		expect(reset.resetAt).toBe(first.resetAt + 60_000);
	});

	test('tracks keys independently', () => {
		const store = new MemoryRateLimitStore();

		store.increment('ip:1', { now: 10_000, windowMs: 60_000 });
		const otherKey = store.increment('ip:2', { now: 11_000, windowMs: 60_000 });

		expect(otherKey.count).toBe(1);
	});
});
