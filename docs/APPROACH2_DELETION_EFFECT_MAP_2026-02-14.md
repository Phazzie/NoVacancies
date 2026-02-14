# Approach 2: Deletion + Effect Map (Plain Language)

## Why this exists
You asked what would *actually* change, not just a list of symbols.  
This document shows:
1. what gets deleted,
2. what behavior changes,
3. what behavior stays the same.

## One-line summary
Approach 2 removes old toggle plumbing and extra paths that are already forced on, so the app has one cleaner narrative pipeline.

## What users would notice
1. In normal play, almost nothing should look different.
2. Internally, there are fewer branches where drift can hide.
3. Future edits become safer because there is less duplicate/legacy control flow.

## Deletions and effects

| File | What gets deleted | Practical effect |
|---|---|---|
| `src/lib/contracts/game.ts` | `RuntimeFeatureFlags` fields `narrativeContextV2`, `transitionBridges`; defaults/normalizer tied to those fields | Removes dead config knobs from core types. State shape is simpler and less misleading. |
| `src/lib/contracts/game.ts` | `featureFlags` from `GameState` and `GameSettings` (if we do full cleanup) | Stops carrying runtime toggle state that no longer changes behavior. |
| `src/lib/game/gameRuntime.ts` | Flag-lock code (`narrativeContextV2: true`, `transitionBridges: true`) | No behavior loss, because it was always forcing these to true anyway. |
| `src/lib/game/gameRuntime.ts` | `setFeatureFlags(...)` / `clearFeatureFlags(...)` methods | Removes controls for toggles that are no longer real product options. |
| `src/lib/game/gameRuntime.ts` | `useNarrativeContext: true` option in next-scene call | No behavior loss if service always uses narrative context path. Removes redundant parameter noise. |
| `src/lib/services/settingsStorage.ts` | Feature-flag storage read/write for `narrativeContextV2` + `transitionBridges` | Stops persisting stale toggles in local storage. Less confusing state carryover. |
| `src/lib/services/storyService.ts` | `useNarrativeContext?: boolean` from `StoryServiceOptions` | Removes a legacy switch that no longer changes runtime behavior. |
| `tests/narrative/narrativeQuality.test.js` | Assertions that those flags default to `true` | Tests stop enforcing a field that no longer exists; test focus moves to real behavior. |
| `tests/e2e/demo-reliability.spec.js` | Request payload feature-flag fields for context/bridges | E2E inputs match the simplified contract. |

## What stays exactly the same
1. Canonical narrative text maps in `src/lib/game/narrativeContext.ts`.
2. Active generation path (`getContinuePromptFromContext`) in `src/lib/server/ai/providers/grok.ts`.
3. Structural sanity checks in `src/lib/server/ai/sanity.ts`.
4. Thread updates and transition bridge generation logic as behavior.

## Real behavior difference
1. The app no longer *pretends* those toggles are configurable.
2. There is one official way to run narrative context and transition bridging.

## Risks
1. If any hidden caller still expects `featureFlags` shape, TypeScript/runtime errors will surface.
2. If any test fixture still sends removed fields, tests will fail until updated.

## Why this helps drift cleanup
1. Fewer branches means fewer places for prompt/context behavior to diverge.
2. Fewer persisted toggles means fewer "works on my machine" state bugs.
3. Future narrative tuning focuses on prose/prompt quality, not plumbing ambiguity.

## Rollback plan
1. Revert the cleanup commit.
2. Restore previous contracts/runtime methods/tests unchanged.

