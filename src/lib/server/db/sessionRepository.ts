/**
 * Play-session repository.
 *
 * Persists and retrieves a user's progress through a story in the
 * `play_sessions` Supabase table.
 *
 * All functions return null / void (instead of throwing) when the Supabase
 * client is unavailable so callers can treat the DB as optional.
 */
import { getSupabaseClient } from './supabase';
import type { GameState, StoryThreads } from '$lib/contracts';

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface PlaySessionData {
	userId: string;
	storyId: string;
	sceneId?: string | null;
	beatCount?: number;
	gameState: GameState;
	threads?: StoryThreads | null;
}

export interface StoredPlaySession extends PlaySessionData {
	id: string;
	createdAt: string;
	updatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function logDbError(operation: string, error: unknown): void {
	console.error(`[db:session] ${operation} failed:`, error instanceof Error ? error.message : error);
}

// ─── Repository ───────────────────────────────────────────────────────────────

/**
 * Upsert (create-or-update) a play session row.
 * The unique constraint is (user_id, story_id) — one active session per user
 * per story. Returns the row id on success, null if the DB is unavailable.
 */
export async function upsertPlaySession(data: PlaySessionData): Promise<string | null> {
	const client = getSupabaseClient();
	if (!client) return null;

	const { data: rows, error } = await client
		.from('play_sessions')
		.upsert(
			{
				user_id: data.userId,
				story_id: data.storyId,
				scene_id: data.sceneId ?? null,
				beat_count: data.beatCount ?? 0,
				game_state: data.gameState as Record<string, unknown>,
				threads: (data.threads ?? null) as Record<string, unknown> | null
			},
			{ onConflict: 'user_id,story_id', ignoreDuplicates: false }
		)
		.select('id')
		.limit(1)
		.single();

	if (error) {
		logDbError('upsertPlaySession', error);
		return null;
	}
	return rows?.id ?? null;
}

/**
 * Load the saved play session for a given user + story.
 * Returns null if no session exists or the DB is unavailable.
 */
export async function loadPlaySession(
	userId: string,
	storyId: string
): Promise<StoredPlaySession | null> {
	const client = getSupabaseClient();
	if (!client) return null;

	const { data: row, error } = await client
		.from('play_sessions')
		.select('*')
		.eq('user_id', userId)
		.eq('story_id', storyId)
		.maybeSingle();

	if (error) {
		logDbError('loadPlaySession', error);
		return null;
	}
	if (!row) return null;

	return {
		id: row.id,
		userId: row.user_id,
		storyId: row.story_id,
		sceneId: row.scene_id,
		beatCount: row.beat_count,
		gameState: row.game_state as unknown as GameState,
		threads: row.threads as unknown as StoryThreads | null,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

/**
 * Delete a play session (e.g. when the user restarts from the beginning).
 */
export async function deletePlaySession(userId: string, storyId: string): Promise<void> {
	const client = getSupabaseClient();
	if (!client) return;

	const { error } = await client
		.from('play_sessions')
		.delete()
		.eq('user_id', userId)
		.eq('story_id', storyId);

	if (error) {
		logDbError('deletePlaySession', error);
	}
}

/**
 * Return all stored sessions for a user (e.g. for a "continue where you
 * left off" list). Returns an empty array if the DB is unavailable.
 */
export async function listPlaySessionsForUser(userId: string): Promise<StoredPlaySession[]> {
	const client = getSupabaseClient();
	if (!client) return [];

	const { data: rows, error } = await client
		.from('play_sessions')
		.select('*')
		.eq('user_id', userId)
		.order('updated_at', { ascending: false });

	if (error) {
		logDbError('listPlaySessionsForUser', error);
		return [];
	}

	return (rows ?? []).map((row) => ({
		id: row.id,
		userId: row.user_id,
		storyId: row.story_id,
		sceneId: row.scene_id,
		beatCount: row.beat_count,
		gameState: row.game_state as unknown as GameState,
		threads: row.threads as unknown as StoryThreads | null,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	}));
}
