/**
 * Rate-limit store factory.
 *
 * Returns a Redis-backed store when REDIS_URL is set; falls back to the
 * in-memory store otherwise.  The instance is cached for the process
 * lifetime so we only create one Redis connection per deployment.
 *
 * Dynamic import of `redisStore` keeps ioredis out of the initial bundle
 * on environments where REDIS_URL is absent.
 */
import type { RateLimitStore } from './store';
import { MemoryRateLimitStore } from './memoryStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRuntimeEnv(key: string): string | undefined {
	const g = globalThis as { process?: { env?: Record<string, string | undefined> } };
	return g.process?.env?.[key];
}

// ─── Factory ──────────────────────────────────────────────────────────────────

let cached: RateLimitStore | null = null;

/**
 * Returns the singleton RateLimitStore for this process.
 * Safe to call concurrently — the async initialisation path is idempotent
 * (worst case two stores are created; only one is kept).
 */
export async function getRateLimitStore(): Promise<RateLimitStore> {
	if (cached) return cached;

	const redisUrl = getRuntimeEnv('REDIS_URL');

	if (redisUrl) {
		try {
			const { RedisRateLimitStore } = await import('./redisStore');
			cached = new RedisRateLimitStore(redisUrl);
			console.info('[ratelimit] store: Redis');
		} catch (err) {
			console.warn(
				'[ratelimit] Redis import failed — falling back to memory store:',
				err instanceof Error ? err.message : err
			);
			cached = new MemoryRateLimitStore();
		}
	} else {
		cached = new MemoryRateLimitStore();
		console.info('[ratelimit] store: in-memory (REDIS_URL not set)');
	}

	return cached;
}

/** Reset the cached store (test teardown). */
export function resetRateLimitStore(): void {
	cached = null;
}
