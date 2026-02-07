# AI System, Prompting, and Lesson Delivery Review (2026-02-05)

## A) How the AI system works right now

### Runtime flow

1. `app.js` picks service mode:
   - AI mode -> `geminiStoryService`
   - fallback mode -> `mockStoryService`
2. AI opening turn:
   - `getOpeningPrompt()` builds user prompt.
   - API request sends: `SYSTEM_PROMPT + "\n\n" + userPrompt`.
3. AI continuation turn:
   - `getContinuePrompt(...)` includes:
     - last ~5 scene history
     - thread state (`storyThreads`)
     - long-arc sampled memory
     - ending guidance after scene 8
4. Parse and reliability handling:
   - strict JSON parsing + code-block extraction fallback
   - one JSON recovery retry via `getRecoveryPrompt(...)`
   - if primary model fails, fallback model is attempted
5. Semantic quality gate:
   - rejects near-duplicate choices
   - rejects repetitive scene framing
   - requires concrete continuity callback after early scenes
   - triggers one quality-repair retry prompt
6. Scene formatting:
   - choice IDs normalized/sanitized
   - image/mood mapped to internal enums
   - final scene validated before apply
7. App state update:
   - `storyThreadUpdates` merged
   - lesson tracked for stats
   - if AI service fails mid-run, app falls back to mock recovery scene instead of forced ending.

### Prompt inventory (all prompt templates)

Prompt sources and full text are dumped in:
- `docs/AI_PROMPT_DUMP_2026-02-05.md`

Prompt templates in active use:
1. `SYSTEM_PROMPT` (`js/prompts.js`)
2. `getContinuePrompt(...)` (`js/prompts.js`)
3. `getOpeningPrompt()` (`js/prompts.js`)
4. `getRecoveryPrompt(...)` (`js/prompts.js`)
5. `buildQualityRepairPrompt(...)` (`js/services/geminiStoryService.js`)

## B) Characteristics of top-quality prompts for "aha"/self-recognition storytelling

### Conventional high-quality traits

1. **Concrete continuity constraints**: names, prior events, unresolved obligations.
2. **Clear voice constraints**: POV, tense, tone, sentence rhythm.
3. **Explicit output schema**: structured JSON with required/optional fields.
4. **Meaningful choice constraints**: choices must represent different strategies.
5. **Ending steering with guardrails**: no abrupt ending without narrative earning.
6. **Error-recovery prompts**: malformed output path that preserves style and flow.

### Unconventional but effective traits

1. **Identity mirror hooks**: ask model to include one "recognition sentence" where the player can project themselves.
2. **Emotional contradiction rule**: force at least one mixed emotion beat (relief + guilt, power + shame).
3. **Cost accounting beat**: each scene names one hidden cost (time, attention, dignity, risk).
4. **Micro-specific sensory anchor**: one tactile/ambient detail tied to stress state.
5. **Behavior over explanation clause**: forbid abstract psych labels; require observable behavior.
6. **Narrative debt ledger**: if a setup appears (car incident, money gap), it must be paid off within N scenes or explicitly deferred.

### "Aha moment" prompt pattern

To increase player self-recognition, prompts should force:
- one concrete callback ("this happened before"),
- one pattern reveal ("this keeps happening"),
- one self-implicating question ("what am I rewarding right now?"),
- one agency fork (different values, not just different words).

## C) Lesson delivery review (how each lesson is shown, and better options)

Current system:
- Lesson IDs are attached per scene (`lessonId`).
- Popups show title + quote after text typing completes.
- In AI mode, model decides lesson per scene (or null).
- In mock mode, lessons are pre-assigned in authored scenes.

Important gap:
- `detectLessonInScene(...)` exists but is not currently used as fallback/validator.

### Per-lesson assessment

| ID | Lesson | Current delivery quality | Suggested upgrade |
|---:|---|---|---|
| 1 | Load-Bearing Beams | Strong opening anchor | Re-surface with late-game mirror beat showing cumulative cost |
| 2 | They Don't Understand the Concept | Good dialogue trigger | Add explicit "misread competence as ease" callback rule |
| 3 | Resentment Toward Load-Bearer | Works in conflict scenes | Tie resentment to a specific success event for causality |
| 4 | Your Energy Keeps It Alive | Strong systemic lesson | Add "what breaks if you stop?" choice branch at least once/run |
| 5 | Output vs Presence | Present but under-highlighted | Add one quiet scene where no output is produced, then observe reactions |
| 6 | Invisibility of Competence | Good recurring fit | Require one "prevented disaster" line before each use |
| 7 | This Isn't Hard | Clear phrase trigger | Add behavioral proof contrast ("he tries once, fails, dismisses") |
| 8 | Asking for Help Doesn't Work | Appears, but can be deeper | Add failed ask + self-silencing follow-up in consecutive scenes |
| 9 | Discomfort Becomes Attacks | Good in defensive beats | Require escalation ladder (snip -> deflect -> accuse) |
| 10 | What You Actually Want to Hear | High emotional payoff | Reserve for climactic turns to avoid dilution |
| 11 | See It AND Act Accordingly | Strong insight, rare use | Add action-check line after any acknowledgment dialogue |
| 12 | Making Effort Legible | Strong behavioral mechanic | Explicitly frame as reality-reintroduction, not punishment |
| 13 | Won't vs Can't | Important pattern lesson | Add contrast proof in-scene every time this lesson appears |
| 14 | System Responds to Load Distribution | Conceptually strong | Convert abstract phrasing into visible task distribution moments |
| 15 | Infrastructure Gets Blamed | Underused but potent | Add one scene where one miss outweighs many saves |
| 16 | Relationships as Risk Reduction | High "aha" potential | Add "who reduces whose risk?" question as choice text |
| 17 | What Am I to You? | Strong late-game pivot | Trigger only after evidence accumulation for maximum impact |

### Structural improvements for lessons

1. Add lesson pacing policy:
   - early game: 1/2/6/7
   - middle game: 3/4/8/9/11/13/14/15
   - late game: 5/10/12/16/17
2. Add anti-repetition:
   - no same lesson ID in back-to-back scenes unless player repeats same coping strategy.
3. Add fallback lesson detection:
   - if AI returns null lesson but scene clearly matches a rule, infer one with `detectLessonInScene`.
4. Add lesson "show receipts":
   - every lesson scene includes one concrete proof line.

## D) What the app already does to improve prose + what to improve next

### What is already strong (current implementation)

1. Rich system prompt with voice, rhythm, behavior constraints.
2. Continuity state (`storyThreads`) included in turn prompts.
3. Long-arc memory sampling to prevent short-context amnesia.
4. Choice distinctness quality checks.
5. Repetition guard against near-duplicate scene framing.
6. Continuity callback quality gate.
7. One-shot quality-repair pass before accepting weak output.
8. Ending steering based on accumulated player choice patterns.

### Conventional improvements (high confidence)

1. **Scene beat contract**: require each scene to include:
   - pressure signal,
   - decision pressure,
   - consequence setup.
2. **Choice intent labels (internal only)**:
   - each choice tagged as avoid/confront/repair/exit, then strip tags before render.
3. **Lesson pacing schedule**:
   - enforce lesson arcs by scene range.
4. **Hard callback rule**:
   - at least one named callback from last two scenes and one from thread state.
5. **Dialogue realism pass**:
   - short second-pass prompt only for dialogue tightening.
6. **Model-side lexical diversity check**:
   - avoid repeated phrase stems from previous scene.

### Unconventional improvements (high upside)

1. **Aha sentence requirement**:
   - one line that reframes behavior as a pattern the player can recognize in themselves.
2. **Narrative debt ledger**:
   - unresolved setup must be referenced or closed within 3 scenes.
3. **Contradiction engine**:
   - each major scene carries one emotional contradiction (care + resentment).
4. **Shadow consequence pass**:
   - generate one unseen cost of each player choice and weave it subtly into next scene.
5. **Reader projection cue**:
   - one "you do this too" behavioral mirror per 2-3 scenes, non-judgmental tone.
6. **Compression pass for mobile readability**:
   - if scene exceeds rhythm threshold, rewrite with same content but sharper line breaks.

## Priority recommendations for immediate impact

1. Add lesson pacing + anti-repeat rule (high impact, low risk).
2. Add hard callback contract (named recent callback + thread callback).
3. Add scene beat contract (pressure -> choice pressure -> consequence setup).
4. Add fallback lesson detection using `detectLessonInScene`.
5. Add "aha sentence" micro-rule to continuation prompt.
