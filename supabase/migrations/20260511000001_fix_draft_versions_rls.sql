-- Migration: 20260511000001_fix_draft_versions_rls
-- Fixes the non-functional RLS policies on public.draft_versions introduced in
-- 20260511000000_draft_versions.sql.
--
-- Row-level scoping for draft_versions is enforced at the application layer via
-- session_user_id filters in API routes. The Supabase service-role key used by
-- those routes bypasses RLS by design. The previous policies referenced
-- current_setting('app.current_user_id', true), which is never set by any route,
-- so they matched nothing and gave false security. If Supabase Auth is added in
-- future, update these policies to use auth.uid().
--
-- This migration:
--   1. Drops the non-functional SELECT/INSERT policies from the previous migration.
--   2. Keeps RLS enabled (so any future auth.uid() policy takes effect immediately).
--   3. Adds DELETE/UPDATE deny-all policies — the table is append-only / immutable.
--   4. Adds a service-role-only SELECT policy so direct DB reads from non-service
--      contexts (anon, authenticated without role override) cannot leak rows.

-- 1. Drop the non-functional policies from the previous migration.
drop policy if exists "users see own draft versions" on public.draft_versions;
drop policy if exists "users insert own draft versions" on public.draft_versions;

-- 2. RLS stays enabled. (alter table … enable row level security; was already run
--    in the previous migration, but re-asserting is safe and idempotent.)
alter table public.draft_versions enable row level security;

-- 3. Immutable history: deny DELETE and UPDATE for every role.
create policy "deny all deletes" on public.draft_versions for delete using (false);

create policy "deny all updates" on public.draft_versions for update using (false);

-- 4. Service-role-only SELECT. Extend this policy with auth.uid() = session_user_id
--    once Supabase Auth is wired up.
create policy "service role only" on public.draft_versions for select
  using (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
