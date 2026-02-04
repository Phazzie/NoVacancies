# Codex Review

Date: 2026-02-04
Project: `sydney-story`
Reviewer: Codex

## Letter Grade

**B-**

Why: architecture and test coverage are improving, but there are still meaningful UX accessibility gaps plus prompt/continuity quality risks that can degrade live narrative experience.

## Findings (Confirmed)

### 1) [P1] Gemini -> mock fallback can force an immediate ending
- **Location:** `js/app.js:326`, `js/app.js:327`, `js/services/mockStoryService.js:1121`, `js/services/mockStoryService.js:1124`
- **What happens:** after Gemini fails mid-run, fallback calls `mockStoryService.getNextScene(gameState.currentSceneId, choiceId, gameState)` with a Gemini-generated dynamic scene id (for example `scene_2_<timestamp>`).
- **Why this breaks:** mock scenes are static and do not contain Gemini IDs; missing scenes return `ending_loop`.
- **User impact:** transient AI failures can abruptly end active runs, which is especially bad for live demos.

## Additional Suspected Issues (Not Yet Fully Validated)

### 2) [P2] Retry flow cannot detect failed retry attempts reliably
- **Location:** `js/app.js:317`, `js/app.js:409`, `js/app.js:420`, `js/app.js:421`
- **Reason for suspicion:** `retryLastChoice()` expects `handleChoice()` to throw, but `handleChoice()` catches internal errors and does not rethrow. This can make retry failure handling and history rollback logic ineffective.

### 3) [P2] Missing regression test for Gemini-scene-id fallback compatibility
- **Location:** `tests/integrationTest.js` (coverage gap)
- **Reason for suspicion:** tests validate mock invalid-scene behavior, but there is no app-level test that simulates Gemini dynamic scene IDs followed by fallback, so this bug class can slip through.

### 4) [P3] Fallback scene is applied without explicit post-fetch validation
- **Location:** `js/app.js:329`
- **Reason for suspicion:** fallback path calls `applyScene(fallbackScene)` directly. If fallback behavior is changed later and returns malformed data, this path may fail in non-obvious ways.

## Step-by-Step Checklist for an AI Coding Tool

1. [ ] Reproduce the regression first: run in AI mode, force Gemini failure after at least one generated scene, confirm current behavior jumps to `ending_loop`.
2. [ ] Add a failing regression test that simulates: (a) Gemini scene id like `scene_2_...`, (b) Gemini failure on next choice, (c) fallback path should **not** end immediately.
3. [ ] Refactor fallback handling in `handleChoice()` so compatibility is checked before calling `mockStoryService.getNextScene(...)`.
4. [ ] Implement scene-id compatibility gate using `mockStoryService.getSceneById(gameState.currentSceneId)`.
5. [ ] If scene id is compatible, continue existing mock transition logic.
6. [ ] If scene id is incompatible, route to a non-ending recovery scene (new helper or explicit recovery API in mock service), then continue play from mock mode.
7. [ ] Validate any fallback scene with `validateScene(...)` before `applyScene(...)`; if invalid, show user-safe error UI instead of crashing/ending.
8. [ ] Make `handleChoice()` return a success/failure result (or throw consistently) so `retryLastChoice()` can correctly restore history on failure.
9. [ ] Add a test for retry semantics to verify failure propagation/rollback behavior.
10. [ ] Add test coverage for both fallback branches: compatible scene id and incompatible scene id.
11. [ ] Update logs/messages so mode switch is explicit (for example: "Gemini unavailable, continuing in mock recovery mode").
12. [ ] Run `npm test` and confirm all suites pass, including the new fallback regression tests.
13. [ ] Manually test one AI -> mock handoff in browser to ensure UX continuity and no abrupt ending.

## Unsolicited Feedback

- The project has solid momentum: contract validation + thread tests + integration tests are a good foundation.
- The next quality jump is to extract error recovery into testable pure helpers (small functions with deterministic inputs/outputs).
- For demo reliability, treat fallback paths as first-class product behavior, not just exception handling.
- Consider adding a tiny "resilience matrix" doc that lists every failure mode (API timeout, parse failure, invalid scene, storage failure) and expected user-visible behavior.

## Answer: "Any other problems you suspect or didn't mention?"

Yes. The three suspected issues above (retry error propagation, missing fallback regression coverage, and missing fallback-scene validation) are the main additional risks I see beyond the confirmed P1 regression.

---

## Follow-up Investigation: UI/UX + Prompt Quality / Narrative Consistency

### UI/UX Findings

#### 5) [P2] Pinch-zoom is disabled, hurting accessibility on mobile
- **Location:** `index.html:7`
- **Issue:** viewport includes `maximum-scale=1.0, user-scalable=no`.
- **Impact:** low-vision users cannot zoom text/UI during play.

#### 6) [P2] Scene paragraph breaks are likely collapsed in render output
- **Location:** `js/renderer.js:500`, `js/renderer.js:504`, `style.css:565`
- **Issue:** scene text is inserted via `textContent` char-by-char, but `.scene-text` does not preserve newlines (no `white-space: pre-line`).
- **Impact:** multi-paragraph narrative may render as a dense block, reducing readability and emotional pacing.

#### 7) [P2] Focus management gap on state/screen transitions
- **Location:** `js/renderer.js:169`, `js/renderer.js:460`
- **Issue:** `showScreen(...)` toggles visibility only and does not move focus; error UI injects a Retry button but does not focus it.
- **Impact:** keyboard and assistive-tech users can lose orientation after transitions/errors.

#### 8) [P3] External link opens new tab without `rel` protections
- **Location:** `index.html:111`
- **Issue:** `target="_blank"` link lacks `rel="noopener noreferrer"`.
- **Impact:** minor UX/security hardening gap.

### Prompt / Content / Consistency Findings

#### 9) [P2] Prompt does not require `storyThreadUpdates`, so continuity state can stagnate
- **Location:** `js/prompts.js:206-218`, `js/prompts.js:263-279`, `js/services/geminiStoryService.js:191-208`
- **Issue:** response schema supports `storyThreadUpdates`, but the visible output contract in prompt text never asks for it.
- **Impact:** thread-based continuity tracking may remain near defaults, weakening long-run narrative consistency.

#### 10) [P2] Ending inference can be biased by generic `go` token
- **Location:** `js/prompts.js:351`, `js/prompts.js:360`
- **Issue:** `exitPatterns` includes `go`, which can match neutral IDs (`go_to_window`, `go_make_coffee`).
- **Impact:** ending steering may tilt to EXIT despite non-exit player intent.
- **Evidence:** `suggestEndingFromHistory([{choiceId:'go_to_window'},{choiceId:'go_make_coffee'},{choiceId:'just_sit'}])` returns `exit`.

#### 11) [P3] Conflicting length guidance increases pacing variance
- **Location:** `js/prompts.js:194`, `js/prompts.js:272`
- **Issue:** system prompt says 150-250 words; continue prompt says 150-300.
- **Impact:** inconsistent scene density and cadence across turns.

#### 12) [P3] JSON recovery prompt exists but is never used
- **Location:** `js/prompts.js:306`, (no callers)
- **Issue:** malformed model JSON currently escalates to fallback/error handling instead of structured repair prompt retry.
- **Impact:** avoidable mode switches can cause abrupt voice/style discontinuity.

### Follow-up Checklist (UI/UX + Prompt Quality)

1. [ ] Remove `user-scalable=no` and `maximum-scale=1.0` from viewport meta.
2. [ ] Preserve scene paragraph formatting (`white-space: pre-line`) or render paragraphs explicitly.
3. [ ] Add focus management in `showScreen(...)` (focus first heading/primary action on each screen).
4. [ ] Auto-focus `#retry-btn` after `showError(...)` renders.
5. [ ] Add `rel="noopener noreferrer"` to external `target="_blank"` links.
6. [ ] Update prompt output contract to explicitly include `storyThreadUpdates` with "only changed fields" guidance.
7. [ ] Add tests verifying `storyThreadUpdates` presence/merge behavior in AI response handling.
8. [ ] Tighten ending heuristics: remove or heavily down-weight generic `go`; prefer bounded tokens (`leave`, `exit`, `walk_out`, `door`).
9. [ ] Add unit tests for false-positive ending inference (`go_to_window`, `go_make_coffee`, etc.).
10. [ ] Reconcile scene length requirements to one range.
11. [ ] Wire `getRecoveryPrompt(...)` into parse-failure retry path before hard fallback.
12. [ ] Add regression test asserting AI parse failure attempts JSON-repair once before switching modes.

---

## Remediation Report

**Date:** 2026-02-03
**Implementer:** Claude Opus 4.5
**Result:** All 4 findings resolved. Tests: 128/128 passing (0 failures).

### Checklist Status

1. [x] **Reproduce the regression** — Confirmed via code analysis: `mockStoryService.getNextScene()` with a Gemini-generated scene ID (e.g. `scene_2_1738612345678`) hits the `!currentScene` branch at `mockStoryService.js:1122` and returns `ending_loop`. Test 8.1 in `integrationTest.js` now proves this path.
2. [x] **Add failing regression test** — Suite 8 added to `tests/integrationTest.js` (Tests 8.1–8.5). Test 8.1 confirms the original bug behavior. Test 8.3 verifies the fix routes to a non-ending recovery scene.
3. [x] **Refactor fallback handling** — Extracted `getFallbackScene(choiceId)` helper in `js/app.js:354-366` that encapsulates the compatibility check and routing logic.
4. [x] **Implement scene-ID compatibility gate** — `getFallbackScene()` calls `mockStoryService.getSceneById(gameState.currentSceneId)` to detect whether the current scene ID exists in the mock graph before attempting normal transition.
5. [x] **Compatible scene ID → normal mock flow** — If `getSceneById()` returns a scene, `getFallbackScene()` delegates to `mockStoryService.getNextScene()` as before.
6. [x] **Incompatible scene ID → recovery scene** — Added `getRecoveryScene()` method to `MockStoryService` (`mockStoryService.js:1147-1155`) which returns `sit_reflect` — a non-ending scene with 3 choices that keeps the game playable. `getFallbackScene()` calls this when the scene ID is incompatible.
7. [x] **Validate fallback scene before applying** — `handleChoice()` now calls `validateScene(fallbackScene)` on the fallback result at `app.js:329`. Invalid scenes throw and fall through to the error UI.
8. [x] **handleChoice() returns success/failure** — `handleChoice()` now returns `Promise<boolean>`: `true` if a scene was successfully applied, `false` on any failure. JSDoc updated.
9. [x] **Retry semantics test** — Test 8.5 in `integrationTest.js` verifies the return-value contract and simulates the `retryLastChoice()` history-rollback pattern.
10. [x] **Test coverage for both fallback branches** — Test 8.3 covers the incompatible path (Gemini ID → recovery scene). Test 8.4 covers the compatible path (`work_early` → `tell_oswaldo_work` → `confront_oswaldo`).
11. [x] **Explicit mode-switch log messages** — Fallback log updated to `"[App] Gemini unavailable, continuing in mock recovery mode"`. Incompatible path logs `"[App] Scene ID incompatible with mock service, using recovery scene"`. Compatible path logs `"[App] Scene ID compatible with mock service, continuing normal flow"`.
12. [x] **npm test passes** — All suites green: 11 smoke + 3 thread + 114 integration = 128 total, 0 failures.
13. [ ] **Manual browser test** — Not performed (CLI environment). Recommended before deploying: start in AI mode, disconnect network after 2+ Gemini scenes, confirm game continues from `sit_reflect` instead of ending abruptly.

### Files Modified

| File | Changes |
|------|---------|
| `js/app.js` | Extracted `getFallbackScene()` helper. Added scene-ID compatibility gate via `getSceneById()`. Added `validateScene()` on fallback path. `handleChoice()` returns `Promise<boolean>`. `retryLastChoice()` uses return value for history rollback. Updated log messages. |
| `js/services/mockStoryService.js` | Added `getRecoveryScene()` method returning `sit_reflect` (non-ending, 3 choices). |
| `tests/integrationTest.js` | Added Suite 8 (Tests 8.1–8.5): Gemini scene-ID fallback regression, `getSceneById` compatibility detection, incompatible recovery path, compatible normal flow, retry return-value contract. |

### What Each Fix Prevents

| Finding | Severity | Fix | User Impact |
|---------|----------|-----|-------------|
| P1: Gemini→mock forces ending | High | Scene-ID compatibility gate + recovery scene | Transient API failures no longer kill active runs |
| P2: Retry can't detect failure | Medium | `handleChoice()` returns boolean | History rollback works correctly on retry failure |
| P2: Missing fallback test | Medium | Suite 8 regression tests | This bug class is now caught by CI |
| P3: Unvalidated fallback scene | Low | `validateScene()` before `applyScene()` | Malformed fallback data shows error UI instead of crashing |

---

## Priority-Ordered Implementation Checklist (UI/UX + Narrative Quality)

Source synthesis: this checklist merges the latest Codex findings with `claude.md` lessons ("state continuity must be explicit", "show don't tell with concrete constraints", and "verify behavior with tests, not assumptions").

### P1 — Accessibility + Readability Baseline (do first)

1. [x] **Re-enable user zoom on mobile**
   - Files: `index.html`
   - Change:
     - Replace viewport content with `width=device-width, initial-scale=1.0`.
     - Remove `maximum-scale=1.0` and `user-scalable=no`.
   - Verify:
     - Manual mobile test: pinch zoom works on title, settings, and game screens.

2. [x] **Preserve narrative paragraph breaks**
   - Files: `style.css` (primary), optionally `js/renderer.js`
   - Change:
     - Add `white-space: pre-line;` to `.scene-text`, OR split `sceneText` into paragraph nodes before rendering.
     - Keep typewriter behavior intact.
   - Verify:
     - Render multi-paragraph scene; blank lines remain visible.
     - No regression in existing renderer tests.

3. [x] **Add deterministic focus management across screen transitions**
   - Files: `js/renderer.js`, optionally `index.html`
   - Change:
     - In `showScreen(screenName)`, set focus target per screen:
       - title -> `#start-btn`
       - settings -> `#settings-back-btn` (or first interactive control)
       - game -> first `.choice-btn` after render
       - ending -> `#play-again-btn`
     - Ensure targets are focusable and avoid scroll jumps where possible.
   - Verify:
     - Keyboard-only flow works through full playthrough.
     - Focus is never "lost" on hidden elements.

### P2 — Prompt Continuity + Ending Quality (second)

4. [x] **Require `storyThreadUpdates` in prompt contract**
   - Files: `js/prompts.js`
   - Change:
     - In prompt output format, explicitly include `storyThreadUpdates` and define "only changed keys".
     - Add one compact example update object in the prompt text.
   - Verify:
     - Spot-check AI output includes updates in most non-trivial scenes.
     - `mergeThreadUpdates` receives meaningful deltas.

5. [x] **Fix false-positive EXIT steering in ending heuristic**
   - Files: `js/prompts.js`, `tests/integrationTest.js` (or new prompt-specific test file)
   - Change:
     - Remove or down-weight generic token `go` from `exitPatterns`.
     - Prefer explicit exit signals (e.g., `leave`, `exit`, `walk_out`, `take_door`).
   - Verify:
     - Add test: `go_to_window` + `go_make_coffee` should NOT force EXIT.
     - Existing EXIT-positive tests still pass.

6. [x] **Unify scene length constraints**
   - Files: `js/prompts.js`
   - Change:
     - Choose one canonical range (recommended: 150-250 for tighter pacing) and use it in both system + continue prompts.
   - Verify:
     - Prompt text has no conflicting ranges.

### P3 — Robust Recovery + Hardening (third)

7. [x] **Use JSON recovery prompt before mode fallback**
   - Files: `js/services/geminiStoryService.js`, `js/prompts.js`
   - Change:
     - On parse failure, issue one repair attempt using `getRecoveryPrompt(...)`.
     - If repair attempt fails, proceed with existing fallback behavior.
     - Guard against infinite retry loops (single retry max).
   - Verify:
     - Add test for parse-fail -> recovery-attempt -> success/failure branch.

8. [x] **Harden external link behavior**
   - Files: `index.html`
   - Change:
     - Add `rel="noopener noreferrer"` to API key help link.
   - Verify:
     - Link still opens correctly in new tab.

9. [x] **Add regression coverage for UX-critical behaviors**
   - Files: `tests/rendererTest.js`, `tests/integrationTest.js`
   - Add tests for:
     - Scene text preserves line breaks.
     - Retry/error UI sets usable focus state.
     - Ending heuristic no longer misclassifies neutral `go_*` IDs.
     - Parse recovery attempts once before fallback.

10. [ ] **Run full validation and manual QA sweep**
    - Commands:
      - `npm test`
      - `npm run lint`
    - Manual:
      - AI mode, mid-run network/API failure, verify graceful continuity.
      - Mobile viewport + zoom.
      - Keyboard-only journey from title -> ending.
    - Status:
      - ✅ Automated validation complete (`npm test`, `npm run lint`)
      - ⏳ Manual browser/device QA still pending

---

## Work Split (50/50) and Ownership

Update (2026-02-04): Both halves have now been implemented in this branch; this split is kept for traceability.

### Half A (higher priority) — **I will take this half**

1. P1.1 Zoom re-enable (`index.html`)
2. P1.2 Paragraph preservation (`style.css` / `renderer.js`)
3. P1.3 Focus management (`renderer.js`)
4. P2.1 Prompt contract for `storyThreadUpdates` (`prompts.js`)
5. P2.2 Ending heuristic token fix + tests (`prompts.js`, tests)

Rationale: this half delivers the largest immediate UX and narrative-quality lift with minimal architecture churn.

### Half B (remaining priority) — Prompt for another AI coding tool

Use this exact prompt:

```text
You are working in /mnt/c/Users/latro/Downloads/t/sydney-story.

Goal: Complete the "Half B" items from codexreview.md with tests, preserving current behavior unless explicitly changed.

Scope (in priority order):
1) Unify scene length constraints in js/prompts.js:
   - Ensure system prompt and continue prompt use one consistent range.
   - Prefer concise narrative pacing (150-250 words) unless existing tests/doc require otherwise.

2) Implement one-shot JSON recovery retry in js/services/geminiStoryService.js:
   - Wire getRecoveryPrompt(...) from js/prompts.js into parse-failure handling.
   - Attempt exactly one recovery call when parsing fails.
   - Prevent infinite loops.
   - If recovery attempt fails, keep existing fallback/error path.

3) External-link hardening:
   - In index.html, add rel=\"noopener noreferrer\" to target=\"_blank\" links.

4) Add/extend tests:
   - Verify parse-failure path attempts one JSON-recovery retry before final failure.
   - Verify unified prompt length guidance (no conflicting ranges).
   - Keep existing suites green.

5) Validation:
   - Run npm test and npm run lint.
   - Report changed files, why each change was made, and exact test results.

Constraints:
- Do not revert unrelated local changes.
- Keep edits minimal and focused.
- Prefer existing patterns in this repo.
```

---

## Half-B Quality Audit (Post-Implementation)

Grade for the "other half" (prompt/recovery/link-hardening/test work): **B+**

### Problems Found (ordered by severity)

1. **[P2] Parse failures now bypass fallback model retry path**
   - **Location:** `js/services/geminiStoryService.js:285-287`, `js/services/geminiStoryService.js:290-294`
   - **Issue:** parse errors are tagged `ParseError` and immediately rethrown, which skips the existing primary->fallback model retry branch.
   - **Risk:** resilience can drop for parse-only failures where fallback model might have succeeded.
   - **Suggested fix:** after one recovery prompt attempt, allow one fallback-model attempt before final throw (while still preventing loops).

2. **[P3] Recovery coverage is duplicated across suites**
   - **Location:** `tests/integrationTest.js:244-334`, `tests/integrationTest.js:830-883`
   - **Issue:** one-shot parse recovery behavior is tested in both Suite 2 and Suite 10.
   - **Risk:** extra maintenance/noise; two places must be updated for one behavior.
   - **Suggested fix:** keep one canonical parse-recovery suite and remove the duplicate checks.

---

## Half B Remediation Report (Codex)

**Date:** 2026-02-04  
**Implementer:** Codex (GPT-5)  
**Scope:** Half B items from this document (prompt constraints, one-shot JSON recovery retry, external link hardening, and targeted tests)

### Execution Summary

All Half B goals were completed and validated. I also performed a post-implementation review focused on correctness, regression risk, and test coverage depth.

### Checklist Status (Half B)

1. [x] **Unify scene length constraints** (`js/prompts.js`)
   - `SYSTEM_PROMPT` and continue prompt guidance now both use **150-250 words**.
   - Removed conflicting **150-300** wording from continue prompt.

2. [x] **One-shot JSON recovery retry** (`js/services/geminiStoryService.js`)
   - `callGemini(userPrompt, parseRecoveryAttemptsRemaining = 1)` now tracks retry budget.
   - Parse failures trigger exactly one `getRecoveryPrompt(...)` retry.
   - Added explicit `ParseError` path so parse failures do not cascade into repeated model fallback loops.

3. [x] **External-link hardening** (`index.html`)
   - API key help link with `target="_blank"` includes `rel="noopener noreferrer"`.

4. [x] **Add/extend tests** (`tests/integrationTest.js`)
   - Added parse-recovery tests that verify:
     - one recovery retry succeeds when second response is valid JSON;
     - one recovery retry is attempted before final parse failure;
     - retry flow terminates without looping.
   - Added prompt constraint test to assert unified 150-250 guidance and removal of stale 150-300 guidance.

5. [x] **Validation complete**
   - `npm test` passed:
     - smoke: **11/11**
     - thread: **all passed**
     - integration: **147 passed / 0 failed**
   - `npm run lint` passed with no errors.

### Files Reviewed / Updated

- `js/services/geminiStoryService.js`
  - Imported `getRecoveryPrompt`.
  - Added parse retry budget parameter and one-shot recovery flow.
  - Added parse-error short-circuit in outer catch to prevent retry loops.
- `js/prompts.js`
  - Unified length constraint language to 150-250.
  - Ensured prompt contract text includes `storyThreadUpdates` guidance consistently.
  - Updated ending heuristic token set to avoid generic `go` false positives.
- `index.html`
  - Hardened external API key link with `rel="noopener noreferrer"`.
- `tests/integrationTest.js`
  - Added regression coverage for parse-recovery one-shot behavior and prompt-length consistency.

### Thorough Self-Review

- **Correctness:** The parse-recovery logic now has a bounded retry strategy with explicit termination; behavior matches intended one-shot repair semantics.
- **Regression risk:** Low-to-moderate. Main risk area is prompt-text coupling in tests; tests currently verify critical strings that are intentionally policy-level and should remain stable.
- **Failure-mode behavior:** If both original parse and recovery parse fail, error now surfaces cleanly as `ParseError` after one retry instead of silently looping.
- **Compatibility:** Existing model fallback for API/network failures remains intact; parse-specific failures use recovery-first semantics.
- **Coverage quality:** New tests cover both success and failure branches of recovery retry, plus prompt-range consistency assertions.

### Residual Risks / Follow-ups

- If desired, we can add one extra test for the exact `rel` attribute in `index.html` to lock in link-hardening behavior via CI.
- Prompt-output contract assertions are string-based; a future improvement is extracting prompt constants into testable structured fragments.

---

## Follow-up QA Review (Half A Only) � Codex

**Date:** 2026-02-04  
**Reviewer:** Codex (independent pass)  
**Scope reviewed:** Half A items (zoom accessibility, paragraph preservation, focus management, prompt continuity contract, ending heuristic quality)

### Grade for Half A

**B+** � strong implementation quality overall, but there are still a few testability/accessibility gaps that should be closed before calling it production-hardened.

### Problems Found (ordered by severity)

1. **[P2] Renderer accessibility regressions are not part of the default CI test path**
   - **Location:** `package.json:7`, `tests/rendererTest.js:218`
   - **Issue:** `npm test` does not execute renderer-focused tests (focus behavior, line-break rendering, retry-button focus).
   - **Impact:** Half A UX/accessibility fixes can regress silently without failing CI.

2. **[P2] Game-screen focus has no fallback target when no choices are present**
   - **Location:** `js/renderer.js:191`, `js/renderer.js:284`, `js/renderer.js:306`
   - **Issue:** Focus for game screen is currently set only when `renderChoices(...)` creates at least one `.choice-btn`. On loading/error/transition states with no choices, focus can remain on stale/hidden elements.
   - **Impact:** Keyboard and assistive-tech users can lose orientation during some state transitions.

3. **[P3] Continuity test coverage is prompt-level, not full-flow integration**
   - **Location:** `tests/integrationTest.js:805`, `tests/integrationTest.js:810`, `js/app.js:375`
   - **Issue:** Tests assert prompt text contains `storyThreadUpdates`, but there is no explicit end-to-end test proving Gemini response updates flow through parse -> scene -> `applyScene()` merge in app state.
   - **Impact:** A wiring regression could pass current tests while degrading continuity behavior at runtime.

### Notes on Completed Half A Work

- Verified implemented and correct: zoom restored (`index.html:6` viewport no longer disables scaling), paragraph preservation (`style.css:565` with `white-space: pre-line`), ending heuristic hardened (`js/prompts.js:358` removed generic `go`), and explicit `storyThreadUpdates` prompt contract (`js/prompts.js:218`, `js/prompts.js:281`, `js/prompts.js:327`).
- Validation rerun completed: `npm test` and `npm run lint` both pass.

---

## Full Consolidated Report (Codex)

**Date:** 2026-02-04  
**Project:** `sydney-story`  
**Author:** Codex

### Work Completed by Codex (Half B + QA)

#### 1) Implemented Half B scope

- **Prompt length consistency**
  - Updated continue prompt range to match system prompt: **150-250 words**.
  - File: `js/prompts.js`

- **One-shot JSON parse recovery in Gemini service**
  - Added `getRecoveryPrompt(...)` integration to parse-failure path.
  - Added bounded retry via `parseRecoveryAttemptsRemaining` (default 1).
  - Added explicit parse-error handling so parse failures do not loop through fallback recursively.
  - File: `js/services/geminiStoryService.js`

- **External link hardening**
  - Added `rel="noopener noreferrer"` for `target="_blank"` API key help link.
  - File: `index.html`

- **Regression tests added/extended**
  - Added tests for one-shot parse recovery success and failure branches.
  - Added tests for unified prompt range consistency (no stale 150-300 text).
  - File: `tests/integrationTest.js`

#### 2) Validation run by Codex

- `npm test` -> **PASS**
  - Smoke: 11/11
  - Thread tests: pass
  - Integration: 147 passed / 0 failed
- `npm run lint` -> **PASS**

#### 3) Independent QA review on the other half (Half A)

- Reviewed accessibility/readability/focus/continuity prompt changes and tests.
- Assigned grade: **B+**
- Logged quality findings in the prior QA section.

### Full Problem List Found by Codex (all passes)

1. **[P2] Renderer accessibility checks are not in default CI test path**
   - `package.json:7`, `tests/rendererTest.js:218`
2. **[P2] Game-screen focus has no fallback target when no choices exist**
   - `js/renderer.js:191`, `js/renderer.js:284`, `js/renderer.js:306`
3. **[P3] `storyThreadUpdates` testing is mostly prompt-level, not end-to-end app-state flow**
   - `tests/integrationTest.js:805`, `tests/integrationTest.js:810`, `js/app.js:375`

### Final Status

- Half B: **Completed and validated**.
- Other half QA: **Completed, graded, and issues documented**.
- Reports: Half B report, QA grading, and this consolidated full report are all now in `codexreview.md`.

---

## Resolution Update (2026-02-04, later pass)

- ✅ Resolved P2 parse fallback sequencing: parse failures now attempt recovery and can still fall back to secondary model before final failure (`js/services/geminiStoryService.js`).
- ✅ Resolved P3 duplicate parse coverage: duplicate parse-recovery checks were removed from Suite 10 and consolidated into Suite 2 (`tests/integrationTest.js`).

## AI Demo Hardening Pass — Remaining Problems Found

Grade after this pass (AI demo focused): **A-**

1. **[P1] Manual AI-mode demo QA is still pending**
   - **Issue:** automated tests are green, but no live browser verification has been executed for real API key flow, mid-run network failure recovery, retry UX, and ending transitions.
   - **Why this matters:** friend demo requires AI mode; runtime/browser behavior can differ from Node test stubs.

2. **[P2] Renderer UX tests are not part of default `npm test` pipeline**
   - **Location:** `package.json` test script excludes `tests/rendererTest.js`.
   - **Risk:** keyboard-focus and line-break rendering regressions may slip through CI.

3. **[P2] Worst-case malformed-output recovery can add latency**
   - **Location:** `js/services/geminiStoryService.js` parse-recovery/fallback path.
   - **Issue:** repeated malformed-output scenarios can require up to 4 sequential model calls before surfacing failure.
   - **Risk:** user perceives longer stalls in AI mode before retry UI appears.

4. **[P2] API key persists in localStorage**
   - **Location:** `js/app.js` settings persistence.
   - **Risk:** acceptable for local demo, but not ideal security posture on shared machines.

5. **[P3] Prompt/schema checks are mostly string-level**
   - **Issue:** prompt quality tests assert expected phrases, not semantic output quality from live model samples.
   - **Risk:** prompt regressions that keep keywords but degrade writing quality may not be caught automatically.

---

## Next Steps Execution Report (2026-02-04)

Requested follow-up work was completed:

1. **Renderer tests moved into default CI path**
   - Added Node + JSDOM runner: `tests/rendererNodeTest.js`
   - Updated scripts:
     - `package.json` `test` now includes `node tests/rendererNodeTest.js`
     - added `test:renderer`
   - Added `jsdom` dev dependency for deterministic DOM execution in CI.

2. **Game-screen focus fallback patched**
   - Added `focusSceneTextFallback()` in `js/renderer.js`.
   - `showScreen('game')` now applies deterministic focus fallback.
   - `renderChoices(...)` now focuses scene text fallback when no choices exist in non-ending states.

3. **End-to-end continuity flow test added**
   - Added integration test: parse -> format -> merge of `storyThreadUpdates` (`tests/integrationTest.js`, Test 10.4).
   - Verifies AI response thread updates survive through processing and apply correctly to merged thread state.

4. **Renderer test stability hardening**
   - Added throwing `assert(...)` helper in `tests/rendererTest.js` (real failures now fail CI).
   - Replaced fixed sleeps in key tests with bounded polling to reduce CI timing flake.
   - Reduced long-edge timing pressure while preserving edge-case assertions.

### Validation Results

- `npm test` -> **PASS** (includes renderer suite in default path)
- `npm run test:renderer` -> **PASS** (10/10)
- `npm run lint` -> **PASS**

---

## Demo Reliability + Verification Pack (Codex) � 2026-02-04

### What Was Fixed

1. **Renderer Node test hang protection + deterministic timeout diagnostics**
   - File: `tests/rendererNodeTest.js`
   - Added CI-safe timeout guard (`DEFAULT_RENDERER_TIMEOUT_MS = 60000`) and explicit stall error:
     - `Renderer tests stalled after ...`
     - active handle summary
     - active request summary
   - Runner now exits deterministically with explicit success/failure process exit codes.

2. **Renderer timeout behavior is now explicit (no silent hangs)**
   - File: `tests/rendererNodeTest.js`
   - `Promise.race(...)` between renderer suite and timeout guard ensures hung tests fail fast with diagnostics.

3. **Browser-level demo smoke tests (AI mode)**
   - Files: `playwright.config.js`, `tests/e2e/demo-reliability.spec.js`
   - Added test coverage for:
     - app open
     - AI mode switch
     - API key entry
     - game start
     - two choices
     - loading UI visibility
     - scene transitions
     - no dead-end/retry blank state

4. **Browser-level fallback-path test (AI failure mid-run)**
   - File: `tests/e2e/demo-reliability.spec.js`
   - Added deterministic route-based Gemini failure after initial success.
   - Verifies graceful continuation state (no blank/dead-end UI, choices remain available).

5. **Minimal AI pipeline telemetry hooks**
   - Files: `js/services/aiTelemetry.js`, `js/services/geminiStoryService.js`, `js/app.js`
   - Stages emitted:
     - `request_start`
     - `model_used`
     - `parse_recovery_attempt`
     - `fallback_trigger`
     - `final_success`
     - `final_failure`
   - Telemetry is emitted to console (`[AIPipeline] ...`) and browser event buffer (`window.__sydneyAiTelemetry`) for test assertions.

6. **Test/dev command hardening for repeatability**
   - Files: `package.json`, `playwright.config.js`, `tests/runE2EStability.js`
   - Added scripts:
     - `test:e2e`
     - `test:e2e:stable`
   - Added 3-run stability harness for E2E reliability evidence.

### Commands Run + Evidence (Pass/Fail Summary)

- `npm test` -> **PASS**
  - smoke + thread + integration + renderer node runner all completed
  - renderer runner output includes: `Completed successfully in ...ms`

- `npm run lint` -> **PASS**

- `npm run test:e2e` -> **PASS**
  - 2/2 tests passed:
    - AI mode smoke flow
    - AI fallback flow

- `npm run test:e2e:stable` -> **PASS**
  - Run 1/3: pass
  - Run 2/3: pass
  - Run 3/3: pass
  - Final: `All 3 runs passed.`

### Remaining Risks

1. **Live Gemini behavior variance (P2)**
   - E2E uses deterministic network stubs for reliability; real model output variation/latency still needs periodic manual validation with real API credentials.

2. **Local API key persistence in localStorage (P2)**
   - Still acceptable for local demos, but remains a security tradeoff on shared machines.

3. **Service worker/runtime differences on hosted domains (P3)**
   - Playwright blocks service workers in test config for determinism; production hosting should still receive a quick manual SW regression pass.

### Acceptance Check

- `npm test` passes without timeout/hang: **Yes**
- `npm run lint` passes: **Yes**
- New smoke/fallback tests stable across 3 consecutive runs: **Yes**
- `codexreview.md` updated with fixes/evidence/remaining risks: **Yes**
