import { json, type RequestHandler } from '@sveltejs/kit';
import { remixDraft } from '$lib/server/ai/builder/draftGenerator';
import { emitAiServerTelemetry } from '$lib/server/ai/telemetry';
import type { BuilderStoryDraft } from '$lib/stories/types';

interface RemixRequestPayload {
	draft?: BuilderStoryDraft;
	newLessonId?: number;
	draftId?: string;
}

function isBuilderStoryDraft(value: unknown): value is BuilderStoryDraft {
	if (!value || typeof value !== 'object') return false;
	const draft = value as Partial<BuilderStoryDraft>;
	return (
		typeof draft.title === 'string' &&
		typeof draft.premise === 'string' &&
		typeof draft.setting === 'string' &&
		typeof draft.aestheticStatement === 'string' &&
		Array.isArray(draft.voiceCeilingLines) &&
		Array.isArray(draft.characters) &&
		Array.isArray(draft.mechanics) &&
		typeof draft.openingPrompt === 'string' &&
		typeof draft.systemPrompt === 'string'
	);
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const payload = (await request.json().catch(() => ({}))) as RemixRequestPayload;
	const draft = payload.draft;
	const newLessonId =
		typeof payload.newLessonId === 'number' && Number.isFinite(payload.newLessonId)
			? Math.trunc(payload.newLessonId)
			: null;
	const draftId =
		typeof payload.draftId === 'string' && payload.draftId.trim()
			? payload.draftId.trim()
			: null;

	if (!isBuilderStoryDraft(draft)) {
		return json({ error: 'Invalid or missing draft payload.' }, { status: 400 });
	}
	if (newLessonId === null) {
		return json({ error: 'newLessonId must be a number.' }, { status: 400 });
	}

	try {
		const result = await remixDraft(draft, newLessonId);

		emitAiServerTelemetry('builder_audit', {
			action: 'remix_draft',
			userId: locals.sessionUser?.userId ?? 'unknown',
			draftId,
			newLessonId,
			source: result.source,
			route: '/api/builder/remix'
		});

		return json({
			draft: result.draft,
			source: result.source,
			lesson: { id: result.lesson.id, title: result.lesson.title }
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Remix failed.';
		const isInvalidLesson = /Unknown lesson id/i.test(message);

		emitAiServerTelemetry('builder_audit', {
			action: 'remix_draft',
			userId: locals.sessionUser?.userId ?? 'unknown',
			draftId,
			newLessonId,
			source: 'error',
			route: '/api/builder/remix',
			error: message
		});

		return json({ error: message }, { status: isInvalidLesson ? 400 : 500 });
	}
};
