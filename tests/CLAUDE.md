# CLAUDE.md — tests/

Directory-specific reference for the test suite. Extends root `CLAUDE.md` and `AGENTS.md`.

---

## Three-Tier Model

| Tier | Runs on | Blocking? | What it covers |
|------|---------|-----------|----------------|
| **1** | Every PR + push | **Yes** | Contracts, schema, structural narrative gates, decommission guards, build |
| **2** | `main` push / manual dispatch | No | Claude AI prose rubric scoring — non-deterministic, artifact only |
| **3** | `main` push / manual dispatch | No | Live Grok canary — requires `LIVE_GROK=1` + `XAI_API_KEY` |

---

## Tier 1 Full Checklist

These all must pass before merging:

```bash
npm run lint                        # ESLint on tests/ — 0 warnings
npm run check                       # TypeScript + Svelte on src/
npm test                            # noLegacyProviderMarkers.js + storyEngineRuntimeSelection.js
npm run test:narrative              # narrativeQuality.test.js (structural/contract gates)
npm run build                       # Full build — catches $lib/server boundary violations
npx playwright test --config playwright-unit.config.js   # Playwright unit tests
npx playwright test --config playwright.config.js        # E2E demo reliability spec
```

---

## Test File Map

| File | What it guards |
|------|---------------|
| `noLegacyProviderMarkers.js` | No Gemini/mock markers in `src/`; canonical prompt wiring present |
| `storyEngineRuntimeSelection.js` | Default story, explicit `PUBLIC_STORY_ID`, invalid-ID fail-fast |
| `narrative/narrativeQuality.test.js` | Source/contract structural checks — prompt wiring, context fields, narrative floor |
| `e2e/demo-reliability.spec.js` | Full gameplay flow, builder route, nav discoverability |
| `e2e/grok-live.spec.js` | Live Grok canary — only runs with `LIVE_GROK=1` |
| `unit/contextBudget.spec.ts` | Context truncation order (older summaries first, not recent prose) |
| `unit/transitionBridge.spec.ts` | Bridge moments emit only when thread deltas exist |
| `unit/storyRegistry.spec.ts` | Both cartridges load; unknown IDs throw |

---

## Scope of `test:narrative`

`npm run test:narrative` runs **structural and contract gates only** — it is not a fixture-scored prose quality floor. It verifies:
- Prompt assets are wired to the active provider path
- `NarrativeContext` fields are present and correctly shaped
- No legacy duplicate context builders in `narrative.ts`
- Quality-floor strings are not weak fallback placeholders

It does **not** score prose quality, emotional resonance, or voice consistency. That is Tier 2 work (Claude rubric evaluation, non-blocking).

---

## Playwright Conventions

- Single worker (`workers: 1`) — no parallelization
- Headless Chromium only
- `serviceWorkers: 'block'` — isolates tests from offline cache
- baseURL: `http://localhost:8080` (preview server, not dev server)
- `reuseExistingServer: false` in CI
- Traces retained on failure

---

## When to Add Tier 1 vs Tier 2

**Add to Tier 1 when** the check is:
- Deterministic (same input → same result every run)
- Structural (schema shape, file presence, marker absence, import wiring)
- Fast (< 2 seconds per check)

**Add to Tier 2 when** the check is:
- Non-deterministic (AI-evaluated, rubric-scored)
- Taste-based (prose quality, voice consistency, emotional register)
- Requires live API access

Never promote a Tier 2 check to Tier 1. Never add live API calls to Tier 1.

---

## Stop Conditions → see `tests/AGENTS.md`
