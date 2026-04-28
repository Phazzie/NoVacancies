# No Vacancies

No Vacancies is an interactive narrative game about invisible labor and relationship load-bearing.

## Current Stack

- Framework: SvelteKit (TypeScript)
- Deployment target: Vercel
- Story runtime: Grok-only text runtime with hard-fail outage policy
- PWA assets: `static/manifest.json`, `static/service-worker.js`

UI direction:

- The app now uses a shared motel-noir shell across `/`, `/play`, `/ending`, `/settings`, and `/debug`.
- Home is story-forward first, with demo-readiness information kept as an operator panel instead of the emotional centerpiece.
- Debug/settings remain operational surfaces, but they inherit the same visual system so the app reads as one product.

Demo readiness UX:

- Home route (`/`) now includes a "Demo Readiness" progress dashboard backed by `/api/demo/readiness`.
- Score/checks are runtime-derived (provider mode, key presence, outage mode, probe state, active story id/title) so you can quickly gauge demo readiness.
- Debug route (`/debug`) shows persisted runtime/client/API error events to speed up playthrough troubleshooting.

Play UX:

- `/play` uses a prose-first command-deck layout with atmospheric scene framing, arc progress, and keyboard choice shortcuts (`1`, `2`, `3`) for faster turn selection.
- `/play` also exposes quick utility controls (restart current run, jump to `/debug`) plus scene/arc/mood chips so operators can triage runs faster during demos.
- When Grok is misconfigured, `/play` now shows an explicit blocked state with direct paths to `/settings` and `/debug` instead of leaving operators in an ambiguous loading view.

Builder UX:

- `/builder` starts from a plain-language premise, generates a first draft via `/api/builder/generate-draft`, and then lets you edit the resulting story definition in-place.
- Prose-bearing fields can be reviewed with `/api/builder/evaluate-prose`, which is AI-first but falls back to a deterministic behavioral/concreteness rubric if Grok is unavailable.
- Current builder drafts persist locally in the browser so authors can leave and return without losing the working draft.
- The builder's empty/default scaffold is intentionally story-neutral (`starter-kit`-based), so authoring does not start from Sydney/motel copy when AI generation is unavailable.

## Run

```bash
npm install
npm run dev
```

Default app URL is shown by Vite (typically `http://127.0.0.1:5173`).

## Environment Variables

Copy the template and set secrets locally:

```bash
cp .env.example .env.local
```

Server/runtime variables used by the SvelteKit AI provider layer:

- `AI_PROVIDER`: `grok` only (`mock` is disabled).
- `AI_OUTAGE_MODE`: `hard_fail` (required in preview/production).
- `XAI_API_KEY`: required in Grok-only mode.
- `AUTH_SESSION_SECRET`: required in production/preview runtime to validate signed `nv_session` cookies for builder/admin auth checks; Playwright-only local tests inject a fallback default if unset.
- `ENABLE_GROK_TEXT`, `ENABLE_GROK_IMAGES`, `ENABLE_PROVIDER_PROBE`: feature toggles (`0`/`1`).
- `AI_AUTH_BYPASS`: disabled in Grok-only mode.
- `GROK_TEXT_MODEL`, `GROK_IMAGE_MODEL`: optional model override strings.
- `AI_MAX_OUTPUT_TOKENS`, `AI_REQUEST_TIMEOUT_MS`, `AI_MAX_RETRIES`: optional reliability tuning.
- `PUBLIC_STORY_ID`: optional active story cartridge id (defaults to `no-vacancies`; unknown ids fail fast at runtime).

Default mode policy:

- Text defaults to Grok (`AI Generated` mode in settings).
- Images default to pre-generated/static unless `ENABLE_GROK_IMAGES=1`.
- If Grok is unavailable or misconfigured, requests fail fast (no mock fallback path).

## Story Engine + Builder

The app runtime now supports a story-definition seam so story content can be isolated from engine code while the engine stays reusable.

- Engine runtime stays in `src/lib/game`, `src/lib/services`, and server provider adapters.
- Story content is defined through `StoryDefinition` / `StoryCartridge` (`src/lib/stories/types.ts`).
- Active story wiring defaults to `src/lib/stories/no-vacancies/index.ts` and can be selected via `PUBLIC_STORY_ID`.
- `src/lib/stories/starter-kit/index.ts` exists as a second cartridge so the abstraction is validated against a non-No-Vacancies story.
- Prompt assets, context translation, transition-bridge generation, lesson access, and image resolution now read from the active story definition instead of hardcoded No Vacancies constants in shared engine files.
- Shared shell/home branding also reads from the active story definition, so visible presentation stays aligned with runtime cartridge selection.

To add a new story cartridge:

1. Create `src/lib/stories/<story-id>/index.ts` implementing `StoryDefinition`.
2. Register it in `src/lib/stories/index.ts`.
3. Provide prompts, context translators, lesson data, initial state defaults, and UI image mappings in the cartridge.
4. Validate it with the story-registry and runtime-selection smoke tests.

Builder surfaces:

- Route: `/builder`
- Operator auth APIs: `POST /api/auth/login`, `POST /api/auth/logout`
- Draft generation API: `/api/builder/generate-draft`
- Prose evaluation API: `/api/builder/evaluate-prose`
- Builder implementation: `src/routes/builder/+page.svelte`, `src/lib/server/ai/builder.ts`, `src/lib/builder/store.ts`

Operator login steps (local/dev):

1. Start the app (`npm run dev`) with `AUTH_SESSION_SECRET` set.
2. Log in as a builder-capable role (`author` or `editor`):

```bash
curl -i -X POST http://127.0.0.1:5173/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"userId":"operator-demo","role":"author"}'
```

3. Copy the returned `Set-Cookie: nv_session=...` header value and send it as `Cookie` when calling `/builder` or `/api/builder/*`.
4. Clear the session when done:

```bash
curl -i -X POST http://127.0.0.1:5173/api/auth/logout \
  -H 'Cookie: nv_session=<paste-cookie-value>'
```

## Build + Preview

```bash
npm run build
npm run preview
```

## Tests

Core quality gate:

```bash
npm run lint
npm test
npm run test:narrative
npm run test:unit
npm run test:e2e
```

Notes:

- `npm test` enforces the active-runtime decommission guard and runs runtime story-selection smoke scenarios (default story, explicit `PUBLIC_STORY_ID`, invalid-id fail-fast behavior, and builder auth enforcement for anonymous/unauthorized/authorized requests).
- `npm run test:narrative` remains a deterministic Tier 1 smoke gate that validates fixture/reporting wiring only, so it stays fast and stable.
- `npm run test:unit` runs behavior-first unit suites (story registry runtime selection/fail-fast, prompt delegation ownership, and narrative-context contract outputs) using exported runtime APIs.
- `npm run test:e2e` runs Playwright against the SvelteKit app, including the builder flow and route-shell checks.
- `tests/e2e/grok-live.spec.js` is a Grok live canary and runs only when `LIVE_GROK=1` and `XAI_API_KEY` are set.
- GitHub PRs run only the blocking Tier 1 workflow gate. Tier 2 Claude evaluation and the live provider canary run on `main` pushes or manual workflow dispatch so PR feedback stays deterministic and lower-noise.
- GitHub Actions now cancel superseded in-progress runs for the same PR/branch, which reduces duplicate check spam while iterating quickly.

## Release Runbook (Stability + Demo Confidence)

Release scope policy:

- This release is scoped to stability and demo confidence only (no net-new feature work).
- Any nice-to-have work is explicitly deferred to the next milestone before merge-train start.

Merge train order (risk lanes):

1. Lane A: tests/docs/low-risk refactors
2. Lane B: contracts/parsing/error-shaping/telemetry
3. Lane C: builder auth + builder QA + builder UX
4. Lane D: prompt/narrative behavior changes (merge last)

Required gate before each lane merge:

```bash
npm run lint
npm test
npm run test:narrative
npm run test:e2e
```

Release blockers (must hold to ship):

- Grok hard-fail behavior remains intact (no runtime fallback drift).
- Sanity enforcement remains structural-only (no brittle taste regex checks reintroduced).
- Unknown story/config IDs fail fast (never silently fallback to another cartridge).
- Telemetry remains structural/sanitized (no keys/secrets/prompt dumps in logs).
- Parse recovery remains bounded and typed (no synthetic story-content masking provider defects).

Demo readiness pass before tag:

1. Run operator flow: `/` -> `/play` full run -> `/settings` -> `/debug`.
2. Validate `/builder` using a signed-in builder-capable session, or confirm anonymous access returns `401 auth_required`.
3. Run one provider-misconfiguration path and verify clear recovery guidance in UI.

RC cut + ship:

1. Freeze `main` for release candidate validation.
2. Update `CHANGELOG.md`, tag RC, deploy, and smoke-test production routes.
3. If any blocker fails in smoke, rollback immediately and reopen only the failing lane.

## PWA

- Manifest: `/manifest.json`
- Service worker: `/service-worker.js`
- Icons served from `/icons/*`
- Browser shell metadata and theme color are aligned with the motel-noir redesign in `src/app.html` + `static/manifest.json`

## Docs Map

- Migration plan: `docs/SVELTEKIT_MIGRATION_PLAN.md`
- Grok follow-up plan: `docs/GROK_API_SWITCH_PLAN_POST_SVELTEKIT.md`
- Narrative drift cleanup plan: `docs/NARRATIVE_DRIFT_CLEANUP_EXECUTION_PLAN_2026-02-13.md`
- Narrative drift remaining work: `docs/NARRATIVE_DRIFT_REMAINING_WORK_2026-02-13.md`
- UI ship exec plan: `docs/UI_SHIP_EXEC_PLAN_2026-03-19.md`
- Story abstraction guidance: `docs/CODEX_STORY_ABSTRACTION_GUIDANCE.md`
- Story abstraction exec plan: `docs/STORY_ABSTRACTION_EXEC_PLAN_2026-03-19.md`
- Archived legacy local narrative plan: `docs/archive/2026-02-13_local_narrative_upgrade_plan.md`
- Archived legacy static shell: `docs/archive/2026-03-19_legacy_static_shell/`
- Gemini decommission plan: `docs/GEMINI_DECOMMISSION_EXECUTION_PLAN.md`
