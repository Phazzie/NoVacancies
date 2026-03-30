import type { RateLimitCounter, RateLimitStore } from './types';

export class MemoryRateLimitStore implements RateLimitStore {
	private readonly counters = new Map<string, RateLimitCounter>();

	increment(key: string, options: { now: number; windowMs: number }): RateLimitCounter {
		const { now, windowMs } = options;
		const entry = this.counters.get(key);

		if (!entry || now >= entry.resetAt) {
			const next = { count: 1, resetAt: now + windowMs };
			this.counters.set(key, next);
			return { ...next };
		}

		entry.count += 1;
		return { ...entry };
	}
}
