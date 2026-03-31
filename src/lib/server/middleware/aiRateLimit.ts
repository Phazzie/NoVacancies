import type { Handle } from '@sveltejs/kit';

export const AI_ROUTE_PREFIXES = [
	'/api/story/opening',
	'/api/story/next',
	'/api/image',
	'/api/builder/generate-draft',
	'/api/builder/evaluate-prose'
];

const DEFAULT_RATE_LIMIT_MAX = 20;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;

type CounterEntry = { count: number; resetAt: number };

type CreateAiRateLimitHandleOptions = {
	routePrefixes?: readonly string[];
	max?: number;
	windowMs?: number;
	now?: () => number;
};

export function createAiRateLimitHandle(options: CreateAiRateLimitHandleOptions = {}): Handle {
	const {
		routePrefixes = AI_ROUTE_PREFIXES,
		max = DEFAULT_RATE_LIMIT_MAX,
		windowMs = DEFAULT_RATE_LIMIT_WINDOW_MS,
		now = Date.now
	} = options;
	const ipCounters = new Map<string, CounterEntry>();

	const isAllowed = (ip: string): boolean => {
		const currentTime = now();
		const entry = ipCounters.get(ip);

		if (!entry || currentTime >= entry.resetAt) {
			ipCounters.set(ip, { count: 1, resetAt: currentTime + windowMs });
			return true;
		}

		if (entry.count >= max) {
			return false;
		}

		entry.count += 1;
		return true;
	};

	return async ({ event, resolve }) => {
		if (!routePrefixes.some((prefix) => event.url.pathname.startsWith(prefix))) {
			return resolve(event);
		}

		if (isAllowed(event.getClientAddress())) {
			return resolve(event);
		}

		const body = JSON.stringify({
			error: 'rate_limit',
			message: 'Too many requests. Please wait a moment before continuing.'
		});

		return new Response(body, {
			status: 429,
			headers: {
				'Content-Type': 'application/json',
				'Retry-After': String(Math.ceil(windowMs / 1000))
			}
		});
	};
}

export const aiRateLimit = createAiRateLimitHandle();
