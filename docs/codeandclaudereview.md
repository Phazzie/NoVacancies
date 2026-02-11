# Codex + Claude Review Coordination

## 1) Prompt for Claude (Review Codex Work)

Use this exactly with Claude:

```text
Review Codex's narrative-parity/runtime hardening work on branch `feat/narrative-parity`.

Scope:
- This is a review task, not a rewrite task.
- Focus on correctness, regressions, risk, and missing tests.

Files to review first:
1. src/lib/server/ai/providers/grok.ts
2. src/lib/server/ai/narrative.ts
3. src/lib/server/ai/lessons.ts
4. src/lib/server/ai/sanity.ts
5. src/lib/game/gameRuntime.ts
6. tests/noLegacyProviderMarkers.js
7. CHANGELOG.md
8. AI_LESSONS_LEARNED.md

Review checks (required):
1) Prompt Wiring
- Confirm runtime uses canonical system/opening/continue/recovery prompt path.
- Confirm no fallback to one-line generic system prompt.

2) Narrative Context
- Confirm `NarrativeContext` is built and passed during next-scene generation.
- Confirm thread/boundary/lesson history/transition bridge sections are available to prompts.

3) Transition Bridge Semantics
- Confirm next-turn bridge behavior is causally correct (set after thread delta, consumed next turn).
- Flag any same-turn/next-turn mismatch risks.

4) Sanity Guard Behavior
- Confirm banned phrase/therapy-speak checks.
- Confirm word thresholds:
  - non-ending soft 280 / hard 350
  - ending soft 370 / hard 450
- Confirm retryable vs blocking classification is coherent with generation retry policy.

5) Type Safety / Shortcuts
- Confirm no `@ts-nocheck` in active narrative runtime path.
- Confirm no broad cast hacks remain in Grok prompt calls.

6) Test Adequacy
- Confirm tests cover regression risk introduced by this work.
- List exactly what is still untested but high-risk.

Output format:
- Findings first, ordered by severity.
- For each finding:
  - PASS / ISSUE
  - file:line
  - impact
  - proposed fix
- Then:
  - Open Questions
  - Residual Risks
  - "What would a group of haters say about this implementation?"

Constraints:
- Do not request broad rewrites.
- Keep fixes minimal and actionable.
- Do not include secrets.
```

### Questions for Claude (paste below before sending if needed)

- Blocking Questions:
  1.
  2.
- Non-Blocking Questions:
  1.
  2.

---

## 2) Codex Autonomous Endgame Tasking (While Claude Reviews CI)

### Objective
Get the app as close to demo-ready as possible autonomously, while Claude handles narrative CI design/testing work.

### Operating Rules
- Work phase-by-phase with hard test gates.
- Do not pause for confirmation unless stop conditions are hit:
  - invariant conflict
  - backward-compat/schema break risk
  - unexpected external edits in touched files
- Ignore unrelated files unless they block touched files.
- Keep changes minimal, reversible, and scoped.

### Phase A - Stabilize Runtime Narrative Path
1. Verify no active runtime path still depends on legacy Gemini artifacts.
2. Verify all narrative-critical prompt/context functions are imported from `src/lib/server/ai/narrative.ts`.
3. Verify context budget behavior is stable (last 2 full scenes preserved, high-signal lines preserved).
4. Verify transition bridge lifecycle is correct in `gameRuntime`.

Acceptance:
- `npm run check`
- `npm run lint`
- `npm test`

### Phase B - Reliability + Error Surface
1. Ensure route errors remain sanitized and do not leak secrets/tokens.
2. Verify debug error capture path is usable during real playthroughs.
3. Add/adjust minimal tests for:
   - provider/config hard-fail behavior
   - guardrail rejection behavior
   - no-secret log/error output

Acceptance:
- `npm run check`
- `npm run lint`
- `npm test`
- `npm run test:e2e` if e2e files or route behavior changed

### Phase C - Demo Readiness Hardening
1. Ensure AI mode defaults are consistent and visible.
2. Ensure static image mode remains default unless explicitly enabled for Grok images.
3. Verify readiness/debug surfaces are accurate and actionable for demo triage.
4. Remove only dead or misleading UX around deprecated flows (no broad redesign).

Acceptance:
- `npm run check`
- `npm run lint`
- `npm test`
- `npm run test:e2e` if UI/play/debug routes changed

### Phase D - Integrate Claude CI Output
After Claude delivers CI changes:
1. Review Claude diffs as code review, not blind merge.
2. Fix drift between any mirror logic and runtime sanity logic.
3. Align scripts/workflow/artifact paths with repo conventions.
4. Run full local gate set.

Acceptance:
- `npm run check`
- `npm run lint`
- `npm test`
- `npm run test:narrative` (if added)
- `npm run test:e2e` as needed

### Phase E - Finalization
1. Update required docs:
   - `CHANGELOG.md`
   - `AI_LESSONS_LEARNED.md`
   - `README.md` only if run/test behavior changed
2. Commit in logical slices.
3. Push branch with clear handoff summary.

### End-State Definition (Target)
- Runtime narrative path is canonical and typed.
- No secrets leakage in normal error/log paths.
- Demo flow can be run and debugged quickly.
- CI/testing story is in place (or cleanly staged if waiting on Claude output).

### Required Handoff Format
- What was implemented by phase
- Commands run and pass/fail
- Docs Updated
- Risks Introduced
- Assumptions Made
- Rollback Note
- Commits and pushed refs
