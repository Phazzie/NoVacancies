import { json, type RequestHandler } from '@sveltejs/kit';
import { generateDraftFromPremise } from '$lib/server/ai/builder';

export const POST: RequestHandler = async ({ request }) => {
	const payload = (await request.json().catch(() => ({}))) as { premise?: string };
	const premise = typeof payload.premise === 'string' ? payload.premise : '';
	const result = await generateDraftFromPremise(premise);
	return json(result);
};
