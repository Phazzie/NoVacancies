# AGENTS.md

Scope: entire repository unless a deeper `AGENTS.md` overrides/extends rules.

## Mission

Ship a friend-demo-ready AI narrative app that is reliable, coherent, and easy to operate.

Priority order when tradeoffs appear:
1. Correctness and reliability
2. Security/privacy
3. Accessibility and UX continuity
4. Narrative quality
5. Speed/perf
6. Cosmetic polish

Narrative decision rule:
- If there is a tradeoff between brittle semantic heuristics and model-guided narrative judgment, prefer AI-driven narrative decisions and keep code-level guards structural (schema/contract/parse/limits), not taste-based.

## Canonical Documentation Policy

These are the only canonical docs for persistent project knowledge:
- `README.md` -> how to run/use, current operational status, doc map
- `CHANGELOG.md` -> dated "what changed" and short rationale
- `AI_LESSONS_LEARNED.md` -> durable engineering/content lessons

Optional canonical rationale file:
- `docs/DECISIONS.md` -> major architecture/product tradeoffs

Non-canonical operational logs:
- `codexreview.md` -> working review/audit log only
- `claude.md` -> instruction file only (no running status logs)

Preservation rule (keep-over-delete):
- If content is useful but non-canonical, move to `docs/archive/` with date and source.
- Do not delete unique historical context by default.

## Documentation Routing Rules

When updating code:
- If behavior changes, update `CHANGELOG.md`.
- If a reusable rule/anti-pattern is discovered, update `AI_LESSONS_LEARNED.md`.
- If run/test/setup behavior changes, update `README.md`.
- If a major tradeoff is made, add a short entry to `docs/DECISIONS.md` (if present).

At task end, always include a "Docs Updated" list in the handoff.

### Change Trigger Matrix

If these files change, update the paired docs/tests in the same task:
- `js/contracts.js` -> update `tests/integrationTest.js` contract coverage and `CHANGELOG.md`
- `js/prompts.js` or `js/services/geminiStoryService.js` -> update AI quality/recovery tests and `AI_LESSONS_LEARNED.md` when new prompt behavior lessons emerge
- `index.html` / `style.css` / `js/renderer.js` -> update renderer/e2e checks and `README.md` UX notes if behavior changed
- `tests/*` pipeline behavior -> update `README.md` test commands/status expectations

## Non-Negotiable Product Invariants

- AI->mock fallback must preserve playability; no abrupt forced ending from incompatible scene IDs.
- Parse recovery/fallback flow must be bounded; no infinite retry loops.
- API keys/secrets must never be logged, exported, or included in recaps.
- Accessibility baseline must be preserved (zoom enabled, focus continuity, readable scene formatting).
- Image content guardrail: never depict Oswaldo's face or bare skin.
- Sydney visual continuity: 44, brunette, asymmetric bob, blue eyes; work setup uses 3-5 smartphones with pop sockets (no laptop in new work depictions).

## Engineering Workflow

1. Inspect existing behavior and contracts before editing.
2. Prefer test-first for bug fixes and reliability-sensitive changes.
3. Keep changes minimal and local; avoid unrelated refactors.
4. Re-run relevant validation:
   - `npm run lint`
   - `npm test`
   - `npm run test:e2e` when e2e-related paths change (or clearly report environment block)
5. Report evidence, not assumptions (commands run + pass/fail summary).

## Autonomy Defaults (Execution Contract)

- Canonical active implementation plan: `docs/LOCAL_NARRATIVE_UPGRADE_PLAN.md`.
- On `feat/sveltekit-migration`, active migration docs are:
  - `docs/SVELTEKIT_MIGRATION_PLAN.md`
  - `docs/GROK_API_SWITCH_PLAN_POST_SVELTEKIT.md` (follow-up only, post-SvelteKit)
- Execution cadence defaults:
  - commit per phase
  - push per passed phase
  - ignore unrelated files unless they block touched files
- Test gates per phase:
  - `npm run lint`
  - `npm test`
  - `npm run test:e2e` when renderer/e2e paths change
- Mandatory Review/Critique/Revise loop per phase.
- Mandatory critique question in every phase:
  - `What would a group of haters say about the work I just did?`
- Existing stop conditions still apply:
  - requirements conflict with invariants
  - schema/backward-compat break risk
  - unexpected external edits during active work

### Confidence Protocol

- Do not claim "done" or "fixed" without fresh command evidence.
- If execution is environment-blocked, explicitly mark as blocked and provide exact command(s) for user-side verification.
- Include at least one "risk introduced by this change" note for non-trivial edits.

### Invariant-to-Test Rule

Any change touching a non-negotiable invariant must include or update at least one test proving it.

## Stop/Ask Conditions

Pause and ask if:
- Requirements conflict with existing invariants.
- A change requires destructive operations or sweeping refactors.
- A schema contract change will break backward compatibility.
- You detect unexpected external edits during active work.

## Anti-Goals

- Do not broaden scope while reliability hardening is in progress.
- Do not move durable project knowledge into transient logs.
- Do not rewrite architecture for style preference when a small fix is sufficient.

## Freshness Budget

- Active canonical docs (`README.md`, `CHANGELOG.md`, `AI_LESSONS_LEARNED.md`) should be reviewed within 30 days of major behavior changes.
- If stale, mark status as "Needs review" before adding more content.

## Handoff Requirements for Significant Changes

Include these sections in final handoff:
- `Docs Updated`
- `Risks Introduced`
- `Assumptions Made`
- `Rollback Note` (how to back out change safely)

## What Must Not Go Into AGENTS Files

- Secrets, tokens, keys, credentials
- Volatile test run logs or long command output dumps
- Duplicated architecture prose that belongs in README/docs
- Personal notes that are not actionable rules
- Contradictory or ambiguous instructions

Keep AGENTS files short, prescriptive, and stable.

## ExecPlans

When writing complex features or significant refactors, use an ExecPlan from `PLAN.md` from design through implementation, and keep `PLAN.md` updated as a living document while work is in progress.
