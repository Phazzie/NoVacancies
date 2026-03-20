import { json, type RequestHandler } from '@sveltejs/kit';
import { evaluateBuilderProse } from '$lib/server/ai/builder';

export const POST: RequestHandler = async ({ request }) => {
	const payload = (await request.json().catch(() => ({}))) as { prose?: string };
	const prose = typeof payload.prose === 'string' ? payload.prose : '';
	const result = await evaluateBuilderProse(prose);
	return json(result);
};
