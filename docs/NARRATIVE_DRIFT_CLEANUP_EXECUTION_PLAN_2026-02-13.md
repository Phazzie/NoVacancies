# Narrative Drift Cleanup Execution Plan (2026-02-13)

## Purpose
Finish narrative drift cleanup with one canonical narrative-context implementation, structural-only safety gates, and test coverage that enforces the intended architecture.

This plan is decision-complete: implementer should not need to make design choices.

## Current State (Verified)

### 1. Core drift risk still present
`src/lib/game/narrativeContext.ts` and `src/lib/server/ai/narrative.ts` both implement:
- translation maps
- transition map
- beat detection
- context budgeting
- `buildNarrativeContext`
- `detectThreadTransitions`

This keeps two independently editable copies of continuity logic.

### 2. Runtime usage split
- Game runtime uses browser-safe module:
  - `src/lib/game/gameRuntime.ts` -> `buildNarrativeContext`, `detectThreadTransitions`
- Prompt generation still keeps duplicate helper implementations in:
  - `src/lib/server/ai/narrative.ts`

Even if one path is primary, duplicate code increases silent drift risk.

### 3. Safety policy mismatch
`src/lib/server/ai/sanity.ts` currently contains taste heuristics (therapy-speak, banned phrase, evasion regex, apology loop), while project direction is to keep structural checks and move taste enforcement to prompt + QA rubric.

### 4. Test coverage is strong but partially anchored to current duplication
`tests/narrative/narrativeQuality.test.js` currently checks presence of translation maps in `narrativeContext.ts`, but does not explicitly fail if duplicate context logic remains in `narrative.ts`.

### 5. Stale legacy planning doc remains in active docs
`docs/LOCAL_NARRATIVE_UPGRADE_PLAN.md` still references legacy `js/*` architecture and pre-migration assumptions.

---

## Target End State

1. **Single source of truth for context logic**
- Canonical module: `src/lib/game/narrativeContext.ts`
- No duplicate implementation blocks for context logic in `src/lib/server/ai/narrative.ts`

2. **Prompt module owns prompts only**
- `src/lib/server/ai/narrative.ts` keeps:
  - `SYSTEM_PROMPT`
  - `getOpeningPrompt`
  - `getContinuePromptFromContext`
  - `getRecoveryPrompt`
  - prompt formatting helpers that are prompt-specific
- It imports context helpers from canonical module where needed.

3. **Structural-only sanity gate**
- `sanity.ts` keeps only:
  - min scene text length
  - non-ending choice count >= 2
  - max choice count <= 3
  - duplicate choice phrasing
  - soft/hard word-count thresholds (ending vs non-ending)
- Remove taste heuristics:
  - therapy-speak patterns
  - banned phrase patterns
  - apology loop pattern
  - evasion regex

4. **Tests enforce anti-drift architecture**
- Add explicit test assertions that duplicated context implementations do not remain in `narrative.ts`.

5. **Docs reflect active architecture**
- Active cleanup execution plan documented in canonical docs map.

---

## Implementation Plan

## Phase 1: Context Canonicalization

### Changes
1. In `src/lib/server/ai/narrative.ts`, remove duplicate implementations for:
- `NARRATIVE_CONTEXT_CHAR_BUDGET`
- translation maps (`*_TRANSLATIONS`, `BOUNDARY_TRANSLATIONS`, `LESSON_HISTORY_TRANSLATIONS`)
- `TRANSITION_BRIDGE_MAP`
- `translateBoundaries`
- `translateLessonHistory`
- `translateThreadStateNarrative`
- `compressSceneForSummary`
- `detectBeatLabel`
- `buildRecentBeats`
- context budget helpers
- `detectThreadTransitions`
- `buildNarrativeContext`

2. Import only what is required from canonical module:
- from `$lib/game/narrativeContext`

3. Keep prompt text and prompt-building methods intact unless they require helper import rewiring.

### Acceptance criteria
1. `src/lib/server/ai/narrative.ts` no longer contains duplicate context constants/maps/functions listed above.
2. Build passes and prompt behavior remains unchanged for active flow.

---

## Phase 2: Sanity Policy Alignment

### Changes
1. Edit `src/lib/server/ai/sanity.ts` to structural-only checks.
2. Update mirror:
- `tests/narrative/lib/sanityMirror.js`
3. Update adversarial fixtures only where they assert removed heuristic issue IDs:
- `tests/narrative/fixtures/adversarialScenes.json`

### Acceptance criteria
1. `evaluateStorySanity` returns only structural issue IDs.
2. Narrative tests pass with updated fixture expectations.

---

## Phase 3: Anti-Drift Test Hardening

### Changes
1. Extend `tests/narrative/narrativeQuality.test.js` with explicit checks:
- duplicate map/function signatures are absent from `src/lib/server/ai/narrative.ts`
- canonical context helpers remain present in `src/lib/game/narrativeContext.ts`
- runtime/provider import expectations remain valid.

2. Add/expand unit checks (if needed):
- `tests/unit/contextBudget.spec.ts`
- `tests/unit/transitionBridge.spec.ts`

### Acceptance criteria
1. Drift reintroduction in `narrative.ts` fails CI immediately.

---

## Phase 4: Docs and Cleanup

### Changes
1. Update:
- `CHANGELOG.md` (what changed and why)
- `AI_LESSONS_LEARNED.md` (durable anti-drift lesson)
- `README.md` docs map (active cleanup plan reference)
2. Mark stale legacy plan as archived or explicitly non-canonical:
- move `docs/LOCAL_NARRATIVE_UPGRADE_PLAN.md` to `docs/archive/` or add top-of-file deprecation note.

### Acceptance criteria
1. Canonical docs point to active cleanup path.
2. No ambiguity about which plan is current.

---

## Test Execution Matrix

Run after each phase touching code:

1. `npm run lint`
2. `npm test`
3. `npm run check`
4. `npm run test:narrative`
5. `npm run test:e2e` (required for UI/runtime-impacting changes)

Expected result for full cleanup completion:
- all gates pass
- live canary remains opt-in/skipped unless env enabled

---

## Risks and Mitigations

1. Risk: removing duplicated helpers breaks legacy prompt path.
- Mitigation: keep prompt-path tests; verify Grok provider still uses context path.

2. Risk: reducing sanity heuristics lets weak prose through.
- Mitigation: enforce narrative quality via deterministic fixtures + Tier 2 rubric scoring, not regex heuristics.

3. Risk: docs drift reappears.
- Mitigation: one canonical cleanup doc; archive stale plans.

---

## Rollback Plan

1. Revert by phase-level commits:
- Phase 1 revert: restore removed helpers in `narrative.ts` if critical break appears.
- Phase 2 revert: restore prior sanity IDs temporarily while fixtures are corrected.

2. Keep rollback low blast-radius:
- no schema changes
- no API contract changes
- no data migration required

---

## Definition of Done

Narrative drift cleanup is complete when all are true:

1. Context logic exists in one canonical module only (`src/lib/game/narrativeContext.ts`).
2. `src/lib/server/ai/narrative.ts` is prompt-focused and non-duplicative.
3. `sanity.ts` is structural-only.
4. Anti-drift tests fail on duplication reintroduction.
5. Canonical docs reflect the active architecture and cleanup status.

