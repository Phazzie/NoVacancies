-- Migration: 20260510000000_initial_schema
-- Creates the core persistence tables for No Vacancies.
-- Apply with: supabase db push  (or via the Supabase dashboard SQL editor)

-- ─────────────────────────────────────────────────────────────────────────────
-- PLAY SESSIONS
-- Stores each user's in-progress or completed run through a story.
-- One row per (user_id, story_id) pair is the intended steady state — the
-- repository upserts on that composite key via a separate index constraint.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.play_sessions (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     TEXT        NOT NULL,
  story_id    TEXT        NOT NULL,
  scene_id    TEXT,
  beat_count  INTEGER     NOT NULL DEFAULT 0,
  -- Full game state snapshot (GameState contract serialised as JSON)
  game_state  JSONB       NOT NULL DEFAULT '{}'::jsonb,
  -- Narrative thread counters (StoryThreads contract serialised as JSON)
  threads     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Enforce one active session per user per story
  CONSTRAINT play_sessions_user_story_unique UNIQUE (user_id, story_id)
);

CREATE INDEX IF NOT EXISTS play_sessions_user_id_idx ON public.play_sessions (user_id);

ALTER TABLE public.play_sessions ENABLE ROW LEVEL SECURITY;

-- Service-role calls (server side) bypass RLS automatically.
-- Anon / authenticated role policies will be tightened when Supabase Auth
-- is wired up in a later sprint. For now we deny all direct client access
-- so the only path is through our own server-side repository layer.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'play_sessions' AND policyname = 'deny_all_client_access'
  ) THEN
    CREATE POLICY deny_all_client_access ON public.play_sessions
      FOR ALL USING (false);
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- BUILDER DRAFTS
-- Cloud-synced copy of the builder draft (localStorage is still the primary
-- store for offline/dev; this row enables cross-device continuity and recovery).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.builder_drafts (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     TEXT        NOT NULL,
  story_id    TEXT        NOT NULL,
  -- Full BuilderStoryDraft serialised as JSON
  draft       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT builder_drafts_user_story_unique UNIQUE (user_id, story_id)
);

CREATE INDEX IF NOT EXISTS builder_drafts_user_id_idx ON public.builder_drafts (user_id);

ALTER TABLE public.builder_drafts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'builder_drafts' AND policyname = 'deny_all_client_access'
  ) THEN
    CREATE POLICY deny_all_client_access ON public.builder_drafts
      FOR ALL USING (false);
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at trigger
-- Automatically stamps updated_at on every row mutation.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER play_sessions_set_updated_at
  BEFORE UPDATE ON public.play_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER builder_drafts_set_updated_at
  BEFORE UPDATE ON public.builder_drafts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
