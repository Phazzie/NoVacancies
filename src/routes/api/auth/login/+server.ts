import { json, type RequestHandler } from '@sveltejs/kit';

import {
	BUILDER_ROLES,
	SESSION_COOKIE_NAME,
	SESSION_MAX_AGE_SECONDS,
	createSignedSessionCookieValue,
	isBuilderRole,
	getAuthSessionSecret,
	useSecureCookies,
	isDemoAuthEnabled
} from '$lib/server/auth';

/**
 * Demo login endpoint.
 *
 * SECURITY: This endpoint MUST NOT trust any identity supplied by the client. The
 * server is the sole source of truth for `userId` — even in demo mode. A previous
 * iteration of this handler accepted a `userId` from the request body and embedded
 * it directly into the signed session cookie, which allowed any client to claim any
 * identity (including impersonating other demo users) by simply changing the body
 * payload. We now ignore any caller-supplied `userId` entirely and mint a fresh
 * server-generated identifier via `crypto.randomUUID()`.
 *
 * The endpoint is additionally gated behind `DEMO_AUTH_ENABLED=1`, so in production
 * (where that flag is unset) the route returns 403 before reading the body at all.
 */
export const POST: RequestHandler = async ({ request, cookies, url }) => {
	if (!isDemoAuthEnabled()) {
		return json(
			{
				error: {
					code: 'demo_auth_disabled',
					message: 'Demo authentication is not enabled. Set DEMO_AUTH_ENABLED=1 to use this endpoint.'
				}
			},
			{ status: 403 }
		);
	}

	// Only `role` is read from the body. Any client-supplied `userId` is intentionally
	// ignored — see the SECURITY note above.
	const payload = (await request.json().catch(() => ({}))) as {
		role?: string;
	};

	const role = typeof payload.role === 'string' ? payload.role.trim() : '';

	if (!isBuilderRole(role)) {
		return json(
			{
				error: {
					code: 'invalid_role',
					message: `role must be one of: ${BUILDER_ROLES.join(', ')}.`
				}
			},
			{ status: 400 }
		);
	}

	const secret = getAuthSessionSecret();
	if (!secret) {
		return json(
			{ error: { code: 'auth_not_configured', message: 'AUTH_SESSION_SECRET is not configured.' } },
			{ status: 503 }
		);
	}

	// Server-side identity generation. Never derive userId from caller input.
	const userId = crypto.randomUUID();

	const value = await createSignedSessionCookieValue({ userId, role }, secret);
	cookies.set(SESSION_COOKIE_NAME, value, {
		httpOnly: true,
		secure: useSecureCookies(url),
		sameSite: 'lax',
		path: '/',
		maxAge: SESSION_MAX_AGE_SECONDS
	});

	return json({ ok: true, user: { userId, role } });
};
