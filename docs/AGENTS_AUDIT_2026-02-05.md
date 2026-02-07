# AGENTS Audit (2026-02-05)

Scope audited:
- `AGENTS.md`
- `js/AGENTS.md`
- `js/services/AGENTS.md`
- `tests/AGENTS.md`
- `tests/e2e/AGENTS.md`
- `images/AGENTS.md`
- `icons/AGENTS.md`

## Criteria and Scores

Scale: 0-5 (5 = strong)

| Category | Score | Notes |
|---|---:|---|
| Expert-level controls | 5 | Priority ladder, invariants, stop/ask, doc routing, validation commands are explicit |
| Genius-level controls | 4 | Added trigger matrix, confidence protocol, freshness budget, invariant-to-test rule |
| Unconventional-effective controls | 4 | Added anti-goals, risk-introduction callout, assumptions + rollback handoff requirements |
| "What not to include" clarity | 5 | Explicit do-not-include section exists and is actionable |
| Folder-level specificity | 5 | Nested AGENTS files are scoped and domain-specific |

## Strengths

- Clear canonical-vs-non-canonical doc boundaries.
- Strong reliability and regression posture.
- Good separation rules by folder (`js`, `services`, `tests`, `e2e`, `images`, `icons`).
- Practical handoff expectations that prevent overconfident status claims.

## Remaining Improvements (Optional)

1. Add a short compliance checklist at bottom of root `AGENTS.md`:
   - `Docs Updated`
   - `Risks Introduced`
   - `Assumptions Made`
   - `Rollback Note`
2. Add a lightweight `docs:check` script to enforce stale-doc warnings and broken-link checks.
3. Add explicit reference from `README.md` to AGENTS policy once README is created.

## Verdict

Current AGENTS stack is up to par for this repository and significantly above typical baseline quality.
