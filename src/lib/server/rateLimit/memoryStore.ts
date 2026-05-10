/**
 * In-memory rate-limit store.
 *
 * Uses a plain Map — no external deps required.  Suitable for local
 * development and single-instance deployments; not shared across
 * serverless replicas (use RedisRateLimitStore in production).
 *
 * Stale entries are pruned lazily on `reset` or on the next `increment`
 * call for the same key once its window has expired.
 */
import type { RateLimitStore, RateLimitEntry } from './store';

interface WindowEntry {
	count: number;
	resetAt: number; // epoch ms
}

export class MemoryRateLimitStore implements RateLimitStore {
	private readonly map = new Map<string, WindowEntry>();

	async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
		const now = Date.now();
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

	async reset(key: string): Promise<void> {
		this.map.delete(key);
	}
}
