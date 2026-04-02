# AGENTS.md — src/lib/server/ai/

Behavioral rules for the AI provider layer. Extends root `AGENTS.md`.

This is the highest-risk directory in the codebase. Changes here can cause:
- Silent server boundary violations (pass dev, fail build)
- Startup throws that surface as 500 errors on every route
- Parse failures that corrupt narrative continuity without loud errors
- Security issues (key leakage via logs or client bundles)

---

## Stop / Ask Before Proceeding

**STOP and ask the user before:**
- Adding a new AI provider adapter — only Grok (`providers/grok.ts`) is authorized; adding another requires explicit approval
- Changing retry backoff values or `maxRetries` defaults — these affect live playthrough reliability
- Adding any evaluation logic to `sanity.ts` — any addition must be structurally deterministic (no taste, no semantic checks)
- Changing telemetry emission shape — redaction rules exist for a reason; any change risks key leakage
- Modifying parse recovery flow — the two-stage path (standard → recovery prompt → `invalid_response`) is an invariant

---

## Confidence Requirements

- **Always run `npm run build` after any change here** — the `$lib/server` boundary is silent in dev and only fails at build
- **Changes to `config.ts` require a manual test** that the relevant throw conditions still trigger correctly
- **Include at least one "risk introduced" note** in every handoff for this directory — blast radius is wide

---

## Anti-Goals

- Do not add mock provider paths or `mock_fallback` outage mode support — the product decision is hard-fail
- Do not add taste heuristics or semantic checks to `sanity.ts` — structural guards only
- Do not log prompt content, response text, or anything resembling an API key — structural telemetry only
- Do not manufacture synthetic fallback scenes in parse recovery — fail typed, let the UI handle it

---

## Cross-References

- `config.ts` changes → run `npm test` (story selection smoke tests call `loadAiConfig` indirectly)
- `sanity.ts` changes → update `tests/narrative/narrativeQuality.test.js` sanity assertions in the same PR
- `providers/grok.ts` parse logic changes → run `npm run test:narrative` and report fixture pass/fail
- `narrative.ts` prompt asset changes → run `npm run test:narrative` and update `AI_LESSONS_LEARNED.md` if a new prompt behavior lesson is discovered
