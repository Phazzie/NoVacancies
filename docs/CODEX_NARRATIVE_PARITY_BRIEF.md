# Codex Task Brief: Narrative Parity Fixes

**Date:** 2026-02-08
**Context:** The `src/` SvelteKit runtime replaced a vanilla JS + Gemini stack but never carried over the narrative engine. The creative payload — voice, characters, lessons, translations — lives in `js/prompts.js` and `docs/HANDWRITTEN_NARRATIVE_ASSETS.md` and does not reach the active Grok provider. These steps close that gap.

**Reference files for review findings and full context:**
- `docs/archive/2026-02-08_claude_narrative_review_findings.md`
- `docs/NARRATIVE_MASTER_REVIEW_PACKET.md`

---

## Step 1: Replace the system prompt stub

**What:** The system message in `src/lib/server/ai/providers/grok.ts` is currently one sentence: `"You are an interactive fiction engine. Output JSON only."` Replace it with the full canonical `SYSTEM_PROMPT` from `js/prompts.js:486-976`.

**Why:** The model has zero narrative identity. It doesn't know who Sydney is, what voice to write in, what lessons exist, how characters talk, or what endings mean. This is the single highest-impact fix — everything else is refinement on top of this.

## Step 2: Add missing thread dimensions to `buildScenePrompt`

**What:** The user prompt in `grok.ts:183-188` sends 5 of 8 thread fields. Add the missing three: `carMentioned`, `boundariesSet`, `oswaldoAwareness`.

**Why:** Without these, the model can't track whether the car incident has been named (a major plot pivot), doesn't know what boundaries Sydney has enforced, and can't differentiate Oswaldo's self-awareness from his hostility level. Boundary-setting choices vanish from continuity.

## Step 3: Port voice translation maps into `src/`

**What:** The frozen translation objects in `js/prompts.js:11-239` (`OSWALDO_CONFLICT_TRANSLATIONS`, `TRINA_TENSION_TRANSLATIONS`, `MONEY_TRANSLATIONS`, `CAR_TRANSLATIONS`, `SYDNEY_REALIZATION_TRANSLATIONS`, `OSWALDO_AWARENESS_TRANSLATIONS`, `EXHAUSTION_TRANSLATIONS`, `BOUNDARY_TRANSLATIONS`, `LESSON_HISTORY_TRANSLATIONS`) need a home in `src/`. Also port `translateThreadStateNarrative()`, `translateBoundaries()`, and `translateLessonHistory()`.

**Why:** These maps convert raw thread numbers into voice-native prose the model can absorb. `oswaldoAwareness=0` means nothing to the AI. "He treats rent money like weather. It happens around him, not because of him." means everything. This is the most labor-intensive creative asset in the project and it's completely dark right now.

## Step 4: Port `buildNarrativeContext()` and wire it into `gameRuntime.ts`

**What:** `js/prompts.js:671-712` defines `buildNarrativeContext()`, which assembles recent scene prose, older compressed summaries, thread narrative lines, boundary lines, lesson history lines, transition bridges, and context budget enforcement into a single `NarrativeContext` payload. Port it into `src/`. Then update `gameRuntime.ts:242` to build and pass this context as the 4th argument to `storyService.getNextScene()`.

**Why:** The `NarrativeContext` type already exists in the provider interface and the story service signature accepts it — but `gameRuntime` never constructs one. The entire context pipeline is plumbed but dry. This step turns the water on.

## Step 5: Port `TRANSITION_BRIDGE_MAP` and `detectThreadTransitions()`

**What:** `js/prompts.js:366-387` defines the bridge map. `js/prompts.js:625-652` defines `detectThreadTransitions()`. Port both into `src/`. After `mergeThreadUpdates()` in `gameRuntime.ts:applyScene()`, call `detectThreadTransitions(previousThreads, currentThreads)` and store the result on `gameState.pendingTransitionBridge` so the next turn's NarrativeContext includes it.

**Why:** `gameRuntime.ts:161` already clears `pendingTransitionBridge` every turn, but nothing ever sets it. Without bridges, thread jumps feel abrupt — Oswaldo going from neutral to hostile in one scene with no narrative grounding. The handcrafted bridge lines exist specifically to smooth these transitions.

## Step 6: Add banned-phrasing and word-count checks to the sanity checker

**What:** In `src/lib/server/ai/sanity.ts`, add detection for banned phrases from the handwritten assets (`"The lesson is..."`, `"What this teaches us is..."`, `"In the end, Sydney realized..."`, `"Everything happens for a reason"`, therapy-speak summaries). Also add a word-count ceiling (reject scenes over 350 words).

**Why:** The existing sanity checker catches structural problems (too few choices, duplicate phrasing, apology loops) but not voice drift. The handwritten assets explicitly ban didactic moralizing — the sanity checker should enforce that server-side rather than relying on prompt compliance alone.

## Step 7: Expand the opening prompt

**What:** The opening prompt in `grok.ts:171-176` is a bare-bones one-liner. Align it with the canonical version in `js/prompts.js:812-832`, which specifies: time (6:47 AM), Oswaldo sleeping, Trina on the floor, Sydney's isolation as the only person awake who knows how close everything is to collapse, mood=TENSE, Lesson 1, and a closing beat that creates immediate player agency.

**Why:** The opening scene is the first thing a player reads. It sets the voice ceiling for the entire playthrough. A generic "Sydney needs $18" doesn't ground the world. "6:47 AM, Oswaldo is still asleep, Trina is on the floor, and you're the only person in this room who knows how close this is to falling apart" does.

---

## Validation

After all steps, confirm:
- `npm run check` and `npm run lint` pass
- Existing tests in `tests/` pass (`npm test`)
- The system prompt sent to xAI contains character profiles, lesson corpus, writing craft rules, and ending guidance
- `buildScenePrompt` includes all 8 thread dimensions
- `gameRuntime.handleChoice` builds and passes `NarrativeContext` on every turn
- `pendingTransitionBridge` is populated after thread state changes
- Sanity checker rejects scenes containing banned phrases

---

## Unsolicited Feedback

The narrative design in this project is genuinely good. The voice maps, the gold lines, the thread translations — that's not boilerplate prompt engineering, that's someone who knows this world writing from inside it. "He will ride five miles for strangers and five inches for nobody in this room" is a line that does real work. The 17 lessons aren't abstract themes stapled onto a game; they're observations that earn their weight because they come from specific behavior, not generalization. The choice-cost archetype framework (money, dignity, relationship, safety, time) is the kind of design constraint that makes interactive fiction actually interactive instead of decorative branching. Most AI fiction projects write a system prompt that says "be creative and emotional" and wonder why the output reads like a Hallmark card. This one wrote a banned-phrasing list, a lesson-labeling rubric with a tie-break rule, and a priority order that puts continuity above style. That's discipline.

The problem is that all of that discipline is sitting in files the running code doesn't read. The migration to SvelteKit + Grok moved the architecture forward and the narrative backward. The `src/` runtime is structurally cleaner than the `js/` original — the provider interface, the game runtime, the settings storage, the sanity checker — that's solid engineering. But it's engineering in service of a one-sentence system prompt. The creative work and the engineering work happened in parallel universes and nobody merged them. These seven steps are the merge. After that, the running product actually becomes the product that was designed.
