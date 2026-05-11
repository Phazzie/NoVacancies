-- Migration: 20260511000000_draft_versions
-- Adds draft snapshot history so authors can compare draft regenerations.
-- Apply with: supabase db push  (or via the Supabase dashboard SQL editor)

-- ─────────────────────────────────────────────────────────────────────────────
-- DRAFT VERSIONS
-- Append-only history of builder draft snapshots. Each row captures the full
-- BuilderStoryDraft JSON at the moment the author saved a snapshot, so a
-- subsequent regeneration can be diffed against it field-by-field.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.draft_versions (
  id uuid primary key default gen_random_uuid(),
  session_user_id text not null,
  draft_title text not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index draft_versions_user_idx on public.draft_versions(session_user_id, created_at desc);

-- RLS: users can only see their own snapshots
alter table public.draft_versions enable row level security;

create policy "users see own draft versions"
  on public.draft_versions for select
  using (session_user_id = current_setting('app.current_user_id', true));

create policy "users insert own draft versions"
  on public.draft_versions for insert
  with check (session_user_id = current_setting('app.current_user_id', true));
