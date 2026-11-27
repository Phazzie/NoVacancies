/**
 * AI rate-limit middleware (SvelteKit Handle).
 *
 * Guards every route that spends AI provider budget with a per-user (or per-IP) request cap.
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
import { getRateLimitStore, resetRateLimitStore } from '$lib/server/rateLimit/factory';

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

// Every route that calls the AI provider. Sprint 9 narrowed this to '/api/ai' only,
// which left story and builder generation unthrottled; keep this list in sync with
// any new provider-backed route.
const GUARDED_PREFIXES = [
	'/api/ai',
	'/api/story/opening',
	'/api/story/next',
	'/api/image',
	'/api/builder/generate-draft',
	'/api/builder/evaluate-prose',
	'/api/builder/evaluate-draft',
	'/api/builder/evaluate-voice',
	'/api/builder/alignment',
	'/api/builder/remix',
	// Runs a live provider probe when ENABLE_PROVIDER_PROBE=1.
	'/api/demo/readiness'
];

// Image status polling (GET) never calls the provider, so it must not eat the quota
// that the generate POST needs.
const POST_ONLY_PREFIXES = ['/api/image'];

function isGuardedRoute(pathname: string, method: string): boolean {
	if (POST_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && method !== 'POST') {
		return false;
	}
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

	// getClientAddress() is adapter-aware (trusted proxy handling on Vercel), unlike a raw
	// x-forwarded-for read, which any client can spoof to dodge the limit.
	let ip = 'unknown';
	try {
		ip = event.getClientAddress();
	} catch {
		// Some test/dev harnesses don't provide a client address.
	}
	return `ip:${ip}`;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export const aiRateLimit: Handle = async ({ event, resolve }) => {
	if (!isGuardedRoute(event.url.pathname, event.request.method)) {
		return resolve(event);
	}

	let count: number;
	let resetAt: number;
	try {
		const store = await getRateLimitStore();
		({ count, resetAt } = await store.increment(getRateLimitKey(event), WINDOW_MS));
	} catch (err) {
		// Store threw (Redis down, etc.) — fail open so the app stays up. Only store errors
		// land here: retrying resolve() after a handler failure would run generation twice.
		console.error(
			'[ratelimit] store error — failing open:',
			err instanceof Error ? err.message : err
		);
		return resolve(event);
	}

	const remaining = Math.max(0, MAX_REQUESTS - count);
	const resetSec = Math.floor(resetAt / 1000);
	const retryAfterSec = Math.ceil((resetAt - Date.now()) / 1000);

	if (count > MAX_REQUESTS) {
		return json(
			{
				// Same shape as routeHelpers' AI errors so storyService maps it to the
				// "wait and retry" message instead of a generic failure.
				error: 'Too many requests. Please wait a moment before continuing.',
				code: 'rate_limit',
				status: 429,
				retryAfterSeconds: retryAfterSec
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
};

export function resetAiRateLimitForTests(): void {
	resetRateLimitStore();
}
