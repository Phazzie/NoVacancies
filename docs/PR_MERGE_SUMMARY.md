# PR Merge Summary — Open PR Integration

_Date: 2026-03-31_

## Overview

This document summarizes the work done to review, extract, and integrate contributions from 25 open pull requests into the main codebase. Changes were landed on the `copilot/merge-open-prs-and-fix-bugs` branch and validated against the full unit test suite.

---

## PRs Integrated

| PR | Description | Key Files Added/Updated |
|----|-------------|------------------------|
| #36 | Story selectors | `src/lib/stories/selectors.ts`, `tests/unit/stories/selectors.spec.ts` |
| #39 | AI error mapping | `src/lib/server/ai/errors/`, `tests/unit/errors/` |
| #43 | AI builder modules | `src/lib/server/ai/builder/`, `tests/unit/builder/` |
| #45 | Rate limit store (pluggable) | `src/lib/server/rateLimit/`, `tests/unit/rateLimit/` |
| #47 | Grok provider modularization | `src/lib/server/ai/providers/grok/`, `tests/unit/grok/` |
| #48 | Behavior-first unit tests | Various `tests/unit/*.spec.ts` files |
| #50 | JSON extraction utility | `src/lib/server/ai/json/`, `tests/unit/json/` |
| #51 | Scene schema validation | `src/lib/contracts/schemas/scene.ts`, `tests/unit/contracts/` |
| #52 | Telemetry sink abstraction | `src/lib/server/ai/telemetrySink.ts`, `tests/unit/telemetry/` |
| #53 | Builder auth middleware | `src/lib/server/middleware/builderAuth.ts`, `src/routes/api/builder/*/+server.ts` |
| #54 | Builder QA evaluate-draft endpoint | `src/routes/api/builder/evaluate-draft/`, `src/lib/server/ai/builder/draftEvaluator.ts` |
| #55 | CLAUDE.md documentation | `CLAUDE.md` |

---

## Integration Wiring

Beyond new modules, the following existing files were updated to use the new infrastructure:

| File | Change |
|------|--------|
| `src/lib/server/aiRateLimit.ts` | Switched to pluggable `RateLimitStore` via `createRateLimitStore()` |
| `src/hooks.server.ts` | Added `builderAuth` middleware to the `sequence()` pipeline |
| `src/lib/contracts/game.ts` | `validateScene()` / `isScene()` delegate to `contracts/schemas/scene.ts` |
| `src/lib/server/ai/telemetry.ts` | Injectable `TelemetrySink` with console default |
| `src/lib/server/ai/builder.ts` | Delegates draft generation to `builder/` modules |
| `src/lib/server/ai/routeHelpers.ts` | Structured `{ error, code, status }` JSON error payloads |
| `src/lib/game/store.ts` | Uses `mapAiErrorToUserMessage()` for user-facing error strings |
| `src/lib/services/storyService.ts` | Added `ApiStoryServiceError` typed error class |

---

## Test Fixes

Two categories of test failures were found and fixed:

### 1. `narrativeContextAbstraction.spec.ts` — Wrong data source for `recentChoiceTexts`

**Root cause:** `buildNarrativeContext` was reading `recentChoiceTexts` from `gameState.history[].choiceText`, but the test (and the correct source of truth) uses `gameState.sceneLog[].viaChoiceText` — the choice text recorded on each scene log entry.

**Fix:** Updated `src/lib/game/narrativeContext.ts` line 174 to map `sceneLog[].viaChoiceText` through `buildRecentChoiceTexts`.

### 2. `openingThreadUpdate.spec.ts` — Mock scenes missing required schema fields

**Root cause:** The mock opening scenes used in these tests predated the strict `parseScene()` schema validator (added in PR #51). The mocks were missing `imageKey` and `lessonId: null`, which `parseScene` now requires.

**Fix:** Updated mock scene objects in `tests/unit/openingThreadUpdate.spec.ts` to include `imageKey: 'hotel_room'`, `lessonId: null`, and `endingType: null`.

---

## Test Results

All 98 unit tests pass. Smoke tests (`npm test`) pass. Linter (`npm run lint`) passes with zero warnings.

---

## Architecture Notes

- **Grok provider** is now modularized: `transport.ts`, `retryPolicy.ts`, `sceneParser.ts`, `sceneNormalizer.ts` under `src/lib/server/ai/providers/grok/`.
- **Rate limiting** uses a pluggable `RateLimitStore` interface — swap the store without touching middleware.
- **Scene validation** is now centralized in `contracts/schemas/scene.ts` and throws typed `SceneContractError` with `field` and `code` metadata.
- **Telemetry** uses an injectable `TelemetrySink` — default is `console`, can be replaced in tests or future backends.
- **Builder auth** is enforced via a dedicated `builderAuth` Handle middleware, not inline route guards.

---

## Risks Introduced

- `recentChoiceTexts` now draws from `sceneLog` rather than `history`. Both should be in sync during normal gameplay; if they diverge, choice context may drift. The fix is correct per the test contract.
- Strict scene schema validation (PR #51) means any mock or test data that creates a `Scene` object must include all required fields.

---

## Rollback Note

To revert to the pre-merge state, check out the commit immediately before `2749d0c` on `main`. All new modules are additive; removing them does not break existing routes.
