import type { Handle } from '@sveltejs/kit';

const BASELINE_SECURITY_HEADERS: Readonly<Record<string, string>> = Object.freeze({
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
	'Cross-Origin-Opener-Policy': 'same-origin',
	'Content-Security-Policy':
		"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
});

const HSTS_VALUE = 'max-age=15552000; includeSubDomains';

function isHttpsRequest(event: Parameters<Handle>[0]['event']): boolean {
	const forwardedProto = event.request.headers.get('x-forwarded-proto');
	return event.url.protocol === 'https:' || forwardedProto?.toLowerCase() === 'https';
}

export function applySecurityHeaders(response: Response, isHttps: boolean): void {
	for (const [name, value] of Object.entries(BASELINE_SECURITY_HEADERS)) {
		if (!response.headers.has(name)) {
			response.headers.set(name, value);
		}
	}

	if (isHttps && !response.headers.has('Strict-Transport-Security')) {
		response.headers.set('Strict-Transport-Security', HSTS_VALUE);
	}
}

export const securityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	applySecurityHeaders(response, isHttpsRequest(event));
	return response;
};
