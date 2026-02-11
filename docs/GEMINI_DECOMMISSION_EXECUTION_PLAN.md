# Gemini Decommission Execution Plan

Date: 2026-02-08
Branch: `feat/gemini-decommission`
Owner: Codex
Goal: Remove Gemini-era runtime/testing/dependency paths so the repo matches the actual Grok-only SvelteKit app.

## 1) File-by-File Worklist

| Step | File(s) | Change | Difficulty (1-10) |
|---|---|---|---|
| 1 | `package.json` | Replace legacy `lint`/`test` scripts that still target `js/*` Gemini-era code with SvelteKit-first gates. | 6 |
| 2 | `eslint.config.js` | Re-scope lint config away from legacy-only `js/**` patterns so lint reflects active stack. | 7 |
| 3 | `tests/integrationTest.js` | Remove Gemini adapter tests and legacy runtime-only assertions. Replace with focused server/provider contract checks where needed. | 9 |
| 4 | `tests/smokeTest.js`, `tests/threadTest.js`, `tests/rendererNodeTest.js` | Retire or rewrite old vanilla runtime tests so they do not require `js/app.js`/`geminiStoryService.js`. | 8 |
| 5 | `js/services/geminiStoryService.js` | Delete Gemini service implementation (or archive if historical retention required). | 5 |
| 6 | `js/app.js`, `js/prompts.js`, `js/contracts.js`, `js/services/aiTelemetry.js` | Remove Gemini-specific logic and `AIza` assumptions from legacy codepaths that are no longer runtime-active. | 8 |
| 7 | `tests/e2e/*` | Ensure e2e coverage asserts Grok-only behavior and no mock/Gemini fallback assumptions. | 5 |
| 8 | `README.md` | Update test/lint commands and architecture notes to Grok + SvelteKit only. | 4 |
| 9 | `CHANGELOG.md` | Record decommission changes and script/test gate migration. | 3 |
| 10 | `AI_LESSONS_LEARNED.md` | Add process lessons from decommission (legacy drift, gate drift, migration hygiene). | 3 |
| 11 | `docs/GROK_API_SWITCH_PLAN_POST_SVELTEKIT.md` | Update plan status to reflect Gemini decommission completion and remaining Grok hardening. | 4 |
| 12 | `docs/GEMINI_VERIFICATION_RECONCILIATION_2026-02-08.md` | Mark closed items and leave explicit residual legacy references if intentionally retained. | 3 |
| 13 | `docs/CREATIVE_SKILLS_CATALOG.md`, `docs/ARCHITECTURE_AND_SOLUTION_REQUEST.md`, related legacy docs | Archive or relabel Gemini-specific guidance so it is not treated as current runtime guidance. | 6 |

## 2) Haters Review (Brutal Critique)

"What would a group of haters say about this list?"

1. "You are mixing runtime cleanup with doc archaeology and will lose momentum."
2. "Deleting tests before replacement kills trust and leaves a blind spot."
3. "You might break CI by changing scripts before new checks are ready."
4. "You still have unclear archival policy for old `js/*` files."
5. "You will claim 'Gemini removed' while CHANGELOG/docs still mention it all over."

## 3) Wu-Bob Review (Uncle Bob + GZA + Deck)

### Uncle Bob
- Separate concerns: do runtime-gate migration first, then code deletion, then docs/archive.
- Keep behavior-preserving seams while replacing tests.

### GZA
- Remove dead code only after equivalent signal exists.
- Prefer smaller commits with one purpose each.

### Inspectah Deck
- Verify each phase with explicit pass/fail evidence.
- Add one guard that fails fast if active runtime paths reintroduce Gemini strings.

## 4) Feedback Implemented Into Plan

1. **Phased scope split**
   - Phase A: test/lint gate migration.
   - Phase B: Gemini runtime deletion.
   - Phase C: docs/archive cleanup.

2. **Safety guard added before deletion**
   - Add a lightweight "no Gemini in active runtime" test/scan first.

3. **Commit discipline**
   - One commit per phase, each with fresh command evidence.

4. **Explicit non-goal**
   - Do not do broad refactors unrelated to Gemini removal.

## 5) Execution Order (Revised)

1. Add active-runtime guardrail checks and migrate scripts so quality gates no longer depend on legacy Gemini tests.
2. Remove Gemini implementation files and all imports/call-sites.
3. Rewrite or archive legacy tests; ensure `npm run lint`, `npm test`, `npm run test:e2e` stay green.
4. Clean canonical docs, then archive non-canonical legacy Gemini docs.
5. Final grep gate for Gemini references in active runtime paths (`src/**`, active tests, package scripts).

## 6) Phase A Kickoff (Starting Now)

Immediate first implementation tasks:
1. Add a repository guard script/test that fails if Gemini markers appear in active runtime paths.
2. Update `package.json` scripts to run modern SvelteKit-focused checks.
3. Ensure baseline commands pass before any file deletions.
