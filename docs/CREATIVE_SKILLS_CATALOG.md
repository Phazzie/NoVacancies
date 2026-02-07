# Creative Skills Catalog

Date: 2026-02-07
Scope: Story-generation and reliability-aware creative skill concepts for No Vacancies.

## Why this exists

These skills are designed to make scenes feel less generic, more emotionally sticky, and more coherent over time without breaking product invariants.

Each skill can be integrated in one or both ways:
- Prompt-level: Add rules/examples to `js/prompts.js`.
- Runtime-level: Add state, checks, or repair logic in `js/services/geminiStoryService.js` and contracts/tests.

## Original 12 Skills

1. `velvet-knife-dialogue`
   Purpose: Generate manipulative, plausible Oswaldo dialogue with layered deflection and guilt flips.
   App path: Prompt-level voice constraints plus optional runtime anti-repetition checks.

2. `landmine-sequencer`
   Purpose: Plant a detail in one scene and force payoff 2-4 scenes later.
   App path: Runtime thread fields for planted/payoff state plus prompt reminders.

3. `continuity-heist`
   Purpose: Retrieve overlooked prior details and convert them into present-scene leverage.
   App path: Prompt rule requiring one memory callback tied to current conflict.

4. `dark-humor-dimmer`
   Purpose: Tune humor intensity so it sharpens dread instead of deflating stakes.
   App path: Prompt rubric for humor bands by scene tension level.

5. `recognition-sentence-forge`
   Purpose: Produce one highly relatable mirror line per scene.
   App path: Prompt requirement for one concise recognition sentence, never as a lecture.

6. `sunk-cost-engine`
   Purpose: Keep Sydney's doubling-down motive evolving instead of repeating.
   App path: Prompt requirement for fresh sunk-cost framing tied to recent choices.

7. `choice-entropy-designer`
   Purpose: Ensure choices are morally messy and non-obvious.
   App path: Runtime quality check that rejects low-delta choices and triggers repair.

8. `ending-title-blacksmith`
   Purpose: Create sharp, poetic 1-3 word ending titles with anti-cliche filters.
   App path: Prompt title constraints plus validator for banned generic phrases.

9. `narrative-chaos-monkey`
   Purpose: Stress-test malformed output and continuity breakage before demos.
   App path: Test harness/extensions in integration and e2e suites.

10. `sensory-graffiti`
    Purpose: Add one vivid, non-repeating sensory anchor to every scene.
    App path: Prompt schema/rule with lightweight repetition detection.

11. `subtext-over-exposition`
    Purpose: Convert "told feelings" into action/object/subtext.
    App path: Prompt rewrite instruction plus runtime linting heuristic for blunt summary phrases.

12. `invisible-labor-ledger`
    Purpose: Track unpaid labor moments so pressure compounds over scenes.
    App path: Runtime counters in thread updates and ending-logic influence.

## 10 New Skills

13. `clock-pressure-orchestrator`
    Purpose: Keep the 11 AM rent deadline alive with escalating time pressure cues.
    App path: Prompt rule for explicit time drift and consequence scaling.

14. `micro-betrayal-collector`
    Purpose: Accumulate small betrayals (food, money, attention) into major rupture energy.
    App path: Thread array of micro-betrayals surfaced in later confrontations.

15. `excuse-decomposer`
    Purpose: Turn vague excuses into specific contradictions players can notice.
    App path: Prompt directive to expose one contradiction whenever Oswaldo deflects.

16. `power-shift-choreographer`
    Purpose: Stage subtle control changes across scenes (who asks, who answers, who withholds).
    App path: Prompt beat map plus optional thread marker for current power holder.

17. `object-symbol-weaver`
    Purpose: Reuse mundane objects (charger, Hot Pocket, pop socket) as emotional symbols.
    App path: Prompt memory hook requiring one symbolic object callback.

18. `silence-as-dialogue`
    Purpose: Use pauses, non-answers, and avoidance as meaningful action.
    App path: Prompt craft rule to score silence as behavior, not empty space.

19. `threat-surface-scanner`
    Purpose: Detect when scene tension dips and inject grounded ambient risk.
    App path: Runtime quality gate that triggers repair when threat signal is too low.

20. `agency-debt-balancer`
    Purpose: Prevent fake agency by ensuring each choice changes at least one future lever.
    App path: Runtime check mapping each choice to thread/cost differences.

21. `continuity-cost-accountant`
    Purpose: Enforce consequences for prior claims so continuity has weight.
    App path: Thread-level "unpaid consequence" queue consumed in later scenes.

22. `exit-velocity-designer`
    Purpose: Shape ending approach so final scenes feel inevitable but not predetermined.
    App path: Prompt arc controls for tapering options and sharpening thematic closure.

## How these ideas were generated (thought process)

I used a constraints-first creative method:

1. Start from non-negotiables.
   The app must stay playable under fallback, preserve continuity, and avoid brittle output loops. Any skill concept had to support those constraints.

2. Target failure modes already common in AI narrative.
   I aimed directly at repetitive dialogue, flat choices, dropped continuity, tone drift, and weak endings.

3. Design for compounding effects, not one-scene tricks.
   Strong narrative systems accumulate pressure over time. Many skills were designed to plant, track, and pay off details later.

4. Split ideas into two implementation lanes.
   Prompt-only skills are fast to ship. Runtime/stateful skills are slower but stronger and testable.

5. Convert abstract craft into testable behaviors.
   Each concept was framed so it can become a prompt rubric, a contract field, or a quality gate.

6. Keep voice + reliability paired.
   "Creative" without guardrails causes regressions. Every stylistic idea was paired with an operational control path.

## Practical rollout order

1. Prompt-first pilot (fast)
   Start with: `sensory-graffiti`, `subtext-over-exposition`, `recognition-sentence-forge`.

2. Continuity layer (medium)
   Add: `landmine-sequencer`, `continuity-heist`, `micro-betrayal-collector`.

3. Choice/ending quality gates (strongest)
   Add: `choice-entropy-designer`, `agency-debt-balancer`, `ending-title-blacksmith`, `exit-velocity-designer`.

## Notes

- These are "skills" in the agent/workflow sense and can also become in-app behavior through prompts, contracts, service checks, and tests.
- Use incremental rollout so creative gains do not compromise reliability.
