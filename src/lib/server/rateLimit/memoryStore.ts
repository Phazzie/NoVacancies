import type { RateLimitDecision, RateLimitOptions, RateLimitStore } from './types';

type CounterEntry = {
	count: number;
	resetAt: number;
};

const GC_THRESHOLD = 500;

export class MemoryRateLimitStore implements RateLimitStore {
	private readonly counters = new Map<string, CounterEntry>();

	constructor(private readonly options: RateLimitOptions) {}

	consume(key: string, now = Date.now()): RateLimitDecision {
		const current = this.counters.get(key);

		if (!current || now >= current.resetAt) {
			// Lazy GC: only when the map is large enough to be worth sweeping.
			if (this.counters.size >= GC_THRESHOLD) {
				for (const [k, entry] of this.counters) {
					if (now >= entry.resetAt) {
						this.counters.delete(k);
					}
				}
			}
			this.counters.set(key, {
				count: 1,
				resetAt: now + this.options.windowMs
			});
			return {
				allowed: true,
				retryAfterSeconds: Math.ceil(this.options.windowMs / 1000)
			};
		}

		if (current.count >= this.options.maxRequests) {
			return {
				allowed: false,
				retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
			};
		}

		current.count += 1;
		return {
			allowed: true,
			retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
		};
	}
}
