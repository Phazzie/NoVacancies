# Story Abstraction ExecPlan - 2026-03-19

This is the execution plan for turning No Vacancies from a single hardcoded story into a multi-story engine with No Vacancies as the first cartridge, plus minimal builder APIs/UI.

This plan is intentionally grounded in:

- `docs/CODEX_STORY_ABSTRACTION_GUIDANCE.md`
- the current codebase on `story-abstraction-exec`
- the current test suite and runtime contracts

## Goal

Finish all abstraction phases, not just phase 1:

1. introduce `StoryDefinition` + registry/cartridge infrastructure
2. extract No Vacancies story-specific authored content into a cartridge
3. refactor runtime/context/prompt/image systems to read from the active story
4. validate the engine with at least one additional non–No Vacancies story
5. add builder APIs for draft generation and prose evaluation
6. add a minimal builder UI that starts from AI-generated draft content, not a blank form
7. leave the branch passing tests and preserving No Vacancies behavior

## What Makes This a Good Exec Plan

This plan is:

- self-contained: it includes baseline, constraints, blast radius, and acceptance
- outcome-first: each phase ends with observable product behavior
- explicit about risk: the `pendingTransitionBridge` contract change is treated as a coordinated change
- revision-friendly: each phase includes critique/revise checkpoints
- verifiable: concrete validation commands and story-specific success criteria are listed

## Frozen Constraints

These are not up for redesign:

1. Voice maps are sacred.
   Move No Vacancies prose strings verbatim into its cartridge. Do not paraphrase.
2. Replace these heuristics exactly:
   - `recentBeats` keyword heuristic -> `recentOpenings` first-sentence memory
   - `suggestEndingFromHistory()` choice-id heuristic -> last 5 choice texts in prompt
   - `summarizeNarrativeArc()` / `arcPosition` -> remove
   - static `TRANSITION_BRIDGE_MAP` lookup -> dynamic before/after prose bridge
3. `ComboStateLine` is situational language (`when`, `line`), not code predicates.
4. Behavioral catalogs are seed incidents + patterns, not exhaustive lists.
5. Builder creation starts from AI draft generation, not an empty form.
6. Do not over-abstract into `Record<string, unknown>`.
7. The builder prose evaluator is AI-based and grounded in story voice, not regex.

## Baseline

- Working tree: `/mnt/c/Users/latro/Downloads/t/sydney-story-ui-redesign`
- Base branch: `ui-redesign-noir`
- Execution branch: `story-abstraction-exec`
- Guidance branch fetched: `origin/claude/story-abstraction-guidance-QxIrE`

## Questions Answered Before Planning

### 1. NarrativeContext consumer map

Current consumers of `NarrativeContext` and `recentBeats` / `transitionBridge` are:

- `src/lib/game/narrativeContext.ts`
- `src/lib/game/gameRuntime.ts`
- `src/lib/server/ai/narrative.ts`
- `src/lib/services/storyService.ts`
- `src/lib/server/ai/provider.interface.ts`
- `src/lib/server/ai/routeHelpers.ts`
- `src/routes/api/story/next/+server.ts`
- `tests/narrative/narrativeQuality.test.js`

This means `recentBeats -> recentOpenings` and `transitionBridge` shape changes must be made atomically across contracts, runtime, prompt formatting, and tests.

### 2. Tests that assert on exports

`tests/narrative/narrativeQuality.test.js` currently asserts:

- frozen translation map names exist in `narrativeContext.ts`
- `TRANSITION_BRIDGE_MAP` exists in `narrativeContext.ts`
- `buildNarrativeContext()` and `detectThreadTransitions()` are exported there
- `recentBeats` and `transitionBridge` appear in source

Conclusion:
- phase 1 cannot just move content and delete exports
- a compatibility layer is required while tests are rewritten to assert intent instead of exact legacy symbol names

### 3. pendingTransitionBridge cascade

Current contract:

- `GameState.pendingTransitionBridge: { keys: string[]; lines: string[] } | null`
- `NarrativeContext.transitionBridge: { keys: string[]; lines: string[] } | null`
- `detectThreadTransitions()` produces the same legacy shape
- `gameRuntime.ts` stores it
- `narrative.ts` renders it

New plan:

- change both `GameState.pendingTransitionBridge` and `NarrativeContext.transitionBridge` to store structured before/after prose lines
- update `detectThreadTransitions()`, runtime storage, prompt rendering, and tests together in one coordinated phase

### 4. Import graph for frozen records

Direct import/use sites today:

- `src/lib/game/narrativeContext.ts`
- `src/lib/server/ai/narrative.ts`
- `tests/narrative/narrativeQuality.test.js`

Conclusion:
- runtime imports can move to cartridge/registry
- tests must be rewritten to validate cartridge voice-map availability instead of hardcoded symbol presence

### 5. Route conventions

Existing API pattern:

- `src/routes/api/.../+server.ts`
- small route handlers
- route helper modules under `src/lib/server/ai/*`

Builder routes should follow the same pattern:

- `/api/builder/generate-draft/+server.ts`
- `/api/builder/evaluate-prose/+server.ts`

## Implementation Strategy

### Phase 1: Story Types, Registry, and Cartridges

Create:

- `src/lib/stories/types.ts`
- `src/lib/stories/index.ts`
- `src/lib/stories/no-vacancies/index.ts`
- `src/lib/stories/starter-kit/index.ts`

Introduce:

- `StoryDefinition`
- `ComboStateLine`
- `BehaviorSeed`
- `StoryCharacterDef`
- `StoryVoiceDef`
- `StoryBuilderDefinition`

No Vacancies cartridge must contain:

- verbatim voice maps moved from `narrativeContext.ts`
- lesson history lines
- boundary lines
- scene template/cost/mood/recovery/banned-phrasing authored content
- image mappings / pool
- system-prompt source data

Acceptance:

- active story registry resolves No Vacancies by default
- starter-kit definition exists and contains no No Vacancies prose

Critique checkpoint:

- did we move strings verbatim?
- did we accidentally design a meta-framework instead of a usable story definition?

### Phase 2: Runtime and Context Refactor

Refactor contracts/runtime to consume story definitions:

- `StoryThreads` becomes a typed story-thread-state map, not `unknown`
- `createGameState()` derives initial thread state from active story
- `mergeThreadUpdates()` and cloning become generic over allowed thread values
- `buildNarrativeContext()` reads mechanics from active story
- replace `recentBeats` with `recentOpenings`
- remove `arcPosition`
- replace static transition-bridge lines with structured before/after state shifts

Acceptance:

- No Vacancies still produces the same authored voice-map prose through the new path
- starter-kit can build context without No Vacancies text leaking

Critique checkpoint:

- did we abstract too much into shapeless records?
- is any continuity or transition information now weaker than before?

### Phase 3: Prompt and Provider Refactor

Refactor prompt generation to parameterize from `StoryDefinition`:

- system prompt built from story setting/voice/characters/mechanics/templates
- opening prompt built from story opening scaffold
- continue prompt consumes `recentOpenings`
- ending guidance uses last 5 choice texts, not choice-id heuristics
- image validation/path helpers resolve through active story

Add story-aware helpers for:

- valid image keys / fallback
- opening scene framing
- ending guidance instructions

Acceptance:

- Grok prompt generation no longer hardcodes No Vacancies constants in `narrative.ts`
- No Vacancies runtime output contract remains valid
- starter-kit can generate prompts without No Vacancies prose bleeding through

Critique checkpoint:

- did we merely move hardcoded prose into a different file, or actually parameterize the prompt builder?
- does the new prompt still preserve the writing north star?

### Phase 4: Tests and Multi-Story Validation

Update tests so they guard intent instead of legacy file-local symbol names.

Add/adjust coverage for:

- story registry + active story resolution
- No Vacancies cartridge presence
- starter-kit cartridge isolation
- dynamic transition bridge shape
- `recentOpenings` memory
- removal of `arcPosition`
- builder API contract shapes

Acceptance:

- tests validate the abstraction rather than legacy export names
- No Vacancies still passes narrative gates
- starter-kit can be loaded without No Vacancies strings appearing

Critique checkpoint:

- did we weaken tests to make refactor easy?
- are we still proving the original quality guarantees?

### Phase 5: Builder APIs

Add:

- `src/routes/api/builder/generate-draft/+server.ts`
- `src/routes/api/builder/evaluate-prose/+server.ts`
- supporting server modules under `src/lib/server/ai/`

`generate-draft`:

- input: premise text
- output: first-draft `StoryDefinition`
- uses No Vacancies definition as structural/voice reference

`evaluate-prose`:

- input: story voice context + prose candidate
- output: `{ score, flags, suggestion }`
- rubric must test:
  - behavior vs trait
  - concrete detail
  - under 50 words
  - no self-explanation / Hallmark-card prose

Acceptance:

- endpoints return stable JSON
- evaluation can reject generic summary prose that regex would miss

Critique checkpoint:

- is the evaluator giving actual editorial signal or generic filler?
- is the draft generator producing structured story definitions rather than shallow summaries?

### Phase 6: Builder UI

Add minimal SvelteKit builder route:

- `/builder/+page.svelte`

Requirements:

- starts from premise input
- generates draft via API
- renders editable story-definition fields
- runs prose evaluation on blur for voice-map and similar prose fields
- stores current draft client-side for continued editing

This does not need full polish. It needs to be functional and legible.

Acceptance:

- user can type premise -> get draft -> edit prose fields -> see evaluator feedback

Critique checkpoint:

- is the builder functional, or just a static JSON dump?
- does it start from draft generation instead of an empty-field wall?

### Phase 7: Docs, Validation, and Publish

Update:

- `README.md`
- `CHANGELOG.md`
- `AI_LESSONS_LEARNED.md` if new durable lessons emerge

Run:

- `npm run check`
- `npm run lint`
- `npm test`
- `npm run test:narrative`
- `npm run build`
- `npm run test:e2e`

## Validation Criteria

The plan is complete only if:

1. No Vacancies runs from a `StoryDefinition`
2. at least one second story definition can be selected without No Vacancies prose leaking in
3. prompt/context/image systems read from active story content
4. builder draft generation and prose evaluation exist
5. builder UI is functional
6. tests pass

## Rollback

If the abstraction destabilizes the app:

- revert back to `ui-redesign-noir`
- or revert phase commits in reverse order:
  - builder UI/API
  - test rewrites
  - prompt/runtime refactor
  - cartridge introduction

## Progress

- [x] Guidance doc ingested
- [x] Blast radius mapped
- [x] Phase 1 types/registry/cartridges
- [x] Phase 2 runtime/context refactor
- [x] Phase 3 prompt/provider refactor
- [x] Phase 4 tests + multi-story validation
- [x] Phase 5 builder APIs
- [x] Phase 6 builder UI
- [x] Phase 7 docs + validation

## Outcomes & Retrospective

### Shipped Outcome

- No Vacancies now runs from a `StoryDefinition` cartridge instead of shared-engine hardcoding.
- A second `starter-kit` story is registered and validated so the abstraction is not theoretical.
- Prompt building, context translation, transition bridging, lesson access, image lookup, and readiness metadata all read from the active story definition.
- Builder draft generation and prose evaluation APIs exist, and `/builder` is functional end-to-end.
- Validation suite passes on the execution branch, including builder e2e coverage.

### Review / Critique / Revise Notes

- Phase 1 critique result: the safest path was to move No Vacancies voice assets verbatim before touching engine seams. That preserved prose quality and kept the abstraction honest.
- Phase 2 critique result: the riskiest change was the `pendingTransitionBridge` contract. The revision was to store structured before/after moments instead of trying to incrementally preserve the old `lines` shape.
- Phase 3 critique result: merely wrapping the old prompts in a cartridge would have been fake abstraction. The revision was to move prompt assets into the No Vacancies story package and make `narrative.ts` a thin active-story facade.
- Phase 4 critique result: export-name snapshot tests were protecting file layout more than behavior. The revision was to rewrite tests around intent: story selection, story isolation, context shape, and builder behavior.
- Phase 5/6 critique result: a builder that only works with live Grok would strand authors. The revision was to keep AI-first generation/evaluation while preserving deterministic fallback draft/evaluation behavior.
- Phase 7 critique result: the branch needed canonical docs and the guidance doc in-repo so the abstraction is legible after merge, not just while the branch is open.

### Validation Evidence

- `npm run check`
- `npm run lint`
- `npm test`
- `npm run test:narrative`
- `npm run build`
- `npm run test:e2e`

### Remaining Follow-Up

- The builder is intentionally functional rather than polished; richer authoring workflows and story publishing are still future work.
- `StoryThreads` remains concretely typed to No Vacancies contracts by design; a future pass can decide whether multi-story thread typing should become more generic.
