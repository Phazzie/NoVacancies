# No Vacancies

No Vacancies is an interactive narrative game about invisible labor and relationship load-bearing.

## Current Stack

- Framework: SvelteKit (TypeScript)
- Deployment target: Vercel
- Story runtime: Grok-only text runtime with hard-fail outage policy
- PWA assets: `static/manifest.json`, `static/service-worker.js`

Demo readiness UX:

- Home route (`/`) now includes a "Demo Readiness" progress dashboard backed by `/api/demo/readiness`.
- Score/checks are runtime-derived (provider mode, key presence, outage mode, probe state) so you can quickly gauge demo readiness.
- Debug route (`/debug`) shows persisted runtime/client/API error events to speed up playthrough troubleshooting.

Creator UX:

- New creator workspace routes under `/create/*` guide a safe four-step flow: template selection, draft editing, play preview, and publish/unpublish controls.
- Draft state and published version state are persisted separately in local storage so editing never overwrites deployed versions.
- Clear Draft/Ready/Published badges and publish-time validation messages prevent accidental release of incomplete content.

Play UX:

- `/play` uses a command-deck layout with clearer scene hierarchy, arc progress meter, and keyboard choice shortcuts (`1`, `2`, `3`) for faster turn selection.
- `/play` also exposes quick utility controls (restart current run, jump to `/debug`) plus scene/arc/mood chips so operators can triage runs faster during demos.

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
- `ENABLE_GROK_TEXT`, `ENABLE_GROK_IMAGES`, `ENABLE_PROVIDER_PROBE`: feature toggles (`0`/`1`).
- `AI_AUTH_BYPASS`: disabled in Grok-only mode.
- `GROK_TEXT_MODEL`, `GROK_IMAGE_MODEL`: optional model override strings.
- `AI_MAX_OUTPUT_TOKENS`, `AI_REQUEST_TIMEOUT_MS`, `AI_MAX_RETRIES`: optional reliability tuning.

Default mode policy:

- Text defaults to Grok (`AI Generated` mode in settings).
- Images default to pre-generated/static unless `ENABLE_GROK_IMAGES=1`.
- If Grok is unavailable or misconfigured, requests fail fast (no mock fallback path).

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
npm run test:e2e
```

Notes:

- `npm test` enforces the active-runtime decommission guard (`src/**`, `js/**`, `tests/e2e/**`, and `package.json` must stay free of legacy provider markers).
- `npm run test:narrative` runs deterministic Tier 1 narrative quality gates (prompt wiring, context coverage, continuity dimensions, sanity contract, and fixture-based adversarial checks).
- `npm run test:e2e` runs Playwright against the SvelteKit app.
- `tests/e2e/grok-live.spec.js` is a Grok live canary and runs only when `LIVE_GROK=1` and `XAI_API_KEY` are set.

## PWA

- Manifest: `/manifest.json`
- Service worker: `/service-worker.js`
- Icons served from `/icons/*`

## Docs Map

- Migration plan: `docs/SVELTEKIT_MIGRATION_PLAN.md`
- Grok follow-up plan: `docs/GROK_API_SWITCH_PLAN_POST_SVELTEKIT.md`
- Narrative drift cleanup plan: `docs/NARRATIVE_DRIFT_CLEANUP_EXECUTION_PLAN_2026-02-13.md`
- Narrative drift remaining work: `docs/NARRATIVE_DRIFT_REMAINING_WORK_2026-02-13.md`
- Archived legacy local narrative plan: `docs/archive/2026-02-13_local_narrative_upgrade_plan.md`
- Gemini decommission plan: `docs/GEMINI_DECOMMISSION_EXECUTION_PLAN.md`
