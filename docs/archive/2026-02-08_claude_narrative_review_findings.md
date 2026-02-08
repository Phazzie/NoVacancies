# Claude Narrative Review Findings

**Date:** 2026-02-08
**Reviewer:** Claude Opus 4.6
**Input:** `docs/NARRATIVE_MASTER_REVIEW_PACKET.md` (rebuilt from canonical live sources)
**Method:** Cross-referenced packet claims against actual source files in `src/` and `js/`

---

## Executive Summary

The `src/` runtime is narratively hollow. The entire creative payload — voice maps, character profiles, 17 lessons, handcrafted thread translations, transition bridges, banned phrasing, scene templates, and writing craft rules — lives in `js/prompts.js` and `docs/HANDWRITTEN_NARRATIVE_ASSETS.md`. None of it reaches the active Grok provider. The system prompt is a single sentence: `"You are an interactive fiction engine. Output JSON only."` This is not a parity gap. It is an unfinished migration that moved the plumbing and left the water behind.

---

## Findings

### F1: System prompt is a one-line stub; canonical voice/character/lesson depth is absent

**Severity:** Critical

**Source:** `src/lib/server/ai/providers/grok.ts:224`

```ts
{ role: 'system', content: 'You are an interactive fiction engine. Output JSON only.' }
```

**vs. canonical:** `js/prompts.js:486-976` — 490 lines containing setting, character profiles (Sydney, Oswaldo, Trina, Dex), 17 lessons, writing craft rules (voice, rhythm, dialogue, show-don't-tell, sensory grounding), ending logic, visual guardrails, anti-repetition rules, and priority order (continuity > character > agency > style).

**What this means:** The AI model has zero narrative identity. It doesn't know who Sydney is, what she does, why she stays, how Oswaldo deflects, what lessons to weave in, what voice to use, what endings mean, or what phrases to avoid. Every scene is generated blind. The months of prompt engineering in `js/prompts.js` are invisible to the running application.

**Proposed fix:** Import or inline the canonical `SYSTEM_PROMPT` as the system message in `callChat()`. This is the single largest quality lever in the project — one string replacement transforms output from generic interactive fiction to on-voice narrative.

**Risk if ignored:** Output quality is capped at "generic chatbot fiction." No character consistency, no thematic coherence, no voice ceiling.

---

### F2: `gameRuntime.ts` never builds or passes `NarrativeContext`

**Severity:** Critical

**Source:** `src/lib/game/gameRuntime.ts:242`

```ts
const nextScene = await storyService.getNextScene(gameState.currentSceneId, choiceId, gameState);
```

The 4th argument (`narrativeContext`) is never provided. `buildNarrativeContext()` from `js/prompts.js` has no equivalent in `src/`. The Grok provider's `formatNarrativeContext()` always receives `null` and emits empty string.

**What this means:** Thread narrative translations ("He treats rent money like weather..."), boundary translations ("The bank of Sydney is closed for Dex"), lesson history translations ("She's already felt the weight of being the only one holding this place up"), scene compression, long-arc memory, context budget enforcement, and transition bridges are all dead code. The model gets raw numbers but none of the voice-native context the system was designed to deliver.

**Proposed fix:** Port `buildNarrativeContext()` into `src/lib/`. Call it before each `getNextScene`. Pass the result as the 4th argument.

**Risk if ignored:** The entire narrative context pipeline — the most architecturally sophisticated part of the prompt system — is inert.

---

### F3: Transition bridge detection does not exist in `src/` runtime

**Severity:** High

**Source:**
- `detectThreadTransitions()` — exists only in `js/prompts.js:625-652`, no `src/` equivalent
- `TRANSITION_BRIDGE_MAP` — exists only in `js/prompts.js:366-387`, no `src/` equivalent
- `gameRuntime.ts:161` clears `pendingTransitionBridge` every turn but nothing ever populates it

**What this means:** Thread jumps (e.g., Oswaldo going from neutral to hostile) will feel abrupt and unearned. Handcrafted bridge lines like "It goes from swallowed comments to open war after he calls her 'dramatic' while she's counting rent money" will never reach the model. The `pendingTransitionBridge` field on `GameState` is structural dead weight.

**Proposed fix:** Port `TRANSITION_BRIDGE_MAP` and `detectThreadTransitions()` into `src/lib/`. After `mergeThreadUpdates()` in `applyScene()`, detect transitions and store them for the next turn's context.

**Risk if ignored:** Character behavior changes lack narrative grounding. Players experience tonal whiplash.

---

### F4: Grok user prompt omits 3 of 8 thread dimensions

**Severity:** High

**Source:** `src/lib/server/ai/providers/grok.ts:183-188`

Included: `oswaldoConflict`, `trinaTension`, `moneyResolved`, `sydneyRealization`, `exhaustionLevel`
Missing: `carMentioned`, `boundariesSet`, `oswaldoAwareness`

**Proposed fix:** Add the three missing fields to `buildScenePrompt`:

```ts
- carMentioned=${threads.carMentioned}
- boundariesSet=${JSON.stringify(threads.boundariesSet)}
- oswaldoAwareness=${threads.oswaldoAwareness}
```

**Risk if ignored:** The car incident (a major plot pivot) can be randomly re-introduced or never referenced. Boundary-setting choices become invisible to continuity. Oswaldo's awareness arc collapses into his conflict dimension.

---

### F5: Handwritten voice translations have no `src/` equivalent

**Severity:** High

**Source:** `js/prompts.js:11-239` defines 8 translation maps + `LESSON_HISTORY_TRANSLATIONS` + `TRANSITION_BRIDGE_MAP`. Zero imports of any translation map exist in `src/`.

**What this means:** Instead of "He treats rent money like weather. It happens around him, not because of him" the model sees `oswaldoAwareness=0`. The handwritten voice ceiling — the most labor-intensive creative asset in the project — is completely dark. The model must independently invent the narrative register for each thread state on every request.

**Proposed fix:** Port frozen translation objects and accessor functions into `src/lib/narrative/translations.ts`. Use in NarrativeContext builder.

**Risk if ignored:** Voice drift on every request. The creative asset with the highest effort-to-impact ratio is wasted.

---

### F6: Sanity checker misses narrative quality signals from handwritten assets

**Severity:** Medium

**Source:** `src/lib/server/ai/sanity.ts:16-50`

Checks present: text too short, insufficient/excessive choices, duplicate choice text, apology loops.

Missing per handwritten assets:
- Banned phrasing ("The lesson is...", "What this teaches us is...", therapy-speak)
- Scene text exceeding 350 words
- Didactic/moralizing language detection

**Proposed fix:** Add banned-phrase regex checks and word count ceiling (~10 lines).

**Risk if ignored:** AI drifts into after-school-special register without server-side detection.

---

### F7: Opening prompt lacks canonical grounding detail

**Severity:** Medium

**Source:** `src/lib/server/ai/providers/grok.ts:171-176`

Active: "Sydney has $47 and needs $18 by 11AM in a motel room with Oswaldo and Trina."
Canonical (`js/prompts.js:812-832`): specifies 6:47 AM, Oswaldo sleeping, Trina on the floor, Sydney's isolation, mood=TENSE, Lesson 1, "What do you do right now?" closing beat.

**Risk if ignored:** Opening scenes lack the grounding that establishes the world. First impression sets quality ceiling for playthrough.

---

## Uncomfortable Truths (Not Findings, But Context)

### The `src/` runtime is an unfinished migration, not a parity gap

The packet frames these issues as "gaps to fix." That undersells the situation. The `js/` codebase is the real narrative engine — refined over months with Gemini structured output, voice translations, transition bridges, context budgeting, and lesson labeling discipline. The `src/` codebase is a SvelteKit rewrite that replaced Gemini with Grok, dropped the structured output schema guarantee, and never carried over the creative payload. Calling `js/prompts.js` "canonical" and `src/` "active" without acknowledging that "active" means "running without the thing that makes it good" obscures the actual problem.

### Grok lacks Gemini's structured output guarantee

The `js/` codebase achieved "0% parsing errors" via Gemini's native `responseSchema` — the API enforces valid JSON at generation time. The Grok provider relies on prompt instruction + regex extraction (`extractJsonObject` + markdown fence stripping). This is a reliability regression. The sanity checker and `normalizeScene` help, but they're patching over a capability the provider doesn't have.

### `CLAUDE.md` describes the wrong codebase

The project documentation exhaustively covers the vanilla JS PWA (`app.js`, `renderer.js`, `geminiStoryService.js`). The running application is SvelteKit + xAI. A new contributor following `CLAUDE.md` would be studying the inactive architecture.

### The handwritten assets are the best writing in the project and they're disconnected from execution

The thread voice maps, transition lines, combo-state lines, scene templates, choice-cost archetypes, gold lines, and banned phrases in `HANDWRITTEN_NARRATIVE_ASSETS.md` represent real narrative design work. Not one line is imported, referenced, or injected by the `src/` runtime. It's a blueprint for a house that was built without consulting it.

---

## Top 5 Fixes (Lowest Risk, Highest Impact)

| Priority | Finding | What Changes | Lines of Code |
|----------|---------|-------------|---------------|
| 1 | F1: System prompt | One string replacement in `grok.ts:224` | ~1 (import + paste) |
| 2 | F4: Missing thread dims | 3 lines in template literal | 3 |
| 3 | F6: Banned phrasing | Regex array + check in `sanity.ts` | ~10 |
| 4 | F7: Opening prompt detail | Expand opening prompt string | ~10 |
| 5 | F2+F5: NarrativeContext + translations | Port builder + translation maps | ~300 (mechanical) |

F1 alone would likely improve output quality more than all other fixes combined.

---

**End of findings.**
