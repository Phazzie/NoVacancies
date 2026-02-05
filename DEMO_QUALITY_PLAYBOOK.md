# Demo Quality Playbook

Date: 2026-02-04  
Project: `sydney-story`

## Current Status Snapshot (2026-02-04)

### Completed in this branch

- [x] `npm run lint` passes.
- [x] `npm test` passes (smoke + thread + integration + renderer node).
- [x] Full pipeline passed 3 consecutive runs (`npm test` x3).
- [x] Input validation hardening is in place:
  - API key format validation (`js/services/geminiStoryService.js`, `js/app.js`)
  - Choice ID normalization + uniqueness (`js/services/geminiStoryService.js`)
  - Invalid UI choice ID rejection (`js/app.js`)
- [x] AI quality/error-handling coverage added:
  - bounded parse-recovery/fallback tests
  - continuity/anti-repetition/choice-distinctness tests
  - timeout and malformed-output tests

### Still required to call demo “complete”

- [ ] Run Playwright reliability suite on a machine that can:
  - install Chromium for Playwright
  - bind localhost port for the e2e static server
- [ ] Execute manual AI demo QA pass (real API key, fallback behavior, ending flow, mobile sanity).
- [ ] Final go/no-go signoff update in `codexreview.md`.

## 1) Definition of Done (Friend Demo with AI Mode)

Use this as the release gate. Every item must be checked before demoing.

### A. Build and Test Gates

- [ ] `npm run lint` passes with 0 errors.
- [ ] `npm test` completes without timeout/hang.
- [ ] Renderer suite runs as part of `npm test` and passes.
- [ ] New/changed tests pass 3 consecutive runs (`npm test` x3) to catch flakes.
- [ ] No skipped tests for AI flow, fallback flow, or renderer focus behavior.

### B. AI Reliability Gates

- [ ] AI mode starts successfully with a valid API key.
- [ ] Opening scene generates valid, renderable JSON.
- [ ] Continue flow works for at least 5 consecutive AI scenes.
- [ ] Malformed model output triggers one repair attempt, then bounded fallback path.
- [ ] Timeout behavior is bounded and user sees a clear retry path.
- [ ] AI->mock fallback (mid-run failure) does not force immediate ending.

### C. Narrative Quality Gates

- [ ] Scene pacing remains within agreed range (150-250 words target).
- [ ] Choices are meaningfully distinct (not paraphrases).
- [ ] Scene includes continuity callbacks to recent facts/thread state.
- [ ] Ending direction aligns with player choice pattern (no obvious misclassification).
- [ ] `storyThreadUpdates` is present when state changes and omitted when unchanged.
- [ ] At least 2 manual playthroughs feel coherent (no abrupt personality reversals).

### D. UX and Accessibility Gates

- [ ] Mobile pinch zoom works (no disabled scaling).
- [ ] Paragraph/line breaks render correctly in scene text.
- [ ] Focus is deterministic on screen transitions (title/settings/game/ending).
- [ ] Error UI focuses retry action for keyboard/screen-reader flow.
- [ ] Loading states escalate messaging for long AI calls (6s/12s).
- [ ] External links with `target="_blank"` include `rel="noopener noreferrer"`.

### E. Security and Operational Gates

- [ ] No new secrets committed.
- [ ] API key handling behavior is documented for local demo usage.
- [ ] Console logs are useful and non-sensitive in normal failure paths.
- [ ] `codexreview.md` updated with final findings, risk rank, and evidence.

---

## 2) Detailed Execution Plan (for me to follow)

### Phase 0 - Baseline Snapshot

1. Capture current repo state (`git status --short -uno`).
2. Run `npm run lint` and record pass/fail.
3. Run `npm test` with timeout and capture where it stops.
4. If `npm test` fails/hangs, isolate failing segment and create a focused task list.

### Phase 1 - Contract Lock

5. Confirm and document invariant contracts for:
   - Scene output shape and required fields.
   - Parse recovery and fallback attempt limits.
   - Narrative quality requirements (distinct choices, continuity callback, ending steering).
   - Renderer focus/loading/error behavior.
6. Encode any missing invariants in tests first (expect red).

### Phase 2 - Reliability Fixes

7. Fix the `rendererNodeTest` hang first (highest leverage).
8. Add deterministic stall timeout + diagnostics in renderer node runner.
9. Re-run renderer tests standalone until stable.
10. Re-run full `npm test` and confirm no hang.

### Phase 3 - Narrative and AI Quality

11. Add/adjust integration tests for:
    - distinct choice quality gate,
    - continuity callback presence,
    - parse recovery bounded behavior,
    - ending inference false-positive guards.
12. Update prompt/service logic only to satisfy failing tests (small deltas).
13. Re-run integration suite; then full suite.

### Phase 4 - UX/Accessibility Verification

14. Verify automated coverage for focus management, scene formatting, and error focus.
15. Add tests for any uncovered UX-critical behavior.
16. Run lint + full tests again.

### Phase 5 - Manual Demo Readiness

17. Execute manual browser checklist:
    - AI mode with valid key,
    - 2+ AI scenes,
    - mid-run simulated failure and recovery,
    - retry path,
    - ending transition,
    - mobile zoom/focus sanity.
18. Log findings and rank remaining issues by severity and ease-of-fix.

### Phase 6 - Finalize

19. Update `codexreview.md` with:
    - completion status against DoD,
    - unresolved risks,
    - exact test evidence,
    - recommendation: demo-ready yes/no.
20. Deliver concise handoff summary + next-step options.

---

## 3) Prompt Template (Tasking Another AI Assistant)

Use this prompt exactly:

```text
You are working in /mnt/c/Users/latro/Downloads/t/sydney-story.

Objective:
Bring the app to friend-demo readiness with AI mode as a hard requirement.

Follow DEMO_QUALITY_PLAYBOOK.md exactly.

Scope (priority order):
1) Make sure npm test completes (no hangs), especially renderer node tests.
2) Enforce contract-first behavior: add tests before implementation changes.
3) Validate AI reliability paths:
   - parse recovery (one-shot),
   - timeout handling,
   - fallback model usage,
   - AI->mock continuity (no abrupt forced ending).
4) Validate narrative quality regressions:
   - choice distinctness,
   - continuity callbacks,
   - ending inference quality.
5) Validate UX/accessibility regressions:
   - focus transitions,
   - retry focus,
   - paragraph rendering,
   - mobile zoom.
6) Run lint/tests, then update codexreview.md with:
   - what changed,
   - what passed/failed,
   - residual risks ranked by severity and ease-of-fix.

Constraints:
- Do not revert unrelated changes.
- Keep edits minimal and test-driven.
- No destructive git operations.
- Preserve existing architecture unless a fix requires a small, justified refactor.

Definition of done:
- All DoD checklist items in DEMO_QUALITY_PLAYBOOK.md are checked, or explicitly documented as blocked with reason/evidence.
```
