import type { Handle } from '@sveltejs/kit';
import { authErrorResponse, BUILDER_ROLES, getSessionUser, isBuilderRole } from '$lib/server/auth';
import { emitAiServerTelemetry } from '$lib/server/ai/telemetry';

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

// In-memory rate limiter: 20 AI requests per IP per minute.
//
// This works well for a single-server or low-concurrency deployment.
// On Vercel serverless each cold-start gets a fresh Map, so the limit is
// per-instance rather than globally enforced. For higher-traffic or
// multi-instance production use, replace with a distributed store
// (e.g. Vercel KV / Upstash Redis) using the same interface below.
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

function isBuilderProtectedRoute(path: string): boolean {
	if (path === '/builder' || path.startsWith('/builder/')) return true;
	return path.startsWith('/api/builder/');
}

function emitBuilderAccessDenied(path: string, reason: 'auth_required' | 'insufficient_role', userId: string | null) {
	emitAiServerTelemetry('builder_access_denied', {
		action: 'builder_access_denied',
		reason,
		path,
		userId
	});
}

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	const forwardedProto = event.request.headers.get('x-forwarded-proto');
	const isHttps = event.url.protocol === 'https:' || forwardedProto === 'https';

	const sessionUser = await getSessionUser(event);
	event.locals.sessionUser = sessionUser;

	if (isBuilderProtectedRoute(path)) {
		if (!sessionUser) {
			emitBuilderAccessDenied(path, 'auth_required', null);
			const response = authErrorResponse({
				status: 401,
				code: 'auth_required',
				message: 'You must be signed in to access builder tools.',
				path
			});
			applySecurityHeaders(response, isHttps);
			return response;
		}

		if (!isBuilderRole(sessionUser.role)) {
			emitBuilderAccessDenied(path, 'insufficient_role', sessionUser.userId);
			const response = authErrorResponse({
				status: 403,
				code: 'insufficient_role',
				message: `Builder access requires one of: ${BUILDER_ROLES.join(', ')}.`,
				path
			});
			applySecurityHeaders(response, isHttps);
			return response;
		}
	}

	// Rate-limit AI endpoints before handing off to the route handler.
	if (AI_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix))) {
		const ip = event.getClientAddress();
		if (!isAllowed(ip)) {
			const body = JSON.stringify({
				error: 'rate_limit',
				message: 'Too many requests. Please wait a moment before continuing.'
			});
			const response = new Response(body, {
				status: 429,
				headers: { 'Content-Type': 'application/json', 'Retry-After': '60' }
			});
			applySecurityHeaders(response, isHttps);
			return response;
		}
	}

	const response = await resolve(event);
	applySecurityHeaders(response, isHttps);
	return response;
};
