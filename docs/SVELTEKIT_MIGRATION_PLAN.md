# SvelteKit Migration Plan (Revised)

Date: 2026-02-07  
Scope: SvelteKit migration only. Grok and Clerk are deferred to follow-up plans.

## Objective

Migrate the current vanilla JS app to SvelteKit (TypeScript) with split routing, preserved PWA behavior, and deployment on Vercel while maintaining playthrough reliability.

## Locked Decisions (Latest)

1. Framework pass only: SvelteKit migration now, provider/auth migrations later.
2. Language: TypeScript.
3. Routing: split routes (`/`, `/settings`, `/play`, `/ending`).
4. PWA: keep manifest + service worker behavior.
5. Validation depth: thorough test gate required.
6. Deploy target: Vercel.
7. Working style: seam-driven (`contract -> probe -> tests -> mock -> actual`).

## Plan Revisions From Earlier Direction

1. Removed Grok/Clerk work from this phase to prevent mixed-failure debugging.
2. Elevated test requirements from basic smoke to full lint/unit/integration/e2e/build.
3. Added explicit branch and baseline controls due current repo churn.
4. Added migration docs/report outputs as first-class deliverables.

## Entry Criteria

Before phase execution:
1. Mainline changes are pushed and baseline commit is selected.
2. Migration branch is created from approved base.
3. Existing untracked files remain untouched unless explicitly requested.

## Branch Strategy

1. Branch name: `feat/sveltekit-migration`.
2. Base: latest approved `main` commit after your push.
3. Commit cadence: one phase per commit.
4. Push cadence: push only after phase test gate passes.

## Target Structure

```txt
src/
  app.d.ts
  app.html
  app.css
  routes/
    +layout.svelte
    +page.svelte
    settings/+page.svelte
    play/+page.svelte
    ending/+page.svelte
  lib/
    contracts/
    game/
    services/
    components/
static/
  manifest.json
  service-worker.js (or migrated equivalent)
  images/
  icons/
```

## Seam-Driven Phase Plan

## Phase 0: Baseline Lock

Contract:
- Freeze current behavior expectations for settings, scene transitions, ending flow, recap.

Probe:
- Confirm project baseline command behavior.

Tests:
- `npm run lint`
- `npm test`
- `npm run test:e2e`

Mock implementation:
- none

Actual implementation:
- none

Exit:
- baseline evidence captured.

## Phase 1: SvelteKit Scaffold + Route Shell

Contract:
- Route map and screen responsibilities:
  - `/` title/start
  - `/settings` controls/preferences
  - `/play` scene flow
  - `/ending` recap/outcome

Probe:
- `npm run dev` boots SvelteKit and route navigation works.

Tests:
- Route smoke tests + existing baseline tests adjusted for new entrypoint.

Mock implementation:
- Port UI shells with deterministic placeholder state.

Actual implementation:
- Attach migrated state + renderer behavior.

Exit:
- All four routes render and navigate correctly.

## Phase 2: State + Service Orchestration Port

Contract:
- Preserve current scene contract and state transitions.
- Preserve AI->mock playability fallback invariant.

Probe:
- Validate service interfaces compile and load server/client boundaries safely.

Tests:
- Integration tests for:
  - scene loading
  - choice transitions
  - fallback continuity
  - recap validation

Mock implementation:
- Keep mock story service first as primary runtime in migration.

Actual implementation:
- Wire existing service stack behind SvelteKit modules.

Exit:
- Full playthrough succeeds in mock mode.

## Phase 3: PWA Preservation

Contract:
- Manifest/service worker behavior remains available.

Probe:
- Confirm registration path and asset resolution under SvelteKit build.

Tests:
- PWA smoke checks + no regression in navigation/startup.

Mock implementation:
- Minimal registration with fallback off if unsupported.

Actual implementation:
- Integrate final service worker and manifest references.

Exit:
- PWA metadata and worker operate in preview deploy.

## Phase 4: Test and Quality Hardening

Contract:
- No regression on non-negotiable invariants.

Probe:
- Identify flaky or stale tests and migrate assertions to route-based behavior.

Tests:
- Mandatory full gate:
  - `npm run lint`
  - `npm test`
  - `npm run test:e2e`
  - `npm run build`

Mock implementation:
- Stable test fixtures and deterministic mocks.

Actual implementation:
- Final test updates for SvelteKit runtime.

Exit:
- Full gate green.

## Phase 5: Vercel Deploy + Live Verification

Contract:
- Deployed preview (and prod if requested) supports full playthrough.

Probe:
- Verify env/project linkage and build settings.

Tests:
- Live smoke:
  - start game
  - navigate choices
  - reach ending
  - recap present

Mock implementation:
- none

Actual implementation:
- Vercel deployment and runtime verification.

Exit:
- Definition of done met.

## Review/Critique/Revise Loop (Per Phase)

Each phase must include:
1. Review: what changed and what evidence exists.
2. Critique: answer:
   - `What would a group of haters say about the work I just did?`
   - `Which part is most likely to fail silently?`
   - `What did we assume without proof?`
3. Revise: apply any required correction before phase close.

## Docs Deliverables

1. `docs/SVELTEKIT_MIGRATION_PLAN.md` (this plan).
2. `docs/SVELTEKIT_MIGRATION_REPORT_2026-02-07.md` (execution evidence, risks, rollback).
3. `README.md` updates for new run/build/test/deploy flow.
4. `CHANGELOG.md` migration summary.
5. AGENTS note update after branch switch (as requested) referencing active migration docs.

## Risks Introduced by This Plan

1. Route split can break existing selector-driven tests and require broad test rewrites.
2. PWA migration under SvelteKit can fail quietly if worker paths are misconfigured.
3. Large dirty working tree can cause accidental scope bleed without strict phase boundaries.

## Mitigations

1. Lock baseline and phase gates before broad rewrites.
2. Keep mock-first behavior during migration to reduce moving parts.
3. Perform per-phase diffs and evidence logging before push.

## Out-of-Scope Follow-up

After this plan closes:
1. Run `docs/GROK_API_SWITCH_PLAN_POST_SVELTEKIT.md`.
2. Add Clerk/auth plan in a separate document and branch phase.
