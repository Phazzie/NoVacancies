import { json, type RequestHandler } from '@sveltejs/kit';
import { asRouteError, resolveImagePayload } from '$lib/server/ai/routeHelpers';

export const POST: RequestHandler = async (event) => {
	try {
		const payload = (await event.request.json().catch(() => ({}))) as { prompt?: string };
		const prompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : '';
		if (!prompt) {
			return json({ error: 'prompt is required' }, { status: 400 });
		}
		const image = await resolveImagePayload(prompt);
		return json({ image: image ?? null });
	} catch (error) {
		return asRouteError(event, error);
	}
};

