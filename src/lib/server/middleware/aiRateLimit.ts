import type { Handle } from '@sveltejs/kit';

const AI_ROUTE_PREFIXES = [
	'/api/story/opening',
	'/api/story/next',
	'/api/image',
	'/api/builder/generate-draft',
	'/api/builder/evaluate-prose'
];

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

/**
 * NOTE: This is an in-memory, per-instance rate limiter. In serverless / multi-instance
 * deployments each process keeps its own counter map, so the effective limit is
 * per-instance rather than global. For production use consider a distributed store
 * (e.g. Redis or Cloudflare Durable Objects) to enforce a single global limit.
 */
const ipCounters = new Map<string, { count: number; resetAt: number }>();

function isAllowed(ip: string): boolean {
	const now = Date.now();

	// Opportunistically prune expired entries to prevent unbounded memory growth
	for (const [key, value] of ipCounters) {
		if (now >= value.resetAt) {
			ipCounters.delete(key);
		}
	}

	const entry = ipCounters.get(ip);
	if (!entry || now >= entry.resetAt) {
		ipCounters.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
		return true;
	}

	// Increment first, then check — avoids a race where concurrent requests
	// near the limit all pass the check before any of them increments.
	entry.count += 1;
	if (entry.count > RATE_LIMIT_MAX) return false;
	return true;
}

function isAiRoute(path: string): boolean {
	return AI_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export const aiRateLimit: Handle = async ({ event, resolve }) => {
	if (isAiRoute(event.url.pathname) && !isAllowed(event.getClientAddress())) {
		const body = JSON.stringify({
			error: 'rate_limit',
			message: 'Too many requests. Please wait a moment before continuing.'
		});

		return new Response(body, {
			status: 429,
			headers: {
				'Content-Type': 'application/json',
				'Retry-After': String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000))
			}
		});
	}

	return resolve(event);
};

export function resetAiRateLimitForTests(): void {
	ipCounters.clear();
}
