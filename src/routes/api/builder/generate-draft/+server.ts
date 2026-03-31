import { json, type RequestHandler } from '@sveltejs/kit';
import { generateDraftFromPremise } from '$lib/server/ai/builder';
import { emitAiServerTelemetry } from '$lib/server/ai/telemetry';

export const POST: RequestHandler = async ({ request, locals }) => {
	const payload = (await request.json().catch(() => ({}))) as { premise?: string; draftId?: string };
	const premise = typeof payload.premise === 'string' ? payload.premise : '';
	const draftId = typeof payload.draftId === 'string' && payload.draftId.trim() ? payload.draftId.trim() : null;
	const result = await generateDraftFromPremise(premise);

	emitAiServerTelemetry('builder_audit', {
		action: 'generate_draft',
		userId: locals.sessionUser?.userId ?? 'unknown',
		draftId,
		source: result.source,
		route: '/api/builder/generate-draft'
	});

	return json(result);
};
