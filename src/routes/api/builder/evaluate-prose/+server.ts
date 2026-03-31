import { json, type RequestHandler } from '@sveltejs/kit';
import { evaluateBuilderProse } from '$lib/server/ai/builder';
import { emitAiServerTelemetry } from '$lib/server/ai/telemetry';

export const POST: RequestHandler = async ({ request, locals }) => {
	const payload = (await request.json().catch(() => ({}))) as { prose?: string; draftId?: string };
	const prose = typeof payload.prose === 'string' ? payload.prose : '';
	const draftId = typeof payload.draftId === 'string' && payload.draftId.trim() ? payload.draftId.trim() : null;
	const result = await evaluateBuilderProse(prose);

	emitAiServerTelemetry('builder_audit', {
		action: 'evaluate_prose',
		userId: locals.sessionUser?.userId ?? 'unknown',
		draftId,
		source: result.source,
		route: '/api/builder/evaluate-prose'
	});

	return json(result);
};
