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

	test('lazy GC prunes expired entries when map exceeds threshold', () => {
		// windowMs=50 so entries expire after 50ms from their creation time.
		const store = new MemoryRateLimitStore({ maxRequests: 20, windowMs: 50 });

		// Seed 600 unique keys at t=0.
		for (let i = 0; i < 600; i += 1) {
			store.consume(`key_${i}`, 0);
		}

		// At t=100 all 600 entries are expired. Trigger GC via a new key.
		store.consume('trigger', 100);

		// The map should have shrunk: only the 'trigger' entry should remain.
		const counters = (store as unknown as { counters: Map<string, unknown> }).counters;
		expect(counters.size).toBeLessThan(600);
		expect(counters.has('trigger')).toBe(true);
	});
});
