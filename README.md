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

## PWA

- Manifest: `/manifest.json`
- Service worker: `/service-worker.js`
- Icons served from `/icons/*`

## Docs Map

- Migration plan: `docs/SVELTEKIT_MIGRATION_PLAN.md`
- Grok follow-up plan: `docs/GROK_API_SWITCH_PLAN_POST_SVELTEKIT.md`
- Narrative upgrade plan: `docs/LOCAL_NARRATIVE_UPGRADE_PLAN.md`
