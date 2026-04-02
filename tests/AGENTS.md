# AGENTS.md — tests/

Behavioral rules for the test suite. Extends root `AGENTS.md`.

The tests directory is the enforcement layer for every invariant in `CLAUDE.md` and `AGENTS.md`. Weakening a test weakens a guarantee. Treat test changes with the same scrutiny as source changes.

---

## Stop / Ask Before Proceeding

**STOP and ask the user before:**
- Removing or weakening any Tier 1 guard — these are the blocking PR gates; removal requires explicit authorization
- Promoting a Tier 2 check (prose quality, AI rubric) to Tier 1 — Tier 1 must remain fully deterministic
- Disabling or skipping a Playwright test — investigate the root cause; don't silence failures
- Changing `noLegacyProviderMarkers.js` parity checks — removing a check requires explaining what else prevents that regression

---

## Confidence Requirements

- **Never claim a test passes without running it** — report the exact command and its output summary
- **Playwright test changes must be verified** with `npm run test:e2e` before marking done
- **Fixture changes** in `tests/narrative/fixtures/` require a `npm run test:narrative` pass
- **CI workflow changes** require a manual workflow run to verify correct behavior

---

## Anti-Goals

- Do not add taste/semantic heuristics to `narrativeQuality.test.js` — structural and contract checks only
- Do not add live API calls to any Tier 1 test
- Do not add `sleep()` or arbitrary timing waits to Playwright tests — fix the root cause
- Do not add `test.skip()` to avoid a flaky test without justification and a follow-up task

---

## Cross-References

- `storyEngineRuntimeSelection.js` tests `PUBLIC_STORY_ID` behavior → changes to `src/lib/stories/index.ts` must keep this test green
- `narrativeQuality.test.js` imports from `src/` → source contract changes may require test updates in the same PR
- `noLegacyProviderMarkers.js` scans `src/**`, `tests/e2e/**`, `package.json` → scope changes must be documented in `CHANGELOG.md`
- `contextBudget.spec.ts` + `transitionBridge.spec.ts` → changes to `src/lib/game/narrativeContext.ts` must keep these green
