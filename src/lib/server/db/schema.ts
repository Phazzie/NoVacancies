/**
 * TypeScript types for the Supabase database schema.
 *
 * These mirror the SQL tables defined in
 * supabase/migrations/20260510000000_initial_schema.sql and
 * supabase/migrations/20260511000000_draft_versions.sql
 * and follow the Supabase generated-types convention so they can be replaced
 * by `supabase gen types typescript` once the project is provisioned.
 */

// ─── Row shapes (what SELECT returns) ────────────────────────────────────────

export interface PlaySessionRow {
	id: string;
	user_id: string;
	story_id: string;
	scene_id: string | null;
	beat_count: number;
	/** Serialised GameState (see src/lib/contracts/game.ts) */
	game_state: Record<string, unknown>;
	/** Serialised StoryThreads or null before the first beat */
	threads: Record<string, unknown> | null;
	created_at: string;
	updated_at: string;
}

export interface BuilderDraftRow {
	id: string;
	user_id: string;
	story_id: string;
	/** Serialised BuilderStoryDraft (see src/lib/stories/types.ts) */
	draft: Record<string, unknown>;
	created_at: string;
	updated_at: string;
}

export interface DraftVersionRow {
	id: string;
	session_user_id: string;
	draft_title: string;
	/** Serialised BuilderStoryDraft snapshot (see src/lib/stories/types.ts) */
	snapshot: Record<string, unknown>;
	created_at: string;
}

// ─── Insert / Update shapes ───────────────────────────────────────────────────

export type PlaySessionInsert = Omit<PlaySessionRow, 'id' | 'created_at' | 'updated_at'>;
export type PlaySessionUpdate = Partial<Omit<PlaySessionRow, 'id' | 'created_at'>>;

export type BuilderDraftInsert = Omit<BuilderDraftRow, 'id' | 'created_at' | 'updated_at'>;
export type BuilderDraftUpdate = Partial<Omit<BuilderDraftRow, 'id' | 'created_at'>>;

export type DraftVersionInsert = Omit<DraftVersionRow, 'id' | 'created_at'>;
export type DraftVersionUpdate = Partial<Omit<DraftVersionRow, 'id' | 'created_at'>>;

// ─── Database type (passed to createClient<Database>()) ──────────────────────

export interface Database {
	public: {
		Tables: {
			play_sessions: {
				Row: PlaySessionRow;
				Insert: PlaySessionInsert;
				Update: PlaySessionUpdate;
			};
			builder_drafts: {
				Row: BuilderDraftRow;
				Insert: BuilderDraftInsert;
				Update: BuilderDraftUpdate;
			};
			draft_versions: {
				Row: DraftVersionRow;
				Insert: DraftVersionInsert;
				Update: DraftVersionUpdate;
			};
		};
	};
}
