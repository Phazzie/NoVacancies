import { json, type RequestHandler } from '@sveltejs/kit';
import { evaluateBuilderDraft } from '$lib/server/ai/builder';
import { starterKitCartridge } from '$lib/stories/starter-kit';
import type { BuilderStoryDraft } from '$lib/stories/types';

export const POST: RequestHandler = async ({ request }) => {
	const payload = (await request.json().catch(() => ({}))) as { draft?: BuilderStoryDraft };
	const fallbackDraft = starterKitCartridge.builder.createEmptyDraft();
	const draft = payload.draft && typeof payload.draft === 'object' ? payload.draft : fallbackDraft;
	const result = await evaluateBuilderDraft(draft);
	return json(result);
};
