# No Vacancies

Interactive fiction app focused on narrative continuity, reliability, and graceful fallback between AI and mock story services.

## Run

- Dev server (no cache): `npm run dev`
- Static serve: `npm run serve`

## Test Gates

- Lint: `npm run lint`
- Core tests: `npm test`
- E2E tests: `npm run test:e2e`
- Stability loop (optional): `npm run test:e2e:stable`

Notes:
- `tests/e2e/gemini-live.spec.js` is opt-in and skipped unless explicitly enabled.
- Standard `npm test` is deterministic and does not require live network APIs.

## Runtime Feature Flags

Two runtime flags control narrative-upgrade behavior:

- `narrativeContextV2`
- `transitionBridges`

Default state: both enabled.

### Override via URL query params

Use while loading the app:

- `?ffNarrativeContextV2=false`
- `?ffTransitionBridges=false`

Accepted values: `true|false`, `1|0`, `on|off`, `yes|no`, `enabled|disabled`.

### Override via browser console

```js
window.sydneyStory.getFeatureFlags();
window.sydneyStory.setFeatureFlags({ narrativeContextV2: false });
window.sydneyStory.setFeatureFlags({ transitionBridges: false });
window.sydneyStory.clearFeatureFlags();
```

- `setFeatureFlags(...)` persists overrides in `localStorage`.
- `clearFeatureFlags()` removes persisted overrides and returns to defaults (plus any query-param overrides).

## Reliability Invariants

- AI->mock fallback must remain playable (no forced abrupt ending on incompatible IDs).
- Parse recovery must be bounded (no infinite retry loops).
- API keys and sensitive tokens must not be logged or exposed in telemetry.
- Image guardrail must hold (never depict Oswaldo face/bare skin).

## Docs

- Change history: `CHANGELOG.md`
- Durable process lessons: `AI_LESSONS_LEARNED.md`
- Active narrative upgrade plan: `docs/LOCAL_NARRATIVE_UPGRADE_PLAN.md`
