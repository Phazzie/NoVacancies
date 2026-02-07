import { json, type RequestHandler } from '@sveltejs/kit';
import { asRouteError, buildNextInput, resolveTextScene } from '$lib/server/ai/routeHelpers';

export const POST: RequestHandler = async (event) => {
	try {
		const payload = (await event.request.json().catch(() => ({}))) as {
			currentSceneId?: string;
			choiceId?: string;
			gameState?: import('$lib/contracts').GameState;
			narrativeContext?: import('$lib/contracts').NarrativeContext | null;
		};
		const input = buildNextInput(payload);
		const scene = await resolveTextScene(input, 'next');
		return json({ scene });
	} catch (error) {
		return asRouteError(event, error);
	}
};

