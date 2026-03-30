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
const ipCounters = new Map<string, { count: number; resetAt: number }>();

function isAllowed(ip: string): boolean {
	const now = Date.now();
	const entry = ipCounters.get(ip);
	if (!entry || now >= entry.resetAt) {
		ipCounters.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
		return true;
	}
	if (entry.count >= RATE_LIMIT_MAX) return false;
	entry.count += 1;
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
			headers: { 'Content-Type': 'application/json', 'Retry-After': '60' }
		});
	}

	return resolve(event);
};

export function resetAiRateLimitForTests(): void {
	ipCounters.clear();
}
