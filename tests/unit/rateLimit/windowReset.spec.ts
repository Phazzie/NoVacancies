import { test, expect } from '@playwright/test';
import { MemoryRateLimitStore } from '../../../src/lib/server/rateLimit/memoryStore';

test.describe('MemoryRateLimitStore window reset behavior', () => {
	test('resets count when the time window has elapsed', async () => {
		const store = new MemoryRateLimitStore();

		await store.increment('1.2.3.4', 60_000, 1000);
		await store.increment('1.2.3.4', 60_000, 2000);
		expect((await store.increment('1.2.3.4', 60_000, 3000)).count).toBe(3);

		const afterReset = await store.increment('1.2.3.4', 60_000, 61_000);
		expect(afterReset.count).toBe(1);
		expect(afterReset.resetAt).toBe(121_000);
	});

	test('treats boundary timestamp (now === resetAt) as reset', async () => {
		const store = new MemoryRateLimitStore();

		await store.increment('1.2.3.4', 60_000, 1000);
		expect((await store.increment('1.2.3.4', 60_000, 2000)).count).toBe(2);

		const atBoundary = await store.increment('1.2.3.4', 60_000, 61_000);
		expect(atBoundary.count).toBe(1);
	});
});
