import { json, type RequestHandler } from '@sveltejs/kit';
import { asRouteError, buildNextInput, resolveTextScene } from '$lib/server/ai/routeHelpers';
import type { GameState, NarrativeContext } from '$lib/contracts';

export const POST: RequestHandler = async (event) => {
	try {
		const payload = (await event.request.json().catch(() => ({}))) as {
			currentSceneId?: string;
			choiceId?: string;
			gameState?: GameState;
			narrativeContext?: NarrativeContext | null;
		};
		const input = buildNextInput(payload);
		const scene = await resolveTextScene(input, 'next');
		return json({ scene });
	} catch (error) {
		return asRouteError(event, error);
	}
};

