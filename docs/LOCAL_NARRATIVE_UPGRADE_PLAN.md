# Local Narrative Upgrade Plan (Test-First, Low-Debt)

## Objective
Improve narrative quality, continuity, and choice consequence while reducing repetition, without weakening reliability invariants.

## Scope
- Local narrative pipeline only.
- Prompt/content/context/test upgrades only.
- Ignore `grokchangeover.md` for this track.
- Keep image files untouched.

## Out of Scope
- SvelteKit rewrite.
- Provider migration to Grok.
- Broad UI redesign.

## Invariants (Must Never Regress)
- AI->mock fallback remains playable.
- Parse recovery remains bounded.
- No secret leakage.
- Accessibility continuity preserved.
- Image and character continuity guardrails preserved.

---

## Current Status Snapshot
- `DONE` Voice ceiling anchors added to `SYSTEM_PROMPT` and covered by regression test.
- `PENDING` Trina-specific behavior examples in `## TRINA` prompt section.
- `PENDING` Move event-specific lines out of thread-state translations.
- `PENDING` Boundary-specific translation mapping.
- `PENDING` Lesson-history translation map (17 lines).
- `PENDING` Transition-bridge injection on thread jumps only.
- `PENDING` App-owned `NarrativeContext` as single source of truth.
- `PENDING` Context-size/truncation telemetry.

---

## Traceability Map (Do Not Lose Details)

| Asset ID | Source of Truth | Target Location | Test Coverage | Status |
|---|---|---|---|---|
| `TRINA_SNACKCAKE_01` | `docs/HANDWRITTEN_NARRATIVE_ASSETS.md` (`1.2 Trina Tension`) | `js/prompts.js` -> `## TRINA` | `T1.1` | `PENDING` |
| `TRINA_CATFISH_02` | `docs/HANDWRITTEN_NARRATIVE_ASSETS.md` (`1.2 Trina Tension`) | `js/prompts.js` -> `## TRINA` | `T1.1` | `PENDING` |
| `TRINA_REFERRAL_03` | `docs/HANDWRITTEN_NARRATIVE_ASSETS.md` (`1.2 Trina Tension`) | `js/prompts.js` -> `## TRINA` | `T1.1` | `PENDING` |
| `VOICE_CEILING_01` | `docs/HANDWRITTEN_NARRATIVE_ASSETS.md` (`12.1 Gold Lines`) | `js/prompts.js` -> `## VOICE CEILING EXAMPLES` | Existing regression (`Test 8.2`) | `DONE` |
| `BOUNDARY_MAP_01` | `docs/HANDWRITTEN_NARRATIVE_ASSETS.md` (`1.8 Boundaries`) | `js/prompts.js` boundary translation mapping | `T1.3` | `PENDING` |
| `LESSON_HISTORY_01_17` | `docs/HANDWRITTEN_NARRATIVE_ASSETS.md` + `js/lessons.js` | `js/prompts.js` lesson-history context block | `T1.4` | `PENDING` |
| `TRANSITION_BRIDGE_SET` | `docs/HANDWRITTEN_NARRATIVE_ASSETS.md` (`2 Transition Lines`) | `js/app.js` + `js/prompts.js` jump bridge injection | `T3.1`, `T3.2` | `PENDING` |
| `THREAD_GENERALIZATION` | `docs/HANDWRITTEN_NARRATIVE_ASSETS.md` (`1.2 Trina Tension`) | `js/prompts.js` thread-state formatter | `T1.2` | `PENDING` |

Traceability rules:
- Every new handwritten narrative line must get an `Asset ID` row before implementation.
- No prompt content ships without mapped test coverage (`T*`).

---

## Debt Register (Known Technical Debt)
1. Monolithic `SYSTEM_PROMPT` string is hard to evolve safely.
2. App/service narrative memory split risks drift until context unification lands.
3. Prompt assets are not fully modularized (character examples vs state translations vs transitions).
4. Transition logic not yet encoded as explicit runtime contract.
5. No explicit numeric context budget contract persisted in one place.

---

## Best-Process Workflow (Least Technical Debt)
1. Write failing test for one change.
2. Make minimal code/prompt edit.
3. Run `npm run lint` and `npm test`.
4. Commit single-purpose slice.
5. Update docs in same slice (`CHANGELOG.md`, `AI_LESSONS_LEARNED.md` when applicable).
6. Never mix refactor + behavior + docs in one large commit.

---

## Review, Critique, Revise Loop (Required per Phase)

Each phase requires two RCR passes:
- Pre-phase RCR: risk forecast before implementation starts.
- Pre-close RCR: critique after implementation and before phase close.

Mandatory critique questions (must be answered in every phase):
- What would a group of haters say about the work I just did?
- Which part is most likely to fail silently?
- What did we assume without proof?
- Which specific test ID (`T*`) would fail first if we are wrong?

Completion gate:
- A phase cannot close unless Review, Critique, and Revise are all documented.
- Critique comments must reference specific test IDs (`T*`) and resulting changes.

Required artifact per phase:
- `Phase Review Note` including:
  - issues found
  - plan delta
  - test delta
  - rollback impact

---

## Phase-by-Phase Test Matrix

## Phase 0: Baseline Lock
Goal: Freeze behavior and establish green baseline before narrative edits.

- `T0.1` Baseline lint/test gate
  - Command: `npm run lint`, `npm test`
  - Pass: all green
  - Blocks release: yes

- `T0.2` Existing invariants still enforced
  - Test area: fallback, parse recovery, anti-repeat suites
  - Pass: invariant tests green
  - Blocks release: yes

## Phase 1: Prompt Content Hardening
Goal: Improve narrative quality with minimal architecture risk.

- `T1.1` Trina behavior examples present in `SYSTEM_PROMPT`
  - File: `js/prompts.js`, `tests/integrationTest.js`
  - Assert: prompt includes snack-cake, catfish, and casino-referral behaviors
  - Blocks release: yes

- `T1.2` Thread translations remain general (non-factual event injection)
  - File: `js/prompts.js`, `tests/integrationTest.js`
  - Assert: `trinaTension` state lines do not assert specific past events as already happened
  - Blocks release: yes

- `T1.3` Boundary translation map exists
  - File: `js/prompts.js`, `tests/integrationTest.js`
  - Assert: known boundaries map to deterministic narrative lines
  - Blocks release: yes

- `T1.4` Lesson-history translation map complete
  - File: `js/prompts.js`, `tests/integrationTest.js`
  - Assert: 17 entries exist; each entry non-empty
  - Blocks release: yes

- `T1.5` Utility lines tuned for high-frequency reuse
  - File: `js/prompts.js`
  - Assert: unresolved-money line is concise and stable
  - Blocks release: no

## Phase 2: Context Ownership Unification
Goal: Remove split-brain memory and centralize AI context.

- `T2.1` `NarrativeContext` contract defined and validated
  - File: `js/contracts.js`, `tests/integrationTest.js`
  - Assert: context object shape required fields validated
  - Blocks release: yes

- `T2.2` App builds and passes context each turn
  - File: `js/app.js`, `js/services/geminiStoryService.js`, tests
  - Assert: service receives app-built context; no missing required sections
  - Blocks release: yes

- `T2.3` Compatibility seam works with feature flag off/on
  - File: app/service/tests
  - Assert: parity behavior when flag off; upgraded behavior when flag on
  - Blocks release: yes

- `T2.4` Context budget enforcement
  - File: prompt/context builder/tests
  - Assert: last 2 full scenes + compressed older summary under cap
  - Blocks release: yes

## Phase 3: Transition Bridges + Anti-Repetition
Goal: Make state jumps feel earned and reduce narrative repetition.

- `T3.1` Transition bridge appears only on state jumps
  - File: app/prompt/tests
  - Assert: jump from X->Y injects bridge text
  - Blocks release: yes

- `T3.2` No bridge on stable state
  - File: app/prompt/tests
  - Assert: unchanged state does not inject bridge text
  - Blocks release: yes

- `T3.3` Anti-repetition checks remain active
  - File: service/tests
  - Assert: repeated openings/choice near-duplicates still fail quality gate
  - Blocks release: yes

## Phase 4: Telemetry + Tuning
Goal: Tune using evidence, not anecdote.

- `T4.1` Telemetry emits context/truncation metrics
  - File: `js/services/aiTelemetry.js` + tests
  - Assert: metrics emitted with stable schema
  - Blocks release: no

- `T4.2` Telemetry has no sensitive payload leakage
  - File: telemetry tests
  - Assert: no API key/secret values in logs
  - Blocks release: yes

- `T4.3` Quality smoke playthrough batch
  - Method: scripted or guided playthrough sample set
  - Assert: reduced repetition and no fallback regression
  - Blocks release: yes

---

## Release Gates (Per Phase)
- Must pass: `npm run lint`
- Must pass: `npm test`
- Must pass: `npm run test:e2e` when renderer/e2e behavior is touched
- Must include: docs updates for behavior-affecting changes

---

## Commit Policy
1. One behavior slice per commit.
2. Tests committed with behavior change (same commit).
3. Docs committed with behavior change (same commit).
4. Revertable by commit without cross-slice breakage.

---

## What a Hostile Reviewer Would Say
- "This is over-engineering prompt glue instead of fixing model quality."
- "You are adding layers (context objects, transitions, lesson maps) that can drift and rot."
- "Feature flags and seams will become permanent dead weight."
- "Manual hand-written assets are subjective and expensive to maintain."
- "You are optimizing for tests that check strings, not true story quality."

## Response / Mitigations
- Keep each layer narrowly scoped and test-backed; remove old paths after stabilization window.
- Add explicit cleanup milestone for flags/seams in the plan before Phase 4 close.
- Keep manual assets in one source file and treat them as product copy, not code logic.
- Combine structural tests with playthrough quality review rubric to avoid false confidence.
- Use telemetry to confirm outcome changes (repetition rate, retry rate, fallback rate) instead of relying on vibes.

---

## Rollback Plan
- Revert by phase commit group.
- If narrative quality dips, disable new context/transition behaviors and restore prior prompt set.
- Keep invariant tests as stop-ship guardrails.
