import { json, type RequestHandler } from '@sveltejs/kit';
import { asRouteError, buildOpeningInput, resolveTextScene } from '$lib/server/ai/routeHelpers';
import type { StoryConfig } from '$lib/contracts/story';

export const POST: RequestHandler = async (event) => {
	try {
		const payload = (await event.request.json().catch(() => ({}))) as {
			featureFlags?: unknown;
			storyId?: string;
			storyConfig?: StoryConfig;
		};
		const input = buildOpeningInput(payload);
		const scene = await resolveTextScene(input, 'opening');
		return json({ scene });
	} catch (error) {
		return asRouteError(event, error);
	}
};
