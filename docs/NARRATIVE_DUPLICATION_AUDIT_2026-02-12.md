# Narrative Duplication Audit (2026-02-12)

## Purpose
This document does two jobs:
1. Capture the current duplication/drift audit so it is no longer trapped in chat.
2. Give a reusable template (with examples) that pushes deeper prose/process analysis from Claude.

## Executive Summary
- Core narrative-context logic is duplicated across two modules and has already drifted in copy and behavior.
- Current runtime source of truth is `src/lib/game/narrativeContext.ts`.
- Current provider prompt source of truth is `src/lib/server/ai/narrative.ts`.
- This split is the main drift risk for narrative coherence and tone continuity.

## Duplication Findings

### A. Duplicate core exports exist in both modules
The following are implemented in both places:
- `src/lib/game/narrativeContext.ts`
- `src/lib/server/ai/narrative.ts`

Shared exported symbols:
1. `NARRATIVE_CONTEXT_CHAR_BUDGET`
2. `TRANSITION_BRIDGE_MAP`
3. `translateBoundaries`
4. `translateLessonHistory`
5. `translateThreadStateNarrative`
6. `detectThreadTransitions`
7. `buildNarrativeContext`
8. `BOUNDARY_TRANSLATIONS`
9. `LESSON_HISTORY_TRANSLATIONS`

### B. Drift is already visible
1. Translation tone/copy drift:
   - `TRINA_TENSION_TRANSLATIONS` differs:
     - `src/lib/game/narrativeContext.ts:28`
     - `src/lib/server/ai/narrative.ts:34`
2. Money line drift:
   - `MONEY_TRANSLATIONS` differs:
     - `src/lib/game/narrativeContext.ts:35`
     - `src/lib/server/ai/narrative.ts:41`
3. Budget behavior drift:
   - Game module trims recent prose to enforce hard cap:
     - `src/lib/game/narrativeContext.ts:17`
     - `src/lib/game/narrativeContext.ts:206`
     - `src/lib/game/narrativeContext.ts:213`
   - Server narrative module only drops older summaries:
     - `src/lib/server/ai/narrative.ts:237`

### C. Current usage split (why this matters)
1. Runtime builds context from game module:
   - `src/lib/game/gameRuntime.ts:15`
   - `src/lib/game/gameRuntime.ts:260`
2. Provider builds user prompt from server narrative module:
   - `src/lib/server/ai/providers/grok.ts:8`
   - `src/lib/server/ai/providers/grok.ts:198`
   - `src/lib/server/ai/providers/grok.ts:230`

Net effect: context generation and context formatting rules can evolve independently and silently diverge.

## Full AI Writing/Prompt Surface Map

These are the places where prose quality, narrative continuity, or model instruction quality can be improved.

### 1) Direct text sent to model (highest leverage)
1. `src/lib/server/ai/narrative.ts:503` (`SYSTEM_PROMPT`)
   - Global writing voice, constraints, continuity doctrine, output schema instructions.
2. `src/lib/server/ai/narrative.ts:720` (`getContinuePrompt`)
   - Legacy/alternate continue prompt path; still a prompt asset even if not current hot path.
3. `src/lib/server/ai/narrative.ts:790` (`getContinuePromptFromContext`)
   - Turn-level scene writing instruction + costed-choice requirements.
4. `src/lib/server/ai/narrative.ts:838` (`getOpeningPrompt`)
   - First-scene framing quality.
5. `src/lib/server/ai/narrative.ts:860` (`getRecoveryPrompt`)
   - Parse-recovery quality and style-preservation behavior.
6. `src/lib/server/ai/providers/grok.ts:230`
   - Actual `messages` payload (`system` + `user`) sent to xAI chat API.
7. `src/lib/server/ai/providers/grok.ts:494`
   - Probe prompt text (can mask real parse/capability issues if too simple).

### 2) Indirect context prose injected into prompts (high leverage)
1. `src/lib/server/ai/narrative.ts:452` (`formatNarrativeContextSection`)
   - Shapes how memory/context is presented to the model.
2. `src/lib/server/ai/narrative.ts:279` (`formatThreadState`)
   - Used by legacy continue path; still a source of phrasing drift.
3. `src/lib/server/ai/narrative.ts:329` (`buildLongArcSummary`)
   - Legacy summary style can re-enter output if old path is reactivated.
4. `src/lib/game/narrativeContext.ts:161` (`translateThreadStateNarrative`)
   - Translates raw state into natural-language guidance.
5. `src/lib/game/narrativeContext.ts:131` (`translateBoundaries`)
6. `src/lib/game/narrativeContext.ts:145` (`translateLessonHistory`)
7. `src/lib/game/narrativeContext.ts:306` (`buildNarrativeContext`)
   - Selection/compression rules for recent/older scenes.

### 3) Narrative lesson corpus feeding prompts (high leverage)
1. `src/lib/narrative/lessonsCatalog.ts:18` (`lessons`)
2. `src/lib/server/ai/narrative.ts:127` (`formatLessonsForPrompt`)
   - Determines how lesson content is serialized into prompt text.

### 4) Structural gates that affect prose outcomes (medium leverage)
1. `src/lib/server/ai/sanity.ts:15`
   - Blocks/retries can suppress otherwise strong prose if heuristics are brittle.
2. `src/lib/server/ai/providers/grok.ts:342`
   - Sanity check retry loop; determines whether model output is accepted.

### 5) Image prompt path (style continuity and guardrail quality)
1. `src/lib/server/ai/routeHelpers.ts:41`
   - Guardrails for image prompt safety.
2. `src/lib/server/ai/providers/grok.ts:388`
   - Image prompt submission to xAI image endpoint.

### 6) Entry points that carry prompt/context payloads (for process quality)
1. `src/routes/api/story/opening/+server.ts:10`
2. `src/routes/api/story/next/+server.ts:13`
3. `src/lib/server/ai/routeHelpers.ts:31`
4. `src/lib/services/storyService.ts:117`
5. `src/lib/game/gameRuntime.ts:260`

These are not prose-authoring files, but they determine whether the right context/prompt payload reaches the model path consistently.

## Where To Improve First (recommended order)
1. Eliminate context duplication first, then tune prose.
2. Tighten context formatting and long-arc recall before adding new style rules.
3. Audit sanity checks for taste-based blockers; keep only structural reliability gates.
4. Expand deterministic scenario pack before prompt rewrites.

## Claude Deep-Analysis Template (Q/A + Examples)

Use this directly in Claude. It is intentionally strict and evidence-driven.

---

### Section 1: Five High-Leverage Questions

For each question, Claude must answer in this format:
- `Answer`
- `Evidence` (file paths + lines)
- `Risk if wrong`
- `Minimal reversible patch`
- `Validation`

Questions:
1. Where does canonical voice degrade first: prompt body, context rendering, or sanity gating?
2. Which single duplicated function creates the highest continuity risk if it drifts one more time?
3. Which sanity checks are structural vs taste-based, and which taste checks should be downgraded from blocking to retryable?
4. Does context compression preserve causality at scene 8+ under long playthroughs?
5. Where can parse recovery preserve style better without weakening JSON strictness?

Example Q/A (filled):

```md
Q: Which single duplicated function creates the highest continuity risk if it drifts one more time?

A:
- `buildNarrativeContext` is the highest-risk duplicate because it defines what memory survives and how thread state is narrated.

Evidence:
1. src/lib/game/narrativeContext.ts:306
2. src/lib/server/ai/narrative.ts:406
3. src/lib/game/gameRuntime.ts:260 (runtime source path)
4. src/lib/server/ai/providers/grok.ts:198 (prompt usage path)

Risk if wrong:
- Long-arc causality breaks silently because scenes are generated from mismatched context assumptions.

Minimal reversible patch:
1. Keep implementation only in src/lib/game/narrativeContext.ts
2. Re-export from src/lib/server/ai/narrative.ts

Validation:
1. Snapshot serialized context before/after for identical game state.
2. Ensure no textual diff except intentional cleanup.
```

---

### Section 2: Prose Improvement Card (repeat per issue)

```md
## Prose Improvement Card #[N]

Issue:
- [one sentence]

Current Text (exact):
- File: [path:line]
- Snippet: "[paste exact line]"

Why It Weakens Prose:
- [specific failure mode: flattening, repetition, causality loss, tonal mismatch]

Revision Goal:
- [e.g., increase sensory specificity without expanding token load]

Proposed Rewrite:
- "[replacement text]"

Why This Is Better:
- [2-4 bullets, concrete]

Risk Introduced:
- [one realistic downside]

How To Test:
1. [scenario]
2. [expected signal in output]
3. [pass/fail rule]
```

---

### Section 3: Process Improvement Card (repeat per pipeline issue)

```md
## Process Improvement Card #[N]

Problem:
- [pipeline weakness]

Current Mechanism:
- File: [path:line]
- Behavior: [one line]

Failure Mode:
- [what breaks in demo or long-run quality]

Smallest Reversible Fix:
1. [change]
2. [change]

Guardrail Type:
- structural | taste

Proof Plan:
1. test to add/update: [file]
2. fixture/scenario: [id]
3. acceptance criteria: [binary]

Rollback:
- [single commit/file rollback note]
```

## Example Filled Cards

### Example Prose Card
```md
## Prose Improvement Card #1

Issue:
- Transition bridge can read as mechanical exposition instead of lived scene detail.

Current Text (exact):
- File: src/lib/server/ai/narrative.ts:486
- Snippet: "Use one bridge line naturally if it fits this scene."

Why It Weakens Prose:
- It allows blunt insertion of bridge language without sensory grounding.

Revision Goal:
- Force bridge integration through concrete action/observation.

Proposed Rewrite:
- "If a bridge line is used, anchor it to a concrete in-scene action, object, or dialogue beat."

Why This Is Better:
- Reduces summary voice.
- Preserves continuity without sounding like patch notes.
- Improves scene-level embodiment.

Risk Introduced:
- Model may over-constrain and skip useful bridge cues.

How To Test:
1. Run a scene where two thread dimensions shift.
2. Confirm bridge appears via action/dialogue, not abstract summary.
3. Fail if sentence reads like state-reporting metadata.
```

### Example Process Card
```md
## Process Improvement Card #1

Problem:
- Context logic duplication can create silent drift.

Current Mechanism:
- File: src/lib/game/narrativeContext.ts:306 and src/lib/server/ai/narrative.ts:406
- Behavior: both build narrative context independently.

Failure Mode:
- Same game state yields different narrative framing depending on code path.

Smallest Reversible Fix:
1. Keep canonical context logic in src/lib/game/narrativeContext.ts
2. Import/re-export those symbols from src/lib/server/ai/narrative.ts

Guardrail Type:
- structural

Proof Plan:
1. test to add/update: tests/narrative/narrativeQuality.test.js
2. fixture/scenario: import guard + duplicate-implementation regression check
3. acceptance criteria: no duplicated implementation blocks remain in narrative.ts

Rollback:
- Revert single commit touching narrative.ts imports/exports.
```

## Suggested Next Actions
1. Execute the merge-to-single-source patch before prose tuning.
2. Convert this document's cards into tracked issues (one card = one PR).
3. Add one deterministic 12-scene scenario fixture focused on long-arc causality under compression.
