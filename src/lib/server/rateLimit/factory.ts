import { MemoryRateLimitStore } from './memoryStore';
import type { RateLimitOptions, RateLimitStore } from './types';

const DEFAULT_OPTIONS: RateLimitOptions = {
	maxRequests: 20,
	windowMs: 60_000
};

function getStoreKind(): string {
	return (process.env.RATE_LIMIT_STORE ?? 'memory').trim().toLowerCase();
}

export function createRateLimitStore(options: Partial<RateLimitOptions> = {}): RateLimitStore {
	const resolvedOptions: RateLimitOptions = {
		maxRequests: options.maxRequests ?? DEFAULT_OPTIONS.maxRequests,
		windowMs: options.windowMs ?? DEFAULT_OPTIONS.windowMs
	};

	switch (getStoreKind()) {
		case 'memory':
			return new MemoryRateLimitStore(resolvedOptions);
		case 'redis':
		case 'kv':
			throw new Error(
				`RATE_LIMIT_STORE=${getStoreKind()} is not implemented yet. Add a distributed RateLimitStore implementation in src/lib/server/rateLimit/ and wire it here.`
			);
		default:
			return new MemoryRateLimitStore(resolvedOptions);
	}
}

export { DEFAULT_OPTIONS as RATE_LIMIT_DEFAULTS };
