import { json, type RequestHandler } from '@sveltejs/kit';

import { SESSION_COOKIE_NAME, useSecureCookies } from '$lib/server/auth';

export const POST: RequestHandler = async ({ cookies, url }) => {
	cookies.set(SESSION_COOKIE_NAME, '', {
		httpOnly: true,
		secure: useSecureCookies(url),
		sameSite: 'lax',
		path: '/',
		maxAge: 0
	});

	return json({ ok: true });
};
