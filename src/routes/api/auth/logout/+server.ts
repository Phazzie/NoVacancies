import { json, type RequestHandler } from '@sveltejs/kit';

import { SESSION_COOKIE_NAME } from '$lib/server/auth';

function useSecureCookies(url: URL): boolean {
	if (url.protocol === 'https:') return true;
	return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.NODE_ENV === 'production';
}

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
