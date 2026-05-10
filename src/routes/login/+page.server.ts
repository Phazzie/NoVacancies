import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	createSignedSessionCookieValue,
	getAuthSessionSecret,
	isDemoAuthEnabled,
	SESSION_COOKIE_NAME,
	SESSION_MAX_AGE_SECONDS,
	useSecureCookies
} from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Already authenticated — send them where they were headed (or builder).
	if (locals.sessionUser) {
		const next = url.searchParams.get('next') ?? '/builder';
		redirect(302, next);
	}
	return { demoEnabled: isDemoAuthEnabled() };
};

export const actions: Actions = {
	demoSignIn: async ({ cookies, url }) => {
		if (!isDemoAuthEnabled()) {
			return fail(403, { error: 'Demo authentication is not enabled on this instance.' });
		}

		const secret = getAuthSessionSecret();
		if (!secret) {
			return fail(500, { error: 'Authentication is not configured. Set AUTH_SESSION_SECRET.' });
		}

		const cookieValue = await createSignedSessionCookieValue(
			{ userId: 'demo-author', role: 'author' },
			secret
		);

		cookies.set(SESSION_COOKIE_NAME, cookieValue, {
			path: '/',
			httpOnly: true,
			secure: useSecureCookies(url),
			sameSite: 'lax',
			maxAge: SESSION_MAX_AGE_SECONDS
		});

		const next = url.searchParams.get('next') ?? '/builder';
		redirect(302, next);
	}
};
