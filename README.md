# No Vacancies

No Vacancies is an interactive narrative game about invisible labor and relationship load-bearing.

## Current Stack

- Framework: SvelteKit (TypeScript)
- Deployment target: Vercel
- Story runtime: Mock story service (SvelteKit migration phase)
- PWA assets: `static/manifest.json`, `static/service-worker.js`

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
- `AI_PROVIDER`: `mock` (default) or `grok`.
- `AI_OUTAGE_MODE`: `mock_fallback` or `hard_fail` (required in preview/production).
- `XAI_API_KEY`: required when Grok text/images/probe are enabled.
- `ENABLE_GROK_TEXT`, `ENABLE_GROK_IMAGES`, `ENABLE_PROVIDER_PROBE`: feature toggles (`0`/`1`).
- `AI_AUTH_BYPASS`: local/preview bypass toggle (must remain `0` in production).
- `GROK_TEXT_MODEL`, `GROK_IMAGE_MODEL`: optional model override strings.
- `AI_MAX_OUTPUT_TOKENS`, `AI_REQUEST_TIMEOUT_MS`, `AI_MAX_RETRIES`: optional reliability tuning.

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
- `npm test` runs Node suites for contracts, integration, and renderer-node compatibility checks.
- `npm run test:e2e` runs Playwright against the SvelteKit app.
- `tests/e2e/gemini-live.spec.js` is now a Grok live canary and runs only when `LIVE_GROK=1` and `XAI_API_KEY` are set.

## PWA

- Manifest: `/manifest.json`
- Service worker: `/service-worker.js`
- Icons served from `/icons/*`

## Docs Map

- Migration plan: `docs/SVELTEKIT_MIGRATION_PLAN.md`
- Grok follow-up plan: `docs/GROK_API_SWITCH_PLAN_POST_SVELTEKIT.md`
- Narrative upgrade plan: `docs/LOCAL_NARRATIVE_UPGRADE_PLAN.md`
