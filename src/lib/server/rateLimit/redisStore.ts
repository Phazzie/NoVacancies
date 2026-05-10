/**
 * Redis-backed rate-limit store (ioredis).
 *
 * Uses a Lua script so each `increment` is a single atomic round-trip:
 *   1. INCR the key
 *   2. On the first increment (count === 1) set PEXPIRE for the window
 *   3. Return {count, pttl}
 *
 * Falls back gracefully: if Redis is unreachable the caller receives an
 * Error and the middleware treats it as "fail open" (request allowed).
 *
 * Env var:   REDIS_URL — ioredis connection string, e.g.
 *            rediss://default:password@host:6380 (TLS)
 *            redis://localhost:6379           (local, plain)
 */
import Redis from 'ioredis';
import type { RateLimitStore, RateLimitEntry } from './store';

// ─── Lua script ───────────────────────────────────────────────────────────────

/**
 * Atomically:
 *   KEYS[1] = rate-limit key
 *   ARGV[1] = window in milliseconds
 * Returns: [count (integer), pttl (integer)]
 */
const INCR_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local pttl = redis.call('PTTL', KEYS[1])
return {count, pttl}
`;

// ─── Store ────────────────────────────────────────────────────────────────────

export class RedisRateLimitStore implements RateLimitStore {
	private readonly client: Redis;

	constructor(redisUrl: string) {
		this.client = new Redis(redisUrl, {
			lazyConnect: true,
			enableOfflineQueue: false,
			maxRetriesPerRequest: 1,
			connectTimeout: 2_000,
			commandTimeout: 1_000
		});

		this.client.on('error', (err: Error) => {
			// Log but do not throw — middleware catches errors and fails open.
			console.error('[ratelimit:redis]', err.message);
		});
	}

	async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
		const redisKey = `nv:rl:${key}`;

		const result = (await this.client.eval(
			INCR_SCRIPT,
			1,
			redisKey,
			String(windowMs)
		)) as [number, number];

		const [count, pttl] = result;
		// pttl should always be > 0 after the Lua script, but guard against
		// unexpected -1 (no TTL) or -2 (key missing) by re-using windowMs.
		const resetAt = Date.now() + (pttl > 0 ? pttl : windowMs);

		return { count, resetAt };
	}

	async reset(key: string): Promise<void> {
		await this.client.del(`nv:rl:${key}`);
	}

	/** Gracefully close the connection (useful in test teardown). */
	async quit(): Promise<void> {
		await this.client.quit();
	}
}
