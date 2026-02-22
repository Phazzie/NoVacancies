import { json, type RequestHandler } from '@sveltejs/kit';
import { NO_VACANCIES_STORY } from '$lib/data/defaultStory';
import { asRouteError } from '$lib/server/ai/routeHelpers';

export const POST: RequestHandler = async (event) => {
	try {
		const payload = (await event.request.json().catch(() => ({}))) as {
			storyId?: string;
		};
		// Future: load from DB based on payload.storyId
		const config = NO_VACANCIES_STORY;

		return json({ config });
	} catch (error) {
		return asRouteError(event, error);
	}
};
