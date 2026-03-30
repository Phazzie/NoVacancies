import { test, expect } from '@playwright/test';

import { MemoryRateLimitStore } from '../../../src/lib/server/rateLimit/memoryStore';
import { createRateLimitStore } from '../../../src/lib/server/rateLimit/factory';

const RATE_LIMIT_MAX = 20;
const WINDOW_MS = 60_000;

function isAllowedAt(store: MemoryRateLimitStore, ip: string, now: number): boolean {
	const { count } = store.increment(ip, { now, windowMs: WINDOW_MS });
	return count <= RATE_LIMIT_MAX;
}

test.describe('rate-limit window behavior', () => {
	test('allows 20 requests and blocks the 21st request in the same window', () => {
		const store = new MemoryRateLimitStore();

		for (let i = 0; i < RATE_LIMIT_MAX; i += 1) {
			expect(isAllowedAt(store, 'ip:1', 1_000)).toBe(true);
		}

		expect(isAllowedAt(store, 'ip:1', 1_000)).toBe(false);
	});

	test('allows requests again when the window resets', () => {
		const store = new MemoryRateLimitStore();

		for (let i = 0; i < RATE_LIMIT_MAX + 1; i += 1) {
			isAllowedAt(store, 'ip:1', 1_000);
		}

		expect(isAllowedAt(store, 'ip:1', 61_000)).toBe(true);
	});

	test('uses memory store by default and for unknown env values', () => {
		const defaultStore = createRateLimitStore({});
		const fallbackStore = createRateLimitStore({ RATE_LIMIT_STORE: 'not-a-store' });

		expect(defaultStore).toBeInstanceOf(MemoryRateLimitStore);
		expect(fallbackStore).toBeInstanceOf(MemoryRateLimitStore);
	});
});
