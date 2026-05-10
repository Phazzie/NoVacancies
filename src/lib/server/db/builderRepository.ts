/**
 * Builder-draft repository.
 *
 * Cloud-syncs builder drafts so authors can continue across devices.
 * localStorage remains the primary store; this layer adds durability and
 * cross-device continuity for authenticated users.
 *
 * All functions return null / void when the Supabase client is unavailable.
 */
import { getSupabaseClient } from './supabase';
import type { BuilderStoryDraft } from '$lib/stories/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function logDbError(operation: string, error: unknown): void {
	console.error(
		`[db:builder] ${operation} failed:`,
		error instanceof Error ? error.message : error
	);
}

// ─── Repository ───────────────────────────────────────────────────────────────

/**
 * Upsert a builder draft to the database.
 * The unique constraint is (user_id, story_id) — one draft per user per story.
 */
export async function saveBuilderDraftToDb(
	userId: string,
	storyId: string,
	draft: BuilderStoryDraft
): Promise<void> {
	const client = getSupabaseClient();
	if (!client) return;

	const { error } = await client.from('builder_drafts').upsert(
		{
			user_id: userId,
			story_id: storyId,
			draft: draft as unknown as Record<string, unknown>
		},
		{ onConflict: 'user_id,story_id', ignoreDuplicates: false }
	);

	if (error) {
		logDbError('saveBuilderDraftToDb', error);
	}
}

/**
 * Load a saved builder draft.
 * Returns null if no draft exists for this user/story or if the DB is unavailable.
 */
export async function loadBuilderDraftFromDb(
	userId: string,
	storyId: string
): Promise<BuilderStoryDraft | null> {
	const client = getSupabaseClient();
	if (!client) return null;

	const { data: row, error } = await client
		.from('builder_drafts')
		.select('draft')
		.eq('user_id', userId)
		.eq('story_id', storyId)
		.maybeSingle();

	if (error) {
		logDbError('loadBuilderDraftFromDb', error);
		return null;
	}
	if (!row) return null;

	// Runtime cast — the DB JSONB column stores the full BuilderStoryDraft shape.
	return row.draft as unknown as BuilderStoryDraft;
}

/**
 * Delete a builder draft (e.g. when an author publishes or resets).
 */
export async function deleteBuilderDraft(userId: string, storyId: string): Promise<void> {
	const client = getSupabaseClient();
	if (!client) return;

	const { error } = await client
		.from('builder_drafts')
		.delete()
		.eq('user_id', userId)
		.eq('story_id', storyId);

	if (error) {
		logDbError('deleteBuilderDraft', error);
	}
}

/**
 * List all builder drafts for a user. Useful for a "my stories" index.
 */
export async function listBuilderDraftsForUser(
	userId: string
): Promise<{ storyId: string; draft: BuilderStoryDraft; updatedAt: string }[]> {
	const client = getSupabaseClient();
	if (!client) return [];

	const { data: rows, error } = await client
		.from('builder_drafts')
		.select('story_id, draft, updated_at')
		.eq('user_id', userId)
		.order('updated_at', { ascending: false });

	if (error) {
		logDbError('listBuilderDraftsForUser', error);
		return [];
	}

	return (rows ?? []).map((row) => ({
		storyId: row.story_id,
		draft: row.draft as unknown as BuilderStoryDraft,
		updatedAt: row.updated_at
	}));
}
