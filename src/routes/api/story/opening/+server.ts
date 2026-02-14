import { json, type RequestHandler } from '@sveltejs/kit';
import { asRouteError, buildOpeningInput, resolveTextScene } from '$lib/server/ai/routeHelpers';

export const POST: RequestHandler = async (event) => {
	try {
		await event.request.json().catch(() => ({}));
		const input = buildOpeningInput();
		const scene = await resolveTextScene(input, 'opening');
		return json({ scene });
	} catch (error) {
		return asRouteError(event, error);
	}
};
