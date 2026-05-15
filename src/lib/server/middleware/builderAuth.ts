import { redirect, type Handle } from '@sveltejs/kit';
import { authErrorResponse, BUILDER_ROLES, getSessionUser, isBuilderRole } from '$lib/server/auth';
import { emitAiServerTelemetry } from '$lib/server/ai/telemetry';

function isBuilderProtectedRoute(path: string): boolean {
	if (path === '/builder' || path.startsWith('/builder/')) return true;
	return path.startsWith('/api/builder/');
}

/**
 * Returns true when the request is an XHR / API call that expects a JSON response.
 * These requests should receive structured JSON error bodies (401/403) rather than a
 * redirect to the login page.
 */
function expectsJsonResponse(event: Parameters<Handle>[0]['event']): boolean {
	// Requests to /api/* are always JSON consumers.
	if (event.url.pathname.startsWith('/api/')) return true;
	// Explicit content-type negotiation. Node/test fetches send */*, not the
	// browser navigation HTML accept header, so keep them on the JSON 401 path.
	const accept = event.request.headers.get('accept') ?? '';
	if (accept.includes('application/json')) return true;
	if (!accept.includes('text/html')) return true;
	// Conventional XHR sentinel.
	if (event.request.headers.get('x-requested-with') === 'XMLHttpRequest') return true;
	// SvelteKit's own data-fetching requests include this header.
	if (event.request.headers.get('x-sveltekit-action') !== null) return true;
	return false;
}

function emitBuilderAccessDenied(
	path: string,
	reason: 'auth_required' | 'insufficient_role',
	userId: string | null
) {
	emitAiServerTelemetry('builder_access_denied', {
		action: 'builder_access_denied',
		reason,
		path,
		userId
	});
}

export const builderAuth: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	const sessionUser = await getSessionUser(event);
	event.locals.sessionUser = sessionUser;

	if (isBuilderProtectedRoute(path)) {
		if (!sessionUser) {
			emitBuilderAccessDenied(path, 'auth_required', null);

			// For browser navigation (accepts HTML), redirect to the login page so the
			// user sees a friendly form instead of a raw JSON error.
			if (!expectsJsonResponse(event)) {
				const loginUrl = `/login?next=${encodeURIComponent(path)}`;
				redirect(302, loginUrl);
			}

			return authErrorResponse({
				status: 401,
				code: 'auth_required',
				message: 'You must be signed in to access builder tools.',
				path
			});
		}

		if (!isBuilderRole(sessionUser.role)) {
			emitBuilderAccessDenied(path, 'insufficient_role', sessionUser.userId);
			return authErrorResponse({
				status: 403,
				code: 'insufficient_role',
				message: `Builder access requires one of: ${BUILDER_ROLES.join(', ')}.`,
				path
			});
		}
	}

	return resolve(event);
};
