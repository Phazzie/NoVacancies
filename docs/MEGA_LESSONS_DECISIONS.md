# Mega Lessons + Decisions (Consolidated)

Date: 2026-02-05  
Project: `sydney-story`

Purpose: preserve high-value lessons/decisions from scattered docs in one place, then analyze patterns and risks.

## Source Set Used

- `AI_LESSONS_LEARNED.md:3-21`
- `CHANGELOG.md:3-22`
- `claude.md:939-1202`
- `codexreview.md:169-265`
- `codexreview.md:1178-1273`
- `DEMO_QUALITY_PLAYBOOK.md:30-117`

## Consolidated Decisions + Lessons

### 1) Narrative and Product Direction

1. **Specific conflict beats generic conflict**
   - Decision: move from "lazy boyfriend" framing to targeted toxic dynamics (gaslighting/weaponized incompetence).
   - Why: raises stakes and narrative specificity.
   - Sources: `AI_LESSONS_LEARNED.md:8-12`, `CHANGELOG.md:7`.

2. **"Sunk Cost / Double Down" is a stronger core motive than "trapped empathy"**
   - Decision: protagonist remains by refusing to admit a mistake.
   - Why: gives Sydney agency/flaw complexity, avoids passive protagonist drift.
   - Sources: `AI_LESSONS_LEARNED.md:13-16`, `CHANGELOG.md:8`.

3. **Prompt craft constraints are mandatory, not optional**
   - Decision: enforce "show don't tell", sensory detail, voice constraints.
   - Why: default model prose trends generic without explicit craft rails.
   - Sources: `AI_LESSONS_LEARNED.md:18-21`, `CHANGELOG.md:15`, `claude.md:1105-1119`.

4. **Narrative continuity requires explicit tracked state**
   - Lesson: "last N scenes" memory alone is not enough for long-run consistency.
   - Why: relationships and unresolved threads reset without tracked continuity fields.
   - Sources: `claude.md:1028-1039`, `codexreview.md:207-214`.

5. **Visual continuity is product quality, not decoration**
   - Decision: align generated images to existing style and strict character constraints.
   - Why: style drift breaks immersion quickly in narrative products.
   - Sources: `AI_LESSONS_LEARNED.md:3-7`, `CHANGELOG.md:9`.

### 2) Architecture and Reliability

6. **No-build vanilla JS is intentional**
   - Decision: avoid TypeScript/build tools for this phase.
   - Why: lower setup friction, faster handoff, simpler runtime path.
   - Tradeoff: less compile-time safety; requires strong validators/tests.
   - Sources: `claude.md:945-956`.

7. **Service abstraction (AI + mock) is foundational**
   - Decision: keep common story-service interface for real and fallback providers.
   - Why: testing speed, graceful degradation, decoupled UI iteration.
   - Sources: `claude.md:959-969`.

8. **Schema/contracts before trust**
   - Decision: enforce strict response schema and contract validation.
   - Why: reliability rises when malformed outputs are rejected early.
   - Sources: `CHANGELOG.md:16-17`, `claude.md:972-983`, `codexreview.md:234-242`.

9. **Fallback must preserve playability**
   - Decision: compatibility-gate Gemini IDs before mock transition; use recovery scene for incompatible IDs.
   - Why: transient AI failure should not force abrupt ending.
   - Sources: `codexreview.md:15-19`, `codexreview.md:136-146`.

10. **Recovery logic must be bounded**
   - Decision: one parse-repair retry, then fallback path.
   - Why: prevents infinite loops and hidden hangs.
   - Sources: `codexreview.md:234-242`, `DEMO_QUALITY_PLAYBOOK.md:47-49`.

11. **Single-state-owner pattern in app layer**
   - Decision: `app.js` owns mutation; renderer remains presentation-focused.
   - Why: preserves determinism and testability without framework state tooling.
   - Sources: `claude.md:1122-1133`.

### 3) Testing and Delivery Discipline

12. **Test-first gate for non-trivial features**
   - Decision: contract -> red tests -> mock wiring -> real implementation.
   - Why: catches structural errors early and keeps scope disciplined.
   - Sources: `codexreview.md:1182-1208`, `codexreview.md:1214-1218`.

13. **Reliability paths require explicit regression coverage**
   - Decision: bug fixes must add targeted tests (fallback, parse recovery, retry semantics, UX focus/formatting).
   - Why: most breakage occurs in edge paths, not happy-path demos.
   - Sources: `codexreview.md:250-257`, `DEMO_QUALITY_PLAYBOOK.md:105-117`.

14. **Automated tests are necessary but not sufficient**
   - Decision: keep manual AI demo QA and mobile checks as release gates.
   - Why: model behavior and device UX still require human verification.
   - Sources: `DEMO_QUALITY_PLAYBOOK.md:22-29`, `DEMO_QUALITY_PLAYBOOK.md:119-128`.

### 4) Process and Collaboration

15. **Contract-first multi-agent collaboration works**
   - Decision: split work by clear boundaries with pre-integration checks.
   - Why: parallel speed without merge chaos, if contracts are explicit.
   - Sources: `claude.md:999-1023`.

16. **Evidence-based reporting beats assumptions**
   - Lesson: claim status only with command/test evidence and clear blocked conditions.
   - Sources: `codexreview.md:624-643`, `DEMO_QUALITY_PLAYBOOK.md:132-137`.

## Contradictions and Drift Found in Source Material

1. `claude.md` still states outdated completion states (for example "storyThreads not done"), while current code contains `storyThreads` integration.
   - Source drift: `claude.md:162-200`
   - Current code indicators: `js/contracts.js`, `js/app.js`, `js/prompts.js`, `js/services/geminiStoryService.js`.

2. `codexreview.md` contains mixed historical states (both "e2e blocked" and "e2e passed"), which is useful as history but unsafe as canonical current status.
   - Source drift: `codexreview.md:1059` vs `codexreview.md:1084-1085` vs `codexreview.md:1118-1119`.

3. `CHANGELOG.md` and `AI_LESSONS_LEARNED.md` are under-updated relative to implemented reliability and prompt-quality work.
   - Source drift: `CHANGELOG.md:3-22`, `AI_LESSONS_LEARNED.md:1-21`.

## Analysis: What These Lessons Say About the Project

### Strong Patterns

- **Reliability maturity increased significantly**: the team repeatedly moved from ad-hoc fixes to explicit contracts and regression tests.
- **Narrative quality improves when constraints are concrete**: specific character motives + explicit craft rules outperform open-ended prompting.
- **Architecture discipline is intentional**: single-owner state and service boundaries are repeatedly reinforced.

### Recurring Failure Modes

- **Documentation drift**: operational logs grew faster than canonical docs.
- **Late continuity controls**: continuity/state handling was initially under-specified.
- **Environment variance**: e2e/manual behavior can diverge from sandbox conditions.

### Decision Quality Assessment

- **Best decisions so far**
  1. Service abstraction (AI/mock)
  2. Schema and validator-first reliability
  3. Test-first gates for risky features

- **Most expensive misses so far**
  1. Delayed continuity modeling (`storyThreads`)
  2. Treating review logs as status source
  3. Weak early treatment of persistence/device edge cases

### Practical Implications (Next 2 Weeks)

1. Keep this file as a staging synthesis, but distill durable entries into:
   - `CHANGELOG.md` (dated facts + short rationale)
   - `AI_LESSONS_LEARNED.md` (timeless rules)
2. Freeze `codexreview.md` as historical audit and stop using it as the current-state source.
3. Keep one active status snapshot (`README.md` + `docs/STATUS.md`) and expire stale claims quickly.
