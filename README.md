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
npm run test:e2e
```

Notes:
- `npm test` enforces the active-runtime decommission guard (`src/**`, `tests/e2e/**`, and `package.json` must stay Gemini-clean).
- Legacy vanilla-runtime suites remain available under `npm run test:legacy` during transition cleanup only.
- `npm run test:e2e` runs Playwright against the SvelteKit app.
- `tests/e2e/grok-live.spec.js` is a Grok live canary and runs only when `LIVE_GROK=1` and `XAI_API_KEY` are set.

## PWA

- Manifest: `/manifest.json`
- Service worker: `/service-worker.js`
- Icons served from `/icons/*`

## Docs Map

- Migration plan: `docs/SVELTEKIT_MIGRATION_PLAN.md`
- Grok follow-up plan: `docs/GROK_API_SWITCH_PLAN_POST_SVELTEKIT.md`
- Narrative upgrade plan: `docs/LOCAL_NARRATIVE_UPGRADE_PLAN.md`
