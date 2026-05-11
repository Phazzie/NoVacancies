/**
 * Builder draft snapshot endpoint.
 *
 * POST  /api/builder/snapshot
 *   Body: { draft: BuilderStoryDraft }
 *   Saves a point-in-time JSONB snapshot of the current draft into
 *   public.draft_versions so the author can diff a future regeneration
 *   against it. Returns { id, created_at } on success.
 *
 * The userId is taken from locals.sessionUser (the same hook used by every
 * other builder route — see alignment/+server.ts and evaluate-voice/+server.ts).
 */
import { json, type RequestHandler } from '@sveltejs/kit';
import { getSupabaseClient } from '$lib/server/db/supabase';
import type { BuilderStoryDraft } from '$lib/stories/types';

export interface SnapshotCreateResponse {
	id: string;
	created_at: string;
}

function isDraft(value: unknown): value is BuilderStoryDraft {
	if (!value || typeof value !== 'object') return false;
	const typed = value as Partial<BuilderStoryDraft>;
	return (
		typeof typed.title === 'string' &&
		typeof typed.premise === 'string' &&
		Array.isArray(typed.characters) &&
		Array.isArray(typed.mechanics)
	);
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const payload = (await request.json().catch(() => ({}))) as { draft?: unknown };
	const draft = payload.draft;

	if (!isDraft(draft)) {
		return json(
			{ error: 'Missing or invalid builder draft in request body.', code: 'invalid_request' },
			{ status: 400 }
		);
	}

	const userId = locals.sessionUser?.userId;
	if (!userId) {
		return json(
			{ error: 'No session user; sign in before saving snapshots.', code: 'no_session' },
			{ status: 401 }
		);
	}

	const client = getSupabaseClient();
	if (!client) {
		return json(
			{
				error: 'Snapshot storage is not configured on this environment.',
				code: 'storage_unavailable'
			},
			{ status: 503 }
		);
	}

	const draftTitle =
		typeof draft.title === 'string' && draft.title.trim() ? draft.title.trim() : 'Untitled draft';

	const { data, error } = await client
		.from('draft_versions')
		.insert({
			session_user_id: userId,
			draft_title: draftTitle,
			snapshot: draft as unknown as Record<string, unknown>
		})
		.select('id, created_at')
		.limit(1)
		.single();

	if (error || !data) {
		console.error(
			'[api:snapshot] insert failed:',
			error instanceof Error ? error.message : error
		);
		return json(
			{ error: 'Failed to save snapshot.', code: 'storage_error' },
			{ status: 500 }
		);
	}

	const response: SnapshotCreateResponse = {
		id: data.id as string,
		created_at: data.created_at as string
	};
	return json(response);
};
