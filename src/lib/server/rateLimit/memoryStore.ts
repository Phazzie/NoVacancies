/**
 * In-memory rate-limit store.
 *
 * Uses a plain Map — no external deps required.  Suitable for local
 * development and single-instance deployments; not shared across
 * serverless replicas (use RedisRateLimitStore in production).
 *
 * Expired entries are swept lazily once the map grows past GC_THRESHOLD so a
 * long-lived instance hit by many distinct IPs doesn't grow without bound.
 */
import type { RateLimitStore, RateLimitEntry } from './store';

interface WindowEntry {
	count: number;
	resetAt: number; // epoch ms
}

const GC_THRESHOLD = 500;
// Unexpired entries can't be swept, so without a time gate every request above the
// threshold would rescan the whole map.
const GC_INTERVAL_MS = 5_000;

export class MemoryRateLimitStore implements RateLimitStore {
	private readonly map = new Map<string, WindowEntry>();
	private lastSweepAt = Number.NEGATIVE_INFINITY;

	async increment(key: string, windowMs: number, now: number = Date.now()): Promise<RateLimitEntry> {
		if (this.map.size > GC_THRESHOLD && now - this.lastSweepAt >= GC_INTERVAL_MS) {
			this.lastSweepAt = now;
			this.sweep(now);
		}
		const existing = this.map.get(key);

		if (!existing || now >= existing.resetAt) {
			// Start a new window.
			const entry: WindowEntry = { count: 1, resetAt: now + windowMs };
			this.map.set(key, entry);
			return { count: 1, resetAt: entry.resetAt };
		}

		existing.count += 1;
		return { count: existing.count, resetAt: existing.resetAt };
	}

	get size(): number {
		return this.map.size;
	}

	private sweep(now: number): void {
		for (const [key, entry] of this.map) {
			if (now >= entry.resetAt) this.map.delete(key);
		}
	}

	async reset(key: string): Promise<void> {
		this.map.delete(key);
	}
}
