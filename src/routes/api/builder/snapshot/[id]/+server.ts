/**
 * Single snapshot fetch endpoint.
 *
 * GET  /api/builder/snapshot/[id]
 *   Returns the full snapshot JSONB for one draft_versions row, scoped to
 *   the current session user. Used by DraftDiff to compute a field-by-field
 *   diff against the in-memory draft.
 *
 * Returns { id, draft_title, created_at, snapshot } on success.
 */
import { json, type RequestHandler } from '@sveltejs/kit';
import { getSupabaseClient } from '$lib/server/db/supabase';
import type { BuilderStoryDraft } from '$lib/stories/types';

export interface SnapshotDetailResponse {
	id: string;
	draft_title: string;
	created_at: string;
	snapshot: BuilderStoryDraft;
}

export const GET: RequestHandler = async ({ params, locals }) => {
	const id = params.id?.trim();
	if (!id) {
		return json(
			{ error: 'Missing snapshot id.', code: 'invalid_request' },
			{ status: 400 }
		);
	}

	const userId = locals.sessionUser?.userId;
	if (!userId) {
		return json(
			{ error: 'No session user; sign in before loading snapshots.', code: 'no_session' },
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

	const { data, error } = await client
		.from('draft_versions')
		.select('id, draft_title, snapshot, created_at, session_user_id')
		.eq('id', id)
		.eq('session_user_id', userId)
		.maybeSingle();

	if (error) {
		console.error(
			'[api:snapshot:get] select failed:',
			error instanceof Error ? error.message : error
		);
		return json(
			{ error: 'Failed to load snapshot.', code: 'storage_error' },
			{ status: 500 }
		);
	}

	if (!data) {
		return json(
			{ error: 'Snapshot not found.', code: 'not_found' },
			{ status: 404 }
		);
	}

	const response: SnapshotDetailResponse = {
		id: data.id as string,
		draft_title: data.draft_title as string,
		created_at: data.created_at as string,
		snapshot: data.snapshot as unknown as BuilderStoryDraft
	};
	return json(response);
};
