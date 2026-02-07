# Documentation Review (2026-02-05)

Goal: keep docs accurate, current, and easy to navigate without stale traps.

## Review Criteria

1. Accuracy vs current code/tests
2. Recency and maintenance cost
3. Discoverability (can a new contributor find truth fast?)
4. Canonical fit (`README.md`, `CHANGELOG.md`, `AI_LESSONS_LEARNED.md`)
5. Keep-over-delete preservation policy

## File-by-File Decision Matrix

| File | Status | Action | Why |
|---|---|---|---|
| `README.md` | Missing | **Create (P0)** | Needs one canonical entrypoint for setup, run, test, status links |
| `CHANGELOG.md` | Stale | **Rewrite/Backfill (P0)** | Missing major Feb 4-5 reliability/prompt/testing deliveries |
| `AI_LESSONS_LEARNED.md` | Partially current | **Expand/Refresh (P0)** | Good core lessons, but missing major reliability/process lessons |
| `claude.md` | Mixed (valuable + stale) | **Split (P0)** | Keep as instruction-only; move historical content to archive |
| `codexreview.md` | Valuable but non-canonical | **Retain as audit log (P0)** | Rich forensic history, but contradictory as live status source |
| `DEMO_QUALITY_PLAYBOOK.md` | Useful | **Refresh statuses (P1)** | Good gate structure; checkbox states should align with latest evidence |
| `TEST_PLAN_SUMMARY.md` | Stale | **Archive or rewrite as `docs/TEST_STRATEGY.md` (P1)** | Test counts and status claims are outdated |
| `CLAUDE_TEST_SPEC.md` | Legacy reference | **Archive (P1)** | Useful historical spec, not primary day-to-day truth |
| `GEMINI_TEST_SPEC.md` | Legacy reference | **Archive (P1)** | Same as above |
| `ART_PROMPTS_AND_REFERENCES.md` | Current and useful | **Keep active (P1)** | Strong content; keep as image-ops reference |
| `ai_builder_prompt.md` | Operational template | **Archive (P2)** | Useful occasionally, not canonical project truth |
| `ai_builder_prompt_narrative.md` | Operational template | **Archive (P2)** | Same rationale |
| `WU-BOB.md` | Stable policy | **Keep active (P2)** | Style/process reference remains useful |

## What We No Longer Need as "Active" Docs

These should not be treated as current source-of-truth:
- `codexreview.md` (historical audit log only)
- `CLAUDE_TEST_SPEC.md` (legacy reference)
- `GEMINI_TEST_SPEC.md` (legacy reference)
- `ai_builder_prompt.md` (tasking template)
- `ai_builder_prompt_narrative.md` (tasking template)

## Canonical Structure Target

- `README.md` -> start here
- `CHANGELOG.md` -> release history and rationale
- `AI_LESSONS_LEARNED.md` -> durable lessons
- `docs/STATUS.md` -> current tested status and blockers
- `docs/DECISIONS.md` -> major tradeoffs (optional but recommended)
- `docs/archive/*` -> preserved historical context

## Migration Order (Lowest Risk)

1. Create `README.md` + `docs/STATUS.md`.
2. Backfill `CHANGELOG.md` from implemented code and verified runs.
3. Expand `AI_LESSONS_LEARNED.md` using `docs/MEGA_LESSONS_DECISIONS.md`.
4. Add a top warning banner in `codexreview.md`: "Non-canonical audit log".
5. Split `claude.md`:
   - keep instruction contract in `claude.md`
   - move historical sections to `docs/archive/claude-history-2026-02-05.md`
6. Move legacy specs/templates to `docs/archive/` with a small index.

## Risk Notes

- Highest risk is accidental deletion of unique reasoning context.  
  Mitigation: archive first, then trim.
- Second risk is dual-truth status claims.  
  Mitigation: one active status snapshot only (`README.md` + `docs/STATUS.md`).
