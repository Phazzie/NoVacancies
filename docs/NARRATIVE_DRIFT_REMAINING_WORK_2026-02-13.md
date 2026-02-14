# Narrative Drift Remaining Work (2026-02-13)

## Scope
This document tracks what is still open after the 2026-02-13 drift cleanup pass.

## Completed in This Pass
1. Canonicalized narrative context ownership.
   - `src/lib/server/ai/narrative.ts` no longer carries duplicate context maps/builders.
   - Server narrative module now imports/re-exports canonical helpers from `src/lib/game/narrativeContext.ts`.
2. Reduced sanity policy to structural checks only in active runtime.
   - Removed taste/regex heuristic blocking from `src/lib/server/ai/sanity.ts`.
3. Hardened anti-drift tests.
   - Tier 1 narrative test now explicitly fails if duplicate context implementation signatures return in `src/lib/server/ai/narrative.ts`.
4. Updated structural sanity unit coverage.
   - `tests/unit/sanity.spec.ts` now validates only structural issue IDs.
5. Canonical docs hygiene.
   - Archived stale local pre-migration plan:
     - `docs/LOCAL_NARRATIVE_UPGRADE_PLAN.md`
     - `docs/archive/2026-02-13_local_narrative_upgrade_plan.md`
6. Simplified always-on runtime contract surface.
   - Removed legacy `narrativeContextV2` / `transitionBridges` feature-flag plumbing from contracts/runtime/settings storage.
   - Removed unused legacy continue prompt path in `src/lib/server/ai/narrative.ts` (`formatThreadState`, `getContinuePrompt`).
   - Added regression assertions preventing those legacy exports from returning.

## Remaining Work

### 1. End-to-End Runtime Confirmation for This Drift Pass
Status: Completed (2026-02-13)

Action:
1. Run `npm run test:e2e` for runtime confidence on `/play` and `/ending` flows.

Why:
1. Drift changes were server/prompt/test heavy and should still be validated in browser flow before release push.

Acceptance:
1. E2E suite passes or blocking failures are documented with exact failing spec IDs.
2. Result (2026-02-13): `9 passed, 1 skipped` (`tests/e2e/grok-live.spec.js` skipped as opt-in canary).

### 2. Optional Hardening: Dedicated Unit Specs for Context Helpers
Status: Open (optional but recommended)

Action:
1. Add/expand focused tests for:
   - context budget trimming order
   - transition bridge selection behavior

Why:
1. Tier 1 gate currently validates signatures and wiring; focused unit tests lower regression debugging cost.

Acceptance:
1. Unit tests fail when budget trim order or transition selection contracts change unexpectedly.

### 3. Fixture Naming/Encoding Hygiene
Status: Open

Action:
1. Rename adversarial fixture IDs that still reference removed heuristic semantics (for clarity only).
2. Normalize fixture/doc punctuation encoding where mojibake is visible (`â€”`).

Why:
1. Current IDs/descriptions are functionally valid but semantically stale and can mislead future reviewers.

Acceptance:
1. Fixture IDs/descriptions match structural-only sanity policy language.
2. Narrative fixture/test suite remains green.

### 4. GitHub Sync
Status: Open

Action:
1. Commit this pass as a focused drift-cleanup commit.
2. Push `main` to `origin/main`.

Why:
1. Current cleanup exists only in local working tree until pushed.

Acceptance:
1. `git status --short --branch` shows clean working tree.
2. `git log --oneline -1` commit is present on `origin/main`.

## Validation Evidence from This Pass
1. `npm run lint` passed.
2. `npm test` passed.
3. `npm run check` passed.
4. `npm run test:narrative` passed (`194/194` Tier 1 gates).
5. `npm run test:e2e` passed (`9 passed, 1 skipped`).

## Definition of Drift-Cleanup Complete
Drift cleanup can be considered complete when all are true:
1. Canonical context logic exists in one implementation owner (`src/lib/game/narrativeContext.ts`).
2. Prompt module (`src/lib/server/ai/narrative.ts`) is prompt-focused and non-duplicative.
3. Sanity gate remains structural-only.
4. Anti-duplication tests guard against reintroduction.
5. E2E runtime validation is green for the same commit being released.
6. Local changes are committed and pushed.
