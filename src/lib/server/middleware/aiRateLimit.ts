import type { Handle } from '@sveltejs/kit';
import { createRateLimitStore, RATE_LIMIT_DEFAULTS } from '$lib/server/rateLimit/factory';
import type { RateLimitStore } from '$lib/server/rateLimit/types';

const AI_ROUTE_PREFIXES = [
	'/api/story/opening',
	'/api/story/next',
	'/api/image',
	'/api/builder/generate-draft',
	'/api/builder/evaluate-prose'
];

let store: RateLimitStore = createRateLimitStore(RATE_LIMIT_DEFAULTS);

function isAiRoute(path: string): boolean {
	return AI_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export const aiRateLimit: Handle = async ({ event, resolve }) => {
	if (isAiRoute(event.url.pathname)) {
		const ip = event.getClientAddress();
		const decision = store.consume(ip);
		if (!decision.allowed) {
			const body = JSON.stringify({
				error: 'rate_limit',
				message: 'Too many requests. Please wait a moment before continuing.'
			});

			return new Response(body, {
				status: 429,
				headers: {
					'Content-Type': 'application/json',
					'Retry-After': String(decision.retryAfterSeconds)
				}
			});
		}
	}

	return resolve(event);
};

export function resetAiRateLimitForTests(): void {
	store = createRateLimitStore(RATE_LIMIT_DEFAULTS);
}
