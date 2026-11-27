import { test, expect } from '@playwright/test';
import { MemoryRateLimitStore } from '../../../src/lib/server/rateLimit/memoryStore';

test.describe('MemoryRateLimitStore', () => {
    test('counts requests within a window', async () => {
        const store = new MemoryRateLimitStore();

        expect((await store.increment('1.2.3.4', 60_000, 1000)).count).toBe(1);
        expect((await store.increment('1.2.3.4', 60_000, 1500)).count).toBe(2);

        const third = await store.increment('1.2.3.4', 60_000, 2000);
        expect(third.count).toBe(3);
        expect(third.resetAt).toBe(61_000);
    });

    test('tracks counters independently per key', async () => {
        const store = new MemoryRateLimitStore();

        expect((await store.increment('ip-a', 60_000, 1000)).count).toBe(1);
        expect((await store.increment('ip-b', 60_000, 1000)).count).toBe(1);
        expect((await store.increment('ip-a', 60_000, 2000)).count).toBe(2);
        expect((await store.increment('ip-b', 60_000, 2000)).count).toBe(2);
    });

    test('reset clears a key immediately', async () => {
        const store = new MemoryRateLimitStore();
        await store.increment('ip-a', 60_000, 1000);
        await store.increment('ip-a', 60_000, 1000);
        await store.reset('ip-a');
        expect((await store.increment('ip-a', 60_000, 1500)).count).toBe(1);
    });

    test('lazy GC prunes expired entries when map exceeds threshold', async () => {
        const store = new MemoryRateLimitStore();

        for (let i = 0; i < 600; i += 1) {
            await store.increment(`key_${i}`, 50, 0);
        }

        await store.increment('trigger', 50, 10_000);

        expect(store.size).toBe(1);
    });

    test('GC runs at most once per interval while the map stays large', async () => {
        const store = new MemoryRateLimitStore();
        for (let i = 0; i < 600; i += 1) {
            await store.increment(`live_${i}`, 60_000, 0);
        }
        // These expire quickly but are added right after a sweep, so they survive
        // until the next interval instead of triggering a full scan per request.
        for (let i = 0; i < 10; i += 1) {
            await store.increment(`short_${i}`, 10, 100);
        }
        await store.increment('probe', 60_000, 200);
        expect(store.size).toBe(611);

        await store.increment('probe-2', 60_000, 6_000);
        expect(store.size).toBe(602);
    });
});
