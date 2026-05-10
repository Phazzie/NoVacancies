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

	const payload = (await request.json().catch(() => ({}))) as {
		userId?: string;
		role?: string;
	};

	const userId = typeof payload.userId === 'string' ? payload.userId.trim() : '';
	const role = typeof payload.role === 'string' ? payload.role.trim() : '';

	if (!userId) {
		return json({ error: { code: 'invalid_user', message: 'userId is required.' } }, { status: 400 });
	}

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
