import type { LayoutServerLoad } from './$types';
import { isBuilderRole } from '$lib/server/auth';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		sessionUser: locals.sessionUser,
		// The image pipeline API is creator-only; pages use this to avoid calling it
		// (and surfacing a 401) for anonymous players.
		canUseCreatorTools: Boolean(locals.sessionUser && isBuilderRole(locals.sessionUser.role))
	};
};
