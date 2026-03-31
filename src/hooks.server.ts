import type { Handle } from '@sveltejs/kit';
import { createRateLimitStore, RATE_LIMIT_DEFAULTS } from '$lib/server/rateLimit/factory';

const BASELINE_SECURITY_HEADERS: Record<string, string> = {
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
	'Cross-Origin-Opener-Policy': 'same-origin',
	'Content-Security-Policy':
		"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
};

// AI endpoints that call Grok and incur per-request cost.
const AI_ROUTE_PREFIXES = [
	'/api/story/opening',
	'/api/story/next',
	'/api/image',
	'/api/builder/generate-draft',
	'/api/builder/evaluate-prose'
];

const rateLimitStore = createRateLimitStore(RATE_LIMIT_DEFAULTS);

function applySecurityHeaders(response: Response, isHttps: boolean): void {
	for (const [name, value] of Object.entries(BASELINE_SECURITY_HEADERS)) {
		if (!response.headers.has(name)) {
			response.headers.set(name, value);
		}
	}
	if (isHttps && !response.headers.has('Strict-Transport-Security')) {
		response.headers.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	const forwardedProto = event.request.headers.get('x-forwarded-proto');
	const isHttps = event.url.protocol === 'https:' || forwardedProto === 'https';

	// Rate-limit AI endpoints before handing off to the route handler.
	if (AI_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix))) {
		const ip = event.getClientAddress();
		const decision = rateLimitStore.consume(ip);
		if (!decision.allowed) {
			const body = JSON.stringify({
				error: 'rate_limit',
				message: 'Too many requests. Please wait a moment before continuing.'
			});
			const response = new Response(body, {
				status: 429,
				headers: {
					'Content-Type': 'application/json',
					'Retry-After': String(decision.retryAfterSeconds)
				}
			});
			applySecurityHeaders(response, isHttps);
			return response;
		}
	}

	const response = await resolve(event);
	applySecurityHeaders(response, isHttps);
	return response;
};
