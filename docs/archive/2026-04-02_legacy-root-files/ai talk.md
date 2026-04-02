# AI Talk (Story Quality Roadmap)

This doc is for improving storytelling quality in No Vacancies without a major rewrite.

## Priorities (in order)

1. Coherence: cause/effect, continuity, and time/progress feeling real
2. Agency: the next scene should obviously be a consequence of the chosen option
3. Variety: reduce repeated scene beats + repeated lesson popups
4. Length/ending feel: longer arcs and earned endings (no abrupt wrap-up)

Non-goals right now:
- Making mock mode "great" (if we hit it, the run already failed)
- Large architecture changes or new frameworks

## The four core problems (as player experience)

1. "I have seen this scene already." (repeat framing / repeat beats)
2. "I am being taught the same thing again." (repeat lessons / unearned lesson popups)
3. "My choice didn't matter." (generic follow-up scene that could fit any option)
4. "It ended before it earned the ending." (too short / artificial endings)

## What "good" looks like (rubric we can test)

- Each scene introduces 1 new beat (event, reveal, consequence, or meaningful thread delta)
- The first 1-2 sentences make it obvious which choice happened (without saying "because you chose...")
- Choices are different strategies, not paraphrases
- Lessons appear when earned; null is better than noise
- Endings have a ramp: 2-3 scenes that make the landing feel inevitable

## Definitions (so we can measure repetition)

- Scene framing: the opening setup + immediate action + key prop
  - Example: "rent math + phone glow + Oswaldo asleep"
- Beat: the change introduced (concrete event + ideally a thread delta)
- Strategy: player's intent category (avoid / confront / repair / exit)

## Fastest path (if we only do 2 things)

1. Immediate causality: enforce a "choice consequence line" in the first paragraph
2. Ending floor + ramp: no endings before ~10-12 scenes, then require 2-3 ramp scenes

These two changes fix: generic follow-ups, many repetitions, short runs, and abrupt endings.

---

## Proposed interventions (ranked, minimal-risk first)

### A) Make choices matter (agency)

Goal: the next scene should feel impossible to confuse with the other options.

Tactics:
- "Choice consequence line": first 1-2 sentences must show a concrete outcome of the chosen action.
- Strategy divergence: each set of choices must include at least 2 distinct strategies.
- "Could this follow any choice?" check: if yes, reject/regenerate once.

Avoid the common failure mode:
- Literal echo ("You chose WAKE OSWALDO...") is bad.
- Better: show consequence in behavior and room dynamics (noise, movement, a reaction).

Proof signals we can measure:
- A consequence appears before sentence 3.
- There is at least 1 new event, not just mood rephrasing.

### B) Reduce repeated scenes (variety)

Goal: stop reusing the same framing and the same props/pressure beats in a loop.

Tactics:
- "No repeat framing" rule: do not start two consecutive scenes with the same setup.
- Frame signature tracking: keep a sliding window of the last 2-3 frame signatures and forbid reuse unless the player explicitly repeats the same strategy.
- Location/time nudges: every ~3 scenes, force a small setting shift (bathroom, hallway, parking lot, front desk).
- Sensory anchor: require 1 new sensory anchor per scene (sound/smell/texture/object).

Proof signals:
- New noun/prop appears (not just "phone" again).
- Setting shifts at least every N scenes.

### C) Reduce repeated lessons (lesson quality)

Goal: lessons feel earned, specific, and not sermon-y.

Tactics:
- Lesson cooldown: do not reuse the same lesson within 3 scenes unless player repeats the same strategy.
- Prefer null: if lesson is unclear, show none rather than forcing one.
- "Earned lesson" structure: action -> consequence -> 1-line reflection (not an explanation, just a sharp observation).

Proof signals:
- LessonId is not repeated within cooldown window.
- Lesson popup correlates with a concrete event and consequence in the scene text.

### D) Avoid short/artificial endings (length + ending feel)

Goal: endings feel like the result of an arc, not a timer.

Tactics:
- Hard minimum scene floor: do not allow endings before 10-12 scenes (tunable).
- Ending ramp: require 2-3 scenes of approach (escalation, decision, final consequence).
- Soft endings: allow "Continue" into an epilogue mode (optional) instead of forcing replay.

Proof signals:
- No ending before the floor.
- Endings include ramp signals (pressure increases, options narrow, irreversible action).

---

## How to implement without a big rewrite (levers)

We have 4 levers, in increasing order of invasiveness:

1. Prompt language (lowest risk, but not reliable by itself)
2. Quality gates (reject + one repair/regenerate attempt)
3. Light state tracking (last frames, last lessons, last strategies)
4. Optional schema additions (only if needed)

Recommended pattern:
- Prompts describe the behavior.
- Gates enforce it (one retry max).
- State provides memory for cooldowns and repetition blocking.

---

## Quality checks (what to gate on)

These checks are meant to be cheap and deterministic:

- Choice specificity:
  - In first paragraph: must contain at least one consequence that clearly matches strategy (avoid/confront/repair/exit).
- Repetition:
  - Frame signature too similar to last scene -> fail once.
  - Scene token similarity too high -> fail once.
- Lesson quality:
  - Same lesson repeated within cooldown -> fail once (unless same strategy repeated).
- Ending control:
  - Ending before floor -> force non-ending.
  - Ending without ramp window -> fail once.

---

## Questions we should answer before tuning numbers

- Target median run length: 12 scenes? 16? (longer also increases repetition risk)
- Desired lesson density: every scene? every other scene? only on earned moments?
- What counts as "a new beat" in this story? (event, reveal, consequence, setting shift)
- Should choices always be 2 or 3? (3 increases variety but increases chance of generic continuation)

---

## Concerns you have not mentioned (but may bite later)

- Visibility: player cannot tell if they are in AI or fallback mode (it changes expectations).
- Progress illusion: if time/money stakes do not move, scenes feel like reskins even when prose changes.
- Over-constraint: too many rules can force the model into the same "safe" voice, which paradoxically increases sameness.
- Emotional pacing: no breath scenes -> constant tension becomes monotonous.

---

## If you ask another LLM for help (how to get useful answers)

Ask for:
- A lesson-earnedness rubric (action/consequence/reflection) with examples
- A strategy taxonomy for choices (avoid/confront/repair/exit) plus example choice sets
- 5-10 concrete scene-beat variations that fit the setting (so we have material to rotate)
- A ramp pattern for endings (2-3 scenes) that avoids feeling forced

