# Story Abstraction: Planning Guidance for Codex

**What this is:** Guidance for writing and then executing an implementation plan. This is not the plan. Read the whole thing before you touch a file or write a single implementation step.

---

## The Task in One Sentence

No Vacancies is currently hardcoded to one story. Make it a multi-story engine where No Vacancies is the first cartridge, by extracting all story-specific content into a `StoryDefinition` type and making the engine read from it.

---

## What Exists Before You Start

The codebase has 11 hardcoded heuristic components, all No Vacancies-specific, with zero story abstraction. Every translation map, every frozen Record, every keyword list lives in TypeScript files. There is no `StoryDefinition` type anywhere. Read these files completely before planning:

| File | Why it matters |
|------|---------------|
| `src/lib/game/narrativeContext.ts` | Contains all frozen Records (`OSWALDO_CONFLICT_TRANSLATIONS` etc.) — these become voice maps in `StoryDefinition`. Also has `detectBeatLabel()` and `TRANSITION_BRIDGE_MAP` which need to be replaced. |
| `src/lib/server/ai/narrative.ts` | The system prompt, `getContinuePromptFromContext()`, `suggestEndingFromHistory()`. The prompt builder needs to become parameterized from `StoryDefinition`. |
| `src/lib/contracts/game.ts` | `StoryThreads`, `GameState`, `NarrativeContext` types. Know these cold before touching them. |
| `src/lib/narrative/lessonsCatalog.ts` | The 17 lessons as they currently exist. Also has `detectLessonInScene()` — a keyword-based heuristic. |
| `src/lib/game/gameRuntime.ts` | How game state is managed, how `buildNarrativeContext()` gets called, how transition bridges get stored in `pendingTransitionBridge`. |
| `src/lib/server/ai/providers/grok.ts` | The AI provider. Understand the call flow: prompt in, JSON scene out, retry/recovery on parse failure. |
| `tests/narrative/narrativeQuality.test.js` | Read every test. Several Tier 1 tests assert that specific exports exist from `narrativeContext.ts`. Your refactoring will break these. Don't just delete tests to pass. |
| `docs/AI_LESSONS_LEARNED.md` | 44 lessons from iterating on this system. Read all of them. They exist because someone made each of those mistakes. |
| `docs/HANDWRITTEN_NARRATIVE_ASSETS.md` | The canonical voice map prose. This is the quality reference for what the frozen Records are supposed to sound like. |
| `docs/WRITING_STYLE_REFERENCE_MOTIVE_DRIVEN_ANTHROPOMORPHISM.md` | The 8 core writing rules. The AI prose evaluator (for the builder) must understand these. |

---

## Architectural Decisions Already Made

These are not up for debate. Plan around them.

### 1. Voice Maps Are the Primary Authored Content

The frozen Records in `narrativeContext.ts` (`OSWALDO_CONFLICT_TRANSLATIONS`, `TRINA_TENSION_TRANSLATIONS`, etc.) are already the right shape. Each maps a state value to a prose description like:

```
'2': "Things with Oswaldo do not argue anymore. They just collide and wait to see who apologizes first."
```

These become `MechanicDef.voiceMap` in `StoryDefinition`. The abstraction is extracting them into authored data per story. No Vacancies gets its own cartridge file that contains these exact prose strings.

### 2. Specific Heuristics That Must Be Replaced

These are not acceptable as code logic. Each has a specific replacement:

**`detectBeatLabel()` and beat label strings (`recentBeats: string[]`)**
- Problem: keyword substring matching (`'oswaldo'` in text → `'oswaldo deflection spiral'`). Misses paraphrases, fires on unrelated mentions.
- Replacement: inject the first sentence of the last 3 scenes directly as `recentOpenings: string[]`. Change the prompt instruction from "avoid beats listed in RECENT BEAT MEMORY" to "RECENT OPENING STRATEGIES (avoid repeating these angles): [first sentences]". The main model handles semantic anti-repetition — it's better at this than a keyword list.

**`suggestEndingFromHistory()` keyword scoring**
- Problem: tokenizes choice IDs (`"boundary_enforce_now"` → `["boundary", "enforce", "now"]`) and scores against keyword lists. Measures author naming conventions, not player intent. `"set_a_limit"` scores zero even though it's identical intent to `"boundary_enforce_now"`.
- Replacement: when `sceneCount >= 8`, inject the last 5 choice texts (full text, not IDs) plus the `endingGuidance` block. Let Grok reason about the player's trajectory from actual language.

**`summarizeNarrativeArc()` scene-count thresholds**
- Problem: `sceneCount <= 3` → `'opening pressure'`. Pure if/else. Adds no information the AI can't derive from `sceneCount` + thread state prose.
- Replacement: remove entirely. The `arcPosition` field in `NarrativeContext` disappears.

**`TRANSITION_BRIDGE_MAP` static lookup**
- Problem: covers 10 specific transitions out of potentially hundreds. When a jump happens that isn't in the map, nothing is injected. Also requires authors to pre-write bridges for every possible state transition in their story.
- Replacement: in `detectThreadTransitions()`, when a field changes by more than 1 step, instead of looking up a canned phrase, store the old and new prose values. In the prompt formatter, render as:
  ```
  STATE SHIFT: [mechanic name] moved from:
    BEFORE: "[old prose from voiceMap]"
    AFTER:  "[new prose from voiceMap]"
  Integrate this shift in one sentence. Let behavior show it. Don't announce it.
  ```
  This requires changing what `pendingTransitionBridge` stores — see the cascade note below.

### 3. ComboStateLine: Situational Language, Not Condition Predicates

```typescript
// Do not design this
interface ComboStateLine {
  conditions: Record<string, number | boolean | string>;
  line: string;
}

// Design this instead
interface ComboStateLine {
  when: string;  // "When exhaustion is high and money is unresolved"
  line: string;  // "She is too tired to be diplomatic and too broke to be gentle."
}
```

At runtime, inject all combo lines with their `when` descriptions. Grok reads the full room state prose and decides which apply. No hardcoded condition matching in code. The reason `conditions: Record<string, number>` fails: exact value matching misses adjacent values (exhaustionLevel 4 and 5 are just as "high" as 3), and the author would have to write the same line multiple times. The `when` string handles this naturally.

### 4. Behavioral Catalogs Are Seeds, Not Inventories

```typescript
// Do not design this
behaviorCatalog: {
  uselessTo: string[];  // exhaustive pre-written list of incidents
}

// Design this
interface BehaviorSeed {
  incident: string;  // "Rides bike 5 miles for Dex's smokes, asks Sydney to DoorDash him water"
  pattern: string;   // "Selectively allocates effort based on who validates him, not who needs him"
}
behaviorCatalog: {
  uselessTo: BehaviorSeed[];  // 3-5 seeds
}
```

The `incident` anchors the AI to specificity (concrete detail with motive). The `pattern` is the behavioral principle the AI uses to synthesize new incidents it hasn't been explicitly given. Static lists either get repeated verbatim or require the author to pre-write every variation.

### 5. The Builder Starts With AI Draft Generation, Not a Blank Form

The entry point for creating a new story is a conversation with Grok, not a 7-page form with 50+ blank fields. A blank form is how you get generic stories.

Flow:
1. Author writes premise in natural language
2. One Grok call with No Vacancies `StoryDefinition` as reference template: "Given this reference, generate a first-draft `StoryDefinition` for this new premise. Write voice map entries in the same behavioral prose style. Suggest 5-8 mechanics appropriate for this premise."
3. Author edits the draft

The form UI is the *editor*, not the creation view.

### 6. Do Not Over-Abstract the State Machine

`StoryThreads` is used in `mergeThreadUpdates()`, `cloneGameState()`, `validateScene()`, and throughout `gameRuntime.ts`. Making it generic (`Record<string, unknown>`) in this pass is high-risk and low-value.

The abstraction lives at the **prompt-building layer**: the frozen Records become story-specific voice maps, and the prompt builder reads from `StoryDefinition` instead of hardcoded TypeScript. The game state machine stays concretely typed.

A future story can have its own concrete thread type. Don't design for that now.

### 7. AI Prose Evaluator for the Builder

Every voice map entry field in the builder runs an AI evaluation on blur. POST to `/api/builder/evaluate-prose`, which calls Grok with a rubric and returns:

```typescript
{ score: number; flags: string[]; suggestion: string }
```

Rubric (injected as system prompt to Grok):
1. Does this describe **behavior** or state a **trait**? (behavioral = pass)
2. Does it contain a **concrete detail** — a number, object, name, or specific action? (specific = pass)
3. Is it **under 50 words**? (concise = pass)
4. Does it **explain itself** — does it contain "this shows that", "the lesson is", "which means"? (no self-explanation = pass)

The rubric should be grounded in the story's own `voice.aestheticStatement` and `voice.voiceCeilingLines`, not a generic quality bar. The evaluator should catch "She realized how much she had been carrying" as a failure — which a regex-based linter cannot do.

---

## Questions to Answer Before Writing Your Plan

Do not skip these. Find the answers in code before designing anything.

**1. NarrativeContext consumer map**
`NarrativeContext` has `recentBeats: string[]`. If you change this to `recentOpenings: string[]`, trace every consumer. Start with `getContinuePromptFromContext()` in `narrative.ts`, then `buildNarrativeContext()` in `narrativeContext.ts`, then any test that asserts on `NarrativeContext` shape. Know the full blast radius.

**2. Tests that assert on exports**
Several Tier 1 tests in `tests/narrative/narrativeQuality.test.js` check that specific symbols are exported from `narrativeContext.ts` (the frozen Records, the translation functions). When you restructure these into a cartridge, those imports change. Understand what each test is actually guarding. The test's *intent* may survive even if the exact import path changes — but you have to know the intent to update it correctly.

**3. pendingTransitionBridge cascade**
`gameRuntime.ts` detects thread transitions via `detectThreadTransitions()` and stores the result in `gameState.pendingTransitionBridge`. Currently it stores `{ keys: string[], lines: string[] }` where `lines` are pre-computed prose strings. The new approach stores old+new prose values for dynamic injection. This changes the type, the storage, and the prompt formatter all at once. Map the full cascade: `gameRuntime.ts` → `narrativeContext.ts` → `narrative.ts` → `NarrativeContext` type → any test that checks `transitionBridge`. Then plan the change order.

**4. Import graph for the frozen Records**
Run a search for every file that imports directly from `narrativeContext.ts` (the frozen Record exports: `OSWALDO_CONFLICT_TRANSLATIONS`, `TRANSITION_BRIDGE_MAP`, etc.). Some of these are test files that will need updating. Know the full list before renaming anything.

**5. Route conventions**
Check `src/routes/api/` for the existing route pattern. The builder needs a new API endpoint (`/api/builder/evaluate-prose`, `/api/builder/generate-draft`). Follow the same file structure and handler pattern as the existing routes.

---

## Unsolicited Thoughts

**On execution order.** Do the engine refactoring before the builder UI. A working engine with no UI is more valuable than a beautiful builder backed by a broken engine. Suggested order: (1) types, (2) No Vacancies cartridge extraction, (3) engine refactoring (narrativeContext, narrative.ts), (4) tests passing, (5) prose evaluator endpoint, (6) builder UI.

**The voice maps are sacred.** The prose in the frozen Records is the best thing in this codebase. When you extract it into a cartridge, move it verbatim. Do not paraphrase. Do not improve. Do not refactor for style. Move the strings exactly as written, then confirm they're identical in the output. Any quality regression in the voice maps degrades the entire game.

**On the transition bridge change — it's the riskiest thing in the plan.** The static `TRANSITION_BRIDGE_MAP` can be removed cleanly, but the cascade is wide. `pendingTransitionBridge` in `GameState` currently stores pre-computed prose lines. After your change it needs to store the before/after prose values from the voice map so the prompt formatter can construct the bridge instruction. This touches `GameState` type, `gameRuntime.ts` (the detection + storage), `narrativeContext.ts` (the resolution), `NarrativeContext` type (the `transitionBridge` field shape), `narrative.ts` (the rendering), and tests. Plan it as a single coordinated change, not incremental edits.

**On the combo state lines — this is the least risky thing.** Combo states don't exist in the codebase yet (they're only in docs as examples). You're adding new functionality, not refactoring existing code. Do it last.

**On the `detectLessonInScene()` function in `lessonsCatalog.ts`.** This is another keyword heuristic. It's not in the primary plan, but notice it: it keyword-matches scene text to detect which lesson fired. The AI already labels `lessonId` in its output, so this function probably isn't load-bearing. Check where it's called before deciding whether to touch it or leave it alone.

**On Grok being cheap.** Don't be conservative about API calls in the builder. An extra prose evaluation call per text field blur is fine. The initial draft generation call is fine. The AI prose evaluator should give genuinely useful, specific feedback — not placeholder responses. It's worth the tokens.

**On what the prose evaluator must catch.** The failure mode the existing voice docs call "Hallmark card" prose: lines that gesture at feeling without earning it. Examples: "Sydney felt a wave of exhaustion." "She realized how much she had been carrying." These have no flagged words — a regex passes them. Grok catches them because it can evaluate whether the line describes *behavior* or *emotion*. The evaluator prompt must explicitly ask this question. Test it against these exact examples before shipping.

**On the builder being a SvelteKit page.** Check `/src/routes/` structure. The existing play route at `src/routes/play/+page.svelte` follows a pattern. The builder at `/builder` needs its own `+page.svelte` plus server endpoints. Follow the same layout conventions. The builder doesn't need to be polished — it needs to be functional.

**On the StoryDefinition type.** Put it in `src/lib/stories/types.ts`. The No Vacancies cartridge goes in `src/lib/stories/noVacancies/index.ts` (with sub-files for mechanics, characters, voice, lessons if you want to break them up). Other stories would live alongside it at `src/lib/stories/[storyId]/`. Keep the type definition separate from the data.

**On backward compatibility.** The `NarrativeContext` type is the main interface between `gameRuntime.ts` and `narrative.ts`. If you change its shape, you're changing a contract used by both files. Either update both atomically or use an intermediate step where the new fields are added alongside the old ones before removing the old ones.

**On what "done" looks like for phase 1.** The minimum meaningful state is: No Vacancies running identically to today, but with its story content loaded from a `StoryDefinition` object instead of hardcoded frozen Records. If a new story definition with 2 mechanics and 2 characters can be loaded and played without any No Vacancies text appearing, that's validation the abstraction works. Everything else — builder UI, prose evaluator, combo states — is additive.
