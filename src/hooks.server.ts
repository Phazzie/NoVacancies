import type { Handle } from '@sveltejs/kit';

const BASELINE_SECURITY_HEADERS: Record<string, string> = {
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
	'Cross-Origin-Opener-Policy': 'same-origin',
	'Content-Security-Policy':
		"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
};

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	for (const [name, value] of Object.entries(BASELINE_SECURITY_HEADERS)) {
		if (!response.headers.has(name)) {
			response.headers.set(name, value);
		}
	}

	const forwardedProto = event.request.headers.get('x-forwarded-proto');
	const isHttps = event.url.protocol === 'https:' || forwardedProto === 'https';
	if (isHttps && !response.headers.has('Strict-Transport-Security')) {
		response.headers.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
	}

	return response;
};
