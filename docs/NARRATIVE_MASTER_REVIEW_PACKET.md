# Narrative Master Review Packet

**Reviewer role**: Red-team narrative architect
**Date**: 2026-02-08
**Scope**: All narrative/prompt/context assets listed in review request
**Method**: Cross-file diff analysis between canonical handwritten assets, prompt code (`js/prompts.js`), active runtime (`src/lib/server/ai/providers/grok.ts`), and orchestration layer (`gameRuntime.ts`, `storyService.ts`, `routeHelpers.ts`)

---

## Finding 1 — Canonical SYSTEM_PROMPT is completely absent from the active runtime

**Severity**: Critical

**Source lines**:
- `src/lib/server/ai/providers/grok.ts:224` — system message sent to xAI API
- `js/prompts.js:486-692` — canonical 207-line SYSTEM_PROMPT

**Evidence**:
The grok provider sends this as the system prompt:
```
"You are an interactive fiction engine. Output JSON only."
```
The canonical `SYSTEM_PROMPT` in `js/prompts.js` contains 207 lines of character psychology, writing craft rules, 17 lessons, dialogue patterns, sensory grounding, visual guardrails, ending logic, dark humor examples, and the full output schema. **None of it reaches the AI model.**

Zero imports of `js/prompts.js` or `SYSTEM_PROMPT` exist anywhere in the `src/` directory. The grok provider's `buildScenePrompt()` (lines 161-193) constructs a bare-bones user prompt with raw thread numbers and a schema skeleton, but no character voice, no lesson catalog, no writing craft rules.

**Proposed rewrite**:
Import or inline the canonical `SYSTEM_PROMPT` into `grok.ts` and send it as the system message:
```typescript
// grok.ts line 224
{ role: 'system', content: SYSTEM_PROMPT },
```
If cross-module import between `js/` and `src/` is blocked by the build, duplicate the system prompt into a `src/lib/server/ai/systemPrompt.ts` module with a note pointing to `js/prompts.js` as source of truth.

**Risk if ignored**: The AI model receives no character descriptions, no voice rules, no lesson catalog, no writing craft constraints, and no visual guardrails. Every scene generation is flying blind. This single gap invalidates all downstream narrative quality work. All handwritten assets, transition bridges, lesson pacing, and anti-repetition rules are inert.

---

## Finding 2 — NarrativeContext pipeline is plumbed end-to-end but never connected

**Severity**: Critical

**Source lines**:
- `src/lib/game/gameRuntime.ts:242` — calls `storyService.getNextScene()` without `narrativeContext`
- `src/lib/services/storyService.ts:118` — `narrativeContext` defaults to `null`
- `src/lib/server/ai/routeHelpers.ts:42` — `narrativeContext` forwarded as `null`
- `src/lib/server/ai/providers/grok.ts:164` — `formatNarrativeContext(input.narrativeContext)` returns `''` when null
- `js/prompts.js:392-433` — `buildNarrativeContext()` exists, never called from `src/`

**Evidence**:
The full pipeline exists:
1. `buildNarrativeContext()` builds rich context from `gameState` (thread translations, boundary translations, lesson history, transition bridges, scene compression, budget enforcement).
2. `storyService.getNextScene()` accepts `narrativeContext` parameter.
3. API route `/api/story/next` accepts and forwards `narrativeContext`.
4. `grok.ts` has `formatNarrativeContext()` that renders context into prompt text.

But `gameRuntime.handleChoice()` at line 242 calls:
```typescript
const nextScene = await storyService.getNextScene(gameState.currentSceneId, choiceId, gameState);
```
Three arguments. No `narrativeContext`. The entire context pipeline produces nothing.

**Proposed rewrite**:
In `gameRuntime.ts`, build and pass context before the service call:
```typescript
const narrativeContext = buildNarrativeContext(gameState, { lastChoiceText: choiceText });
const nextScene = await storyService.getNextScene(
    gameState.currentSceneId, choiceId, gameState, narrativeContext
);
```
This requires either importing `buildNarrativeContext` from `js/prompts.js` or porting it to `src/lib/`.

**Risk if ignored**: All handwritten thread voice maps, boundary translations, lesson history translations, scene compression, and context budget enforcement are dead code. The AI receives raw numeric state (`oswaldoConflict=1`) instead of narrative voice ("Every question turns into a dodge. He acts accused before anyone accuses him."). Thread-state-driven storytelling is effectively disabled.

---

## Finding 3 — Transition bridge system is fully dead

**Severity**: High

**Source lines**:
- `js/prompts.js:92-113` — `TRANSITION_BRIDGE_MAP` with 8 handwritten bridge lines
- `js/prompts.js:346-373` — `detectThreadTransitions()` function
- `js/prompts.js:375-384` — `resolveTransitionBridge()` reads from `gameState.pendingTransitionBridge`
- `src/lib/game/gameRuntime.ts:161` — `gameState.pendingTransitionBridge = null;` (only write)
- `src/lib/contracts/game.ts:187` — initialized to `null`

**Evidence**:
`TRANSITION_BRIDGE_MAP` defines earned escalation/de-escalation narration for major state jumps (e.g., `oswaldoConflict 0->2`, `trinaTension 1->3`). `detectThreadTransitions()` compares previous vs current threads and returns matching bridge lines. But:

1. Nobody calls `detectThreadTransitions()`. Grep returns zero call sites outside of its definition and tests.
2. `gameRuntime.applyScene()` sets `pendingTransitionBridge = null` unconditionally (line 161). No code path ever writes a real value.
3. `resolveTransitionBridge()` faithfully reads from `pendingTransitionBridge`, but it's always null.
4. The `formatNarrativeContextSection()` in `js/prompts.js:453-457` renders bridges when present, but they're never present.

**Proposed rewrite**:
In `gameRuntime.applyScene()`, detect transitions before nulling the bridge:
```typescript
if (scene.storyThreadUpdates) {
    const previousThreads = { ...gameState.storyThreads };
    gameState.storyThreads = mergeThreadUpdates(gameState.storyThreads, scene.storyThreadUpdates);
    const bridge = detectThreadTransitions(previousThreads, gameState.storyThreads);
    gameState.pendingTransitionBridge = bridge.lines.length > 0 ? bridge : null;
} else {
    gameState.pendingTransitionBridge = null;
}
```

**Risk if ignored**: State jumps feel unearned. A character going from neutral to hostile with no narrative bridge breaks immersion. The 8 handwritten transition lines (e.g., "It goes from swallowed comments to open war after he calls her 'dramatic' while she's counting rent money.") are wasted. The `LOCAL_NARRATIVE_UPGRADE_PLAN.md` Phase 3 tests (T3.1, T3.2) will be permanently blocked.

---

## Finding 4 — Trina thread translations stripped of behavioral specifics vs handwritten assets

**Severity**: Medium

**Source lines**:
- `docs/HANDWRITTEN_NARRATIVE_ASSETS.md:22-24` — full Trina voice map
- `js/prompts.js:23-28` — truncated `TRINA_TENSION_TRANSLATIONS`

**Evidence**:

| Level | Handwritten Asset | Active Translation |
|-------|------------------|--------------------|
| 2 | "Trina's taking and taking and doesn't even see it as taking. **She catfishes a guy on Facebook Dating for forty dollars, buys smokes, orders DoorDash for herself, and calls that survival.**" | "Trina's taking and taking and does not even see it as taking." |
| 3 | "Something has to happen with Trina. The math doesn't work anymore. **Sydney fronts Trina the referral money, Trina hits six hundred at the casino, vanishes without a thank-you, then comes back broke two days later.**" | "Something has to happen with Trina. The math does not work anymore." |

The behavioral specifics are exactly the kind of concrete detail that gives the AI model material to write with. The SYSTEM_PROMPT itself (lines 556-558) does include these Trina details, but per Finding 1, the SYSTEM_PROMPT is never sent to the model. The thread translations are the *only* mechanism that could inject Trina detail, and they're stripped bare.

**Proposed rewrite**:
Restore the full handwritten lines in `TRINA_TENSION_TRANSLATIONS`:
```javascript
'2': "Trina's taking and taking and does not even see it as taking. She catfishes a guy on Facebook Dating for forty dollars, buys smokes, orders DoorDash for herself, and calls that survival.",
'3': "Something has to happen with Trina. The math does not work anymore. Sydney fronts Trina the referral money, Trina hits six hundred at the casino, vanishes without a thank-you, then comes back broke two days later."
```

**Risk if ignored**: Trina degrades to a generic freeloader archetype. The catfish/casino/snack-cake behavioral specifics are what make her a real character instead of a plot device. Without them, the AI has no concrete Trina material to draw from in the active runtime.

---

## Finding 5 — Money translation voice drift between canonical sources

**Severity**: Low

**Source lines**:
- `docs/HANDWRITTEN_NARRATIVE_ASSETS.md:27` — `false`: "The eighteen-dollar gap is still open, and the clock keeps moving like it gets paid to panic her."
- `js/prompts.js:33` — `false`: "Still eighteen short. The clock does not care."

**Evidence**:
Both lines are in-voice and functional, but they're different. The handwritten version is more vivid ("the clock keeps moving like it gets paid to panic her"). The prompts.js version is terse and punchy ("The clock does not care."). Neither is wrong, but the divergence means edits to one source don't propagate, and developers can't trust either as authoritative.

**Proposed rewrite**:
Pick one. The handwritten version has more texture for AI prompting. If brevity is preferred, keep the prompts.js version but annotate the handwritten doc as superseded.

**Risk if ignored**: Minor drift that erodes trust in the traceability map. Sets a precedent for silent asset divergence.

---

## Finding 6 — Two incompatible continue-prompt codepaths, neither used by active runtime

**Severity**: High

**Source lines**:
- `js/prompts.js:703-759` — `getContinuePrompt()` (history-based, old path)
- `js/prompts.js:767-806` — `getContinuePromptFromContext()` (NarrativeContext-based, new path)
- `src/lib/server/ai/providers/grok.ts:161-193` — `buildScenePrompt()` (third, independent path)

**Evidence**:
Three different continue-prompt builders exist:

1. **`getContinuePrompt()`** — Takes raw `previousScenes[]`, `lastChoice`, `sceneCount`, `suggestedEnding`, `threads`. Includes `formatThreadState()`, `buildLongArcSummary()`, ending guidance. This was the Gemini-era path.

2. **`getContinuePromptFromContext()`** — Takes a `NarrativeContext` object. Includes the full `formatNarrativeContextSection()` with thread narrative read, boundary read, lesson history, transition bridges, and context budget metadata. This is the intended upgrade path.

3. **`buildScenePrompt()` in grok.ts** — Takes `GenerateSceneInput`. Builds its own minimal prompt with raw thread numbers, a `formatNarrativeContext()` call (different function, local to grok.ts), and no ending guidance, no lesson catalog, no voice rules.

None of the three share logic. The grok provider doesn't use either `js/prompts.js` function. The `getContinuePromptFromContext()` path was built for Phase 2 of the upgrade plan but is never called.

**Proposed rewrite**:
Consolidate on `getContinuePromptFromContext()` as the single continue-prompt path. Have the grok provider consume its output as the user message, paired with the canonical SYSTEM_PROMPT as the system message. Delete or deprecate `getContinuePrompt()` and the grok-local `buildScenePrompt()`.

**Risk if ignored**: Three diverging prompt paths guarantee silent regression. Fixes applied to one path don't reach the others. The upgrade plan's Phase 2 work (`NarrativeContext` as single source of truth) is blocked because the active runtime ignores the new path entirely.

---

## Finding 7 — `detectLessonInScene()` exists but is never called as fallback

**Severity**: Medium

**Source lines**:
- `js/lessons.js:343-361` — `detectLessonInScene()` function
- `docs/AI_SYSTEM_WRITING_LESSON_REVIEW_2026-02-05.md:87` — "Important gap: `detectLessonInScene(...)` exists but is not currently used as fallback/validator."
- `docs/AI_SYSTEM_WRITING_LESSON_REVIEW_2026-02-05.md:118-119` — Priority recommendation #4: "Add fallback lesson detection using `detectLessonInScene`."

**Evidence**:
The function performs keyword matching against scene text to infer lessons. It covers 12 of 17 lessons. The prior review explicitly flagged this as a gap and recommended it as a priority fix. No action was taken. The grok provider's `normalizeScene()` accepts whatever `lessonId` the AI returns (or null) with no fallback validation.

**Proposed rewrite**:
In `grok.ts normalizeScene()`, add fallback detection:
```typescript
if (normalized.lessonId === null) {
    normalized.lessonId = detectLessonInScene(normalized.sceneText);
}
```

**Risk if ignored**: Lessons that are clearly demonstrated in scene text go unlabeled. Lesson tracking stats undercount. The lesson popup system (which fires on non-null `lessonId`) misses moments the player should see. The review doc's own #4 priority recommendation remains indefinitely deferred.

---

## Finding 8 — Ending guidance absent from grok provider

**Severity**: High

**Source lines**:
- `js/prompts.js:718-737` — ending guidance logic in `getContinuePrompt()`
- `js/prompts.js:771-785` — ending guidance logic in `getContinuePromptFromContext()`
- `src/lib/server/ai/providers/grok.ts:161-193` — `buildScenePrompt()` with no ending guidance

**Evidence**:
Both `js/prompts.js` continue-prompt functions inject ending steering after scene 8: type-specific guidance for RARE/EXIT/SHIFT/LOOP endings, plus the `suggestEndingFromHistory()` pattern-matching function. The grok provider's `buildScenePrompt()` has zero ending awareness. It never checks `sceneCount`, never calls `suggestEndingFromHistory()`, and never injects ending guidance text.

The SYSTEM_PROMPT says "After 8-15 scenes, steer toward an ending based on choice patterns" and "Minimum 5 scenes before any ending." But since the SYSTEM_PROMPT isn't sent (Finding 1), and the user prompt has no ending guidance either, the AI has no pacing signal. It could end at scene 2 or run to scene 50.

**Proposed rewrite**:
Add ending guidance to `buildScenePrompt()` when `input.gameState.sceneCount >= 8`, or (preferred) consume `getContinuePromptFromContext()` which already handles this.

**Risk if ignored**: Stories have no pacing arc. Endings arrive randomly or never. The four ending types (loop/shift/exit/rare) aren't steered by player behavior. The endgame experience is arbitrary instead of earned.

---

## Finding 9 — Handwritten scene template copy, choice-cost archetypes, mood end-beats, combo-state lines, and banned phrasing are all unused

**Severity**: Medium

**Source lines**:
- `docs/HANDWRITTEN_NARRATIVE_ASSETS.md:83-132` — 6 scene templates with feeling/stakes/cost guidance
- `docs/HANDWRITTEN_NARRATIVE_ASSETS.md:134-143` — 5 choice-cost archetype lines
- `docs/HANDWRITTEN_NARRATIVE_ASSETS.md:73-81` — 5 combo-state lines
- `docs/HANDWRITTEN_NARRATIVE_ASSETS.md:197-204` — 5 mood end-beat rules
- `docs/HANDWRITTEN_NARRATIVE_ASSETS.md:162-169` — banned phrasing list

**Evidence**:
These handwritten assets were carefully authored to constrain AI output quality. None appear in any prompt template (`js/prompts.js` or `grok.ts`), any quality gate, or any validation pass. They exist only in the doc file.

Notably, the scene templates define per-archetype word count ranges (e.g., "Rising Tension: 160-210 words", "Breaking Point: 220-300 words") that are more nuanced than the flat "150-250 words" in the SYSTEM_PROMPT. The choice-cost archetypes ("Money cost: This keeps the lights on today and steals from tomorrow") would give the AI concrete vocabulary for differentiated choices. The banned phrasing list ("The lesson is...", "Everything happens for a reason") could be a post-generation quality check.

**Proposed rewrite**:
Phase in order of impact:
1. Add banned phrasing as a post-generation check in the sanity evaluator (`evaluateStorySanity`).
2. Add choice-cost archetype lines to the SYSTEM_PROMPT's choice guidance section.
3. Add combo-state injection in `translateThreadStateNarrative()` when matching conditions are met.
4. Add mood end-beat rules to the SYSTEM_PROMPT's mood section.
5. Scene templates are lower priority unless arc-position-aware prompting is added.

**Risk if ignored**: The handwritten worksheet becomes shelfware. Writers invest in craft constraints that never reach the model. Banned phrasing appears in output with no check. Choices converge on the same cost type instead of forcing trade-offs.

---

## Finding 10 — `exhaustionLevel` translation has an extra level 0 in prompts.js not in handwritten assets

**Severity**: Low

**Source lines**:
- `js/prompts.js:55` — `'0': "She's awake, alert, and has not spent herself yet."`
- `docs/HANDWRITTEN_NARRATIVE_ASSETS.md:48` — starts at level 1

**Evidence**:
The handwritten assets define exhaustion levels 1-5. The `EXHAUSTION_TRANSLATIONS` in `prompts.js` adds a level 0 that doesn't appear in the handwritten source. The contracts define `exhaustionLevel` with `minimum: 1` in the response schema (`AI_PROMPT_DUMP_2026-02-05.md:382`) but the `GameState` type initializes it to `1`. Level 0 in the translation map is unreachable dead code.

**Proposed rewrite**:
Remove the `'0'` entry from `EXHAUSTION_TRANSLATIONS`, or add it to the handwritten assets if intentional. If level 0 represents a pre-game state, document that explicitly.

**Risk if ignored**: Cosmetic inconsistency. A developer reading the translation map will expect level 0 to be reachable. It isn't. Minimal practical impact.

---

## Finding 11 — Opening prompt hardcodes Lesson 1 in `js/prompts.js` but grok provider has no lesson reference

**Severity**: Medium

**Source lines**:
- `js/prompts.js:824` — "This scene demonstrates Lesson 1: Load-bearing beams get leaned on."
- `src/lib/server/ai/providers/grok.ts:172-176` — opening prompt with no lesson reference
- `docs/HANDWRITTEN_NARRATIVE_ASSETS.md:148-159` — lesson labeling rubric says prefer `null` unless clearly central

**Evidence**:
The `js/prompts.js` opening prompt explicitly tells the AI to demonstrate Lesson 1. The grok provider's opening prompt says only "Write opening scene with immediate pressure and 2-3 meaningful choices with distinct costs." No lesson guidance. The handwritten rubric says to "write the scene first, then label lessonId."

There's a philosophical tension: the `js/prompts.js` path prescribes a lesson upfront, which contradicts the rubric's "write first, label after" principle. The grok provider avoids this by omitting lessons entirely, but loses the anchor that Lesson 1 ("Load-Bearing Beams") is the natural opening frame.

**Proposed rewrite**:
Add a soft lesson hint to the opening prompt: "The opening scene naturally demonstrates the load-bearing concept (Lesson 1), but do not lecture. Write the scene first, then set lessonId."

**Risk if ignored**: Opening scenes lack thematic anchoring. Lesson 1 is the strongest first-impression lesson and defines the game's thesis. Without it, openings may be atmospheric but thematically rootless.

---

## Finding 12 — Anti-repetition quality gate exists only in `js/` service, not in grok provider

**Severity**: Medium

**Source lines**:
- `docs/AI_SYSTEM_WRITING_LESSON_REVIEW_2026-02-05.md:24-27` — quality gate described (rejects near-duplicate choices, repetitive framing, missing callbacks)
- `src/lib/server/ai/providers/grok.ts:293-311` — `generateScene()` runs `validateScene()` and `evaluateStorySanity()` only

**Evidence**:
The old Gemini service (`js/services/geminiStoryService.js`) had a semantic quality gate that rejected near-duplicate choices, repetitive scene framing, and missing continuity callbacks, plus a one-shot quality-repair retry. The grok provider runs only `validateScene()` (schema check) and `evaluateStorySanity()` (basic sanity). It has no choice-distinctness check, no framing-repetition check, no callback-presence check, and no quality-repair retry.

**Proposed rewrite**:
Port the semantic quality checks from `geminiStoryService.js` into `evaluateStorySanity()` or a new `evaluateNarrativeQuality()` function that the grok provider calls before returning the scene.

**Risk if ignored**: Back-to-back scenes repeat the same conflict beat, choices are near-paraphrases of each other, and the AI never callbacks to recent history. These were solved problems in the Gemini pipeline that regressed during the provider migration.

---

## Finding 13 — Lesson history translation lines are generated but never reach the AI model

**Severity**: High

**Source lines**:
- `js/prompts.js:72-90` — `LESSON_HISTORY_TRANSLATIONS` (17 handwritten lines)
- `js/prompts.js:164-178` — `translateLessonHistory()` function
- `js/prompts.js:419` — lesson history lines included in `buildNarrativeContext()`

**Evidence**:
When a lesson is encountered, its ID is pushed to `gameState.lessonsEncountered`. The `translateLessonHistory()` function converts these IDs into narrative voice lines (e.g., Lesson 5: "She has already asked herself if they love her or just her output."). These lines are included in the `NarrativeContext` object. But per Finding 2, `NarrativeContext` is never built or passed. So the AI has no knowledge of which lessons have already appeared. It can re-teach the same lesson in consecutive scenes.

**Proposed rewrite**:
Blocked by Finding 2. Once `NarrativeContext` is wired, lesson history lines will flow automatically. No additional code needed—just connect the pipeline.

**Risk if ignored**: The AI re-surfaces the same lesson repeatedly. Players see the same popup. The "already surfaced" signal that should prevent re-teaching is never sent. Lesson diversity degrades over multi-scene runs.

---

## Priority Ranking: Top 5 Lowest-Risk, Highest-Impact Fixes

### Fix 1: Inject canonical SYSTEM_PROMPT into grok provider
**Finding**: #1
**Impact**: Restores all character psychology, 17 lessons, writing craft, voice rules, visual guardrails, and output schema to the active runtime.
**Risk**: Low. Additive change to one file (`grok.ts:224`). No architectural change. The prompt is already battle-tested from the Gemini era. Token cost increases but stays well within grok model limits.
**Effort**: ~30 minutes. Copy or import the prompt string.

### Fix 2: Wire NarrativeContext from gameRuntime through storyService to grok provider
**Finding**: #2
**Impact**: Activates all thread voice translations, boundary translations, lesson history, scene compression, context budgeting, and the NarrativeContext formatting already built into `grok.ts:formatNarrativeContext()`.
**Risk**: Low. The pipeline is fully plumbed. Only the call site in `gameRuntime.handleChoice()` needs to change—adding one function call and one argument. All downstream code already handles the `NarrativeContext` shape.
**Effort**: ~1 hour. Port or import `buildNarrativeContext()`, add it to `handleChoice()`.

### Fix 3: Connect transition bridge detection in gameRuntime.applyScene()
**Finding**: #3
**Impact**: Makes state jumps feel narratively earned. Activates 8 handwritten bridge lines. Unblocks Phase 3 tests (T3.1, T3.2).
**Risk**: Very low. The detection function and bridge map already exist and are tested. Only change is calling `detectThreadTransitions()` in `applyScene()` and writing the result to `pendingTransitionBridge` instead of null.
**Effort**: ~30 minutes. 5-line code change.

### Fix 4: Restore full Trina behavioral specifics in thread translations
**Finding**: #4
**Impact**: Gives the AI concrete Trina behavioral material (catfish, casino, snack cakes) in the only mechanism that currently reaches it (thread translations, once Finding 2 is fixed).
**Risk**: Very low. String-only change in `TRINA_TENSION_TRANSLATIONS`. No architectural change. No test breakage risk.
**Effort**: ~10 minutes. Two string edits.

### Fix 5: Add `detectLessonInScene()` as post-parse fallback in grok normalizer
**Finding**: #7
**Impact**: Catches clearly demonstrated lessons that the AI failed to label. Improves lesson tracking accuracy and popup coverage.
**Risk**: Very low. Additive. Falls through to existing behavior (null) if no match. The function already handles 12 of 17 lessons with conservative keyword matching.
**Effort**: ~20 minutes. One import, one conditional in `normalizeScene()`.

---

## Dependency Graph for Fixes

```
Fix 1 (SYSTEM_PROMPT) ─── standalone, no deps
Fix 4 (Trina lines)  ─── standalone, no deps
Fix 5 (lesson detect) ── standalone, no deps

Fix 2 (NarrativeContext) ── requires buildNarrativeContext ported to src/
Fix 3 (transition bridges) ── requires detectThreadTransitions ported to src/
                           ── full value requires Fix 2 to deliver context to AI

Recommended order: 1 → 4 → 5 → 2 → 3
```

---

## Appendix: Review Checklist Cross-Reference

| HANDWRITTEN_NARRATIVE_ASSETS.md Checklist Item | Status |
|-----------------------------------------------|--------|
| All required sections filled | Pass |
| Lines match Sydney voice | Pass (in doc); **Fail** (stripped in active translations) |
| No didactic moralizing language | Pass |
| Choice costs are distinct and meaningful | Pass (in doc); **Fail** (never injected into prompts) |
| `null` lesson guidance is explicit | Pass (in doc and SYSTEM_PROMPT); **Fail** (SYSTEM_PROMPT not sent) |
| Recovery text preserves narrative content | Pass (in `js/prompts.js`); **Fail** (grok has no recovery path) |
| Template language is not repetitive | Pass |

---

## Summary

The narrative asset system has strong creative foundations—rich handwritten voice maps, a detailed 17-lesson catalog, transition bridges, context budgeting, and multiple layers of quality enforcement. The problem is **none of it is connected to the active runtime**. The grok provider operates with a 10-word system prompt, no character descriptions, raw numeric state, no lesson awareness, no ending guidance, no quality gates beyond basic schema validation, and no recovery path. The `js/prompts.js` code represents the intended design; `src/lib/server/ai/providers/grok.ts` represents what actually runs. The gap between them is total.

The five recommended fixes are ordered to maximize narrative quality gain per line of code changed. Fixes 1, 4, and 5 are independent and can ship in parallel. Fixes 2 and 3 require porting functions from `js/` to `src/` but the logic already exists and is tested.
