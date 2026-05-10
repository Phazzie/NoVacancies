/**
 * AI rate-limit middleware (SvelteKit Handle).
 *
 * Guards routes under /api/ai/ with a per-user (or per-IP) request cap.
 * Backed by Redis when REDIS_URL is set; falls back to an in-memory
 * window counter for local dev / single-instance deployments.
 *
 * Config env vars (all optional, sensible defaults):
 *   AI_RATE_LIMIT_MAX        — max requests per window (default 20)
 *   AI_RATE_LIMIT_WINDOW_MS  — window size in ms      (default 60 000)
 *
 * On store error the middleware fails open so a Redis outage does not
 * take down the app.
 */
import type { Handle } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { getRateLimitStore } from '$lib/server/rateLimit/factory';

// ─── Config ───────────────────────────────────────────────────────────────────

function getRuntimeEnv(key: string): string | undefined {
	const g = globalThis as { process?: { env?: Record<string, string | undefined> } };
	return g.process?.env?.[key];
}

const MAX_REQUESTS = (() => {
	const v = parseInt(getRuntimeEnv('AI_RATE_LIMIT_MAX') ?? '', 10);
	return Number.isFinite(v) && v > 0 ? v : 20;
})();

const WINDOW_MS = (() => {
	const v = parseInt(getRuntimeEnv('AI_RATE_LIMIT_WINDOW_MS') ?? '', 10);
	return Number.isFinite(v) && v > 0 ? v : 60_000;
})();

// ─── Route matching ───────────────────────────────────────────────────────────

/** Only these URL prefixes are rate-limited. */
const GUARDED_PREFIXES = ['/api/ai'];

function isGuardedRoute(pathname: string): boolean {
	return GUARDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// ─── Key resolution ───────────────────────────────────────────────────────────

interface WithSessionUser {
	sessionUser?: { userId?: string } | null;
}

function getRateLimitKey(event: Parameters<Handle>[0]['event']): string {
	// Prefer the authenticated userId for stable per-user limits.
	const userId = (event.locals as WithSessionUser).sessionUser?.userId;
	if (userId) return `user:${userId}`;

	// Fall back to the originating IP.
	const forwarded = event.request.headers.get('x-forwarded-for');
	const ip = forwarded?.split(',')[0].trim() ?? 'unknown';
	return `ip:${ip}`;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export const aiRateLimit: Handle = async ({ event, resolve }) => {
	if (!isGuardedRoute(event.url.pathname)) {
		return resolve(event);
	}

	try {
		const store = await getRateLimitStore();
		const key = getRateLimitKey(event);
		const { count, resetAt } = await store.increment(key, WINDOW_MS);

		const remaining = Math.max(0, MAX_REQUESTS - count);
		const resetSec = Math.floor(resetAt / 1000);
		const retryAfterSec = Math.ceil((resetAt - Date.now()) / 1000);

		if (count > MAX_REQUESTS) {
			return json(
				{
					error: 'rate_limit_exceeded',
					message: 'Too many AI requests. Please wait before trying again.',
					retryAfter: retryAfterSec
				},
				{
					status: 429,
					headers: {
						'Retry-After': String(retryAfterSec),
						'X-RateLimit-Limit': String(MAX_REQUESTS),
						'X-RateLimit-Remaining': '0',
						'X-RateLimit-Reset': String(resetSec)
					}
				}
			);
		}

		const response = await resolve(event);

		// Surface rate-limit info on every successful response too.
		response.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS));
		response.headers.set('X-RateLimit-Remaining', String(remaining));
		response.headers.set('X-RateLimit-Reset', String(resetSec));

		return response;
	} catch (err) {
		// Store threw (Redis down, etc.) — fail open so the app stays up.
		console.error(
			'[ratelimit] store error — failing open:',
			err instanceof Error ? err.message : err
		);
		return resolve(event);
	}
};
