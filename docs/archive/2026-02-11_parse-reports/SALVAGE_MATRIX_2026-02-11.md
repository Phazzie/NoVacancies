# Salvage Matrix (While Claude Works)
Date: 2026-02-11
Branch: main

## Scope
This matrix classifies leftover artifacts from:
1. `stash@{0}` (`wip-before-main-merge-2026-02-11`)
2. local worktree branch `mystifying-blackburn`

## Current In-Progress Work (Do Not Touch)
These are active Claude parse-hardening edits in the working tree and should remain untouched until Claude is done:
- `.claude/settings.local.json`
- `src/lib/server/ai/providers/grok.ts`
- `playwright-unit.config.js`
- `tests/unit/grokParsing.spec.ts`
- `JSON_PARSE_FIX_REPORT.md`

## A) mystifying-blackburn (local worktree branch)

| Area | Status | Evidence | Recommendation |
|---|---|---|---|
| `js/*` runtime/app/renderer/tests | Legacy-only | Commits modify `js/app.js`, `js/renderer.js`, `tests/rendererTest.js` | Drop |
| Legacy e2e/static server work | Legacy-only | `tests/e2e/staticServer.js`, `tests/e2e/gemini-live.spec.js` | Drop |
| Images refreshed in branch | Already present in main | Hash match against commit `e693617` for core image set | No action needed |
| AGENTS additions in non-runtime dirs | Non-critical | `icons/AGENTS.md`, `images/AGENTS.md`, `tests/AGENTS.md` | Drop |

### Conclusion
`mystifying-blackburn` contains no high-value unique runtime work for current `src/` Grok path.

## B) stash@{0} tracked changes

| Category | Status | Recommendation |
|---|---|---|
| Parity/decommission/runtime cleanup changes | Already merged to `main` | No action needed |
| Legacy removals and docs updates | Already represented in merged work | No action needed |

## C) stash@{0} untracked payload (unique)

| File/Folder | Type | Keep/Drop | Why |
|---|---|---|---|
| `ARCHITECTURAL_REVIEW.md` | Analysis note | Keep (archive) | useful architecture snapshot |
| `CONCISE_FIXES.md` | Analysis note | Keep (archive) | concise defect/action summary |
| `DUPLICATES_TO_DELETE.md` | Cleanup checklist | Keep (archive) | useful for follow-up pruning |
| `JSON_PARSE_ISSUE.md` | Parse failure analysis | Keep (archive) | directly relevant to current Claude task |
| `docs/VOICE_RESTORATION_SUMMARY.md` | Narrative doc | Keep | active narrative context utility |
| `docs/WU_BOB_BEFORE_AFTER.md` | Process/review note | Keep (archive) | useful traceability |
| `docs/archive/2026-02-08_legacy_provider/*` | Archive docs | Keep | historical context per preservation rule |
| `docs/archive/2026-02-11_legacy_provider_cleanup/*` | Archive docs | Keep | historical context per preservation rule |

## Recommended Next Actions (After Claude lands parse fix)

1. Create one archival commit for selected unique stash artifacts:
   - Keep active: `docs/VOICE_RESTORATION_SUMMARY.md`
   - Move root notes into `docs/archive/2026-02-11_salvage_notes/`
2. Drop `stash@{0}` only after archival commit is pushed.
3. Remove local worktree branch `mystifying-blackburn` (or keep as cold backup if desired).

## Risk Note
Dropping `stash@{0}` before archival extraction would lose unique investigation notes.
