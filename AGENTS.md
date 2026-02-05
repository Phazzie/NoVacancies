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

## Stop/Ask Conditions

Pause and ask if:
- Requirements conflict with existing invariants.
- A change requires destructive operations or sweeping refactors.
- A schema contract change will break backward compatibility.
- You detect unexpected external edits during active work.

## What Must Not Go Into AGENTS Files

- Secrets, tokens, keys, credentials
- Volatile test run logs or long command output dumps
- Duplicated architecture prose that belongs in README/docs
- Personal notes that are not actionable rules
- Contradictory or ambiguous instructions

Keep AGENTS files short, prescriptive, and stable.
