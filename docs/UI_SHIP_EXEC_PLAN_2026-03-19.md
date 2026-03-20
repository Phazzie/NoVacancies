# UI Ship ExecPlan - 2026-03-19

This is a living execution plan for finishing, verifying, and publishing the `ui-redesign-noir` branch.

## What Makes a Top-Tier Exec Plan

A top-tier exec plan is:

1. Self-contained.
   Another agent should be able to execute it without reconstructing hidden context from chat history.
2. Outcome-first.
   It describes what must be true at the end, not just a list of commands.
3. Explicit about scope.
   It names what is in scope, what is out of scope, and what must not regress.
4. Verifiable.
   It includes concrete validation commands, visual checks, and acceptance criteria.
5. Revision-friendly.
   It forces critique checkpoints so the team can catch “looks cooler but works worse.”
6. Safe to operate from.
   It records rollback notes, assumptions, and the current baseline before edits begin.

## Goal

Ship the UI redesign branch to GitHub in a demo-ready state. The branch should feel visually intentional, preserve current runtime behavior, eliminate leftover template/static-shell seams, and leave a clean verification trail.

## Baseline

- Active working tree: `/mnt/c/Users/latro/Downloads/t/sydney-story-ui-redesign`
- Active branch: `ui-redesign-noir`
- Base history: `origin/main` plus the hardening work already merged into `origin/claude/review-open-prs-QxIrE`
- Original checkout at `/mnt/c/Users/latro/Downloads/t/sydney-story` is intentionally untouched because it is stale and noisy

## Scope

In scope:
- final UI polish on the SvelteKit shell and routes
- runtime-shell branding polish (`src/app.html`, manifest/icon wiring)
- documentation updates required by the redesign
- full verification
- commit + push to GitHub

Out of scope:
- story-engine abstraction
- builder/create flows
- diagnostics/image-pipeline feature branches
- broad narrative/runtime refactors unrelated to shipping the redesign

## Non-Negotiables

- Preserve existing route behavior and operator surfaces.
- Preserve keyboard access and visible focus.
- Do not restore external-font dependencies or meta-CSP regressions.
- Do not touch the original dirty checkout.

## Progress

- [x] Confirm remaining polish seams and freeze scope.
- [x] Apply final shell/branding polish.
- [x] Run verification and critique/revision checkpoint.
- [x] Commit the redesign branch.
- [x] Push the redesign branch to GitHub.

## Remaining Polish Targets

1. Remove “template/default app” seams from the runtime shell.
   - Update `src/app.html` theme color.
   - Add an explicit favicon link so browsers stop falling back to a missing `/favicon.ico`.
   - Align manifest colors/description with the motel-noir direction.
2. Keep the branch history understandable.
   - Archive the stale root static shell instead of leaving mystery deletions.
   - Keep docs in sync with what changed and why.
3. Ship only after proof.
   - `npm run check`
   - `npm run lint`
   - `npm test`
   - `npm run test:narrative`
   - `E2E_HOST=127.0.0.1 E2E_PORT=<served-port> npm run test:e2e`
   - desktop/mobile browser smoke

## Critique / Revise Checkpoint

Before commit, ask:

- What would a group of haters say about this branch?
- Does any page still look like “theme paint over old utility markup”?
- Is any operator path slower or harder to understand than before?
- Are there still template artifacts that break trust?

If the answer is yes, fix those before commit.

## Acceptance Criteria

The branch is ready to publish only if:

1. `/`, `/play`, `/ending`, `/settings`, and `/debug` feel like one product.
2. The blocked `/play` state is explicit and actionable.
3. Browser shell metadata matches the redesign direction.
4. Validation commands pass.
5. The branch is committed and pushed.

## Rollback

If the last-mile polish causes problems:

- revert the final commit(s) on `ui-redesign-noir`, or
- restore archived `index.html` / `style.css` from `docs/archive/2026-03-19_legacy_static_shell/` if a local workflow depended on them

## Outcomes & Retrospective

- Remaining “template” seams were narrowed to browser-shell polish, not route-level redesign gaps.
- Final polish updated `src/app.html` and `static/manifest.json` so theme color, description, and favicon/icon wiring match the redesign direction.
- Verification completed successfully:
  - `npm run check`
  - `npm run lint`
  - `npm test`
  - `npm run test:narrative`
  - `npm run build`
  - `E2E_HOST=127.0.0.1 E2E_PORT=4176 npm run test:e2e`
- Published result:
  - commit `f463258` created the shipping redesign snapshot
  - branch `ui-redesign-noir` pushed to `origin/ui-redesign-noir`
- Critique checkpoint result:
  - The strongest surviving hater criticism was that `/play` originally looked like a dressed-up loading state when Grok was unavailable.
  - Revision applied before signoff: the blocked `/play` state now uses explicit recovery copy plus direct Settings/Debug exits.
