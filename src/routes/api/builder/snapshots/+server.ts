/**
 * Snapshot index endpoint.
 *
 * GET  /api/builder/snapshots
 *   Returns the last 5 snapshots for the current session user as a lightweight
 *   list — id, draft_title, created_at only (no JSONB payload) — so the
 *   DraftDiff dropdown can render without pulling every full snapshot.
 */
import { json, type RequestHandler } from '@sveltejs/kit';
import { getSupabaseClient } from '$lib/server/db/supabase';

export interface SnapshotSummary {
	id: string;
	draft_title: string;
	created_at: string;
}

export interface SnapshotListResponse {
	snapshots: SnapshotSummary[];
}

const MAX_SNAPSHOTS = 5;

export const GET: RequestHandler = async ({ locals }) => {
	const userId = locals.sessionUser?.userId;
	if (!userId) {
		return json(
			{ error: 'No session user; sign in before listing snapshots.', code: 'no_session' },
			{ status: 401 }
		);
	}

	const client = getSupabaseClient();
	if (!client) {
		// Treat unconfigured storage as an empty list rather than a hard error —
		// the builder page should still load in local-dev environments without
		// Supabase configured.
		const empty: SnapshotListResponse = { snapshots: [] };
		return json(empty);
	}

	const { data, error } = await client
		.from('draft_versions')
		.select('id, draft_title, created_at')
		.eq('session_user_id', userId)
		.order('created_at', { ascending: false })
		.limit(MAX_SNAPSHOTS);

	if (error) {
		console.error(
			'[api:snapshots] select failed:',
			error instanceof Error ? error.message : error
		);
		return json(
			{ error: 'Failed to list snapshots.', code: 'storage_error' },
			{ status: 500 }
		);
	}

	const snapshots: SnapshotSummary[] = (data ?? []).map((row) => ({
		id: row.id as string,
		draft_title: row.draft_title as string,
		created_at: row.created_at as string
	}));

	const response: SnapshotListResponse = { snapshots };
	return json(response);
};
