import type { Handle } from '@sveltejs/kit';
import { authErrorResponse, BUILDER_ROLES, getSessionUser, isBuilderRole } from '$lib/server/auth';
import { emitAiServerTelemetry } from '$lib/server/ai/telemetry';

function isBuilderProtectedRoute(path: string): boolean {
	if (path === '/builder' || path.startsWith('/builder/')) return true;
	return path.startsWith('/api/builder/');
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
