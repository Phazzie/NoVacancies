# CLAUDE.md — src/lib/stories/

Directory-specific reference for the story cartridge system. Extends root `CLAUDE.md` and `AGENTS.md`.

---

## What This Directory Does

| Path | Role |
|------|------|
| `types.ts` | `StoryDefinition` interface — the full contract every cartridge must satisfy |
| `index.ts` | Story registry — reads `PUBLIC_STORY_ID`, **throws on unknown ID** (intentional, no fallback) |
| `no-vacancies/` | Main story cartridge (prompts, context translations, voice assets) |
| `starter-kit/` | Neutral template cartridge — builder fallback + abstraction validation |

---

## Adding a New Story Cartridge (4 steps)

1. Create `src/lib/stories/<story-id>/index.ts` implementing `StoryDefinition`
2. Register it in `src/lib/stories/index.ts`
3. Provide all required fields: `prompts`, `context`, `lessons`, `characters`, `voice`, `builder`, `presentation`, `ui`
4. Validate with `npm test` — the story selection smoke tests cover default/explicit/invalid-ID paths

---

## `StoryDefinition` Required vs. Optional Fields

**Required** (missing → type error):
- `prompts.systemPrompt`, `.getOpeningPrompt()`, `.getContinuePromptFromContext()`, `.getRecoveryPrompt()`
- `context.translateThreadStateNarrative()`, `.translateBoundaries()`, `.translateLessonHistory()`, `.detectThreadTransitions()`
- `lessons.all`, `.getById()`
- `builder.referencePromptGuide`, `.proseRubric`, `.createEmptyDraft()`
- All `presentation.*` fields
- `ui.imagePaths`, `ui.pregeneratedImagePool`

**Optional** (missing → feature disabled, no error):
- `lessons.detectInScene?` — if absent, AI-authored scene lesson detection is skipped silently
- `ui.theme` — falls back to default motel-noir theme

---

## Neutrality Rule

**Builder defaults must use `starter-kit`, never `no-vacancies` copy.**

When AI generation is unavailable, `builder.ts` falls back to `createEmptyDraft()` from the active story's builder definition — but the initial scaffold and all deterministic fallback content must be story-neutral. The flagship `no-vacancies` story is a quality reference for AI guidance only.

---

## Fail-Fast Rule

`index.ts` throws on unknown `PUBLIC_STORY_ID`. This is intentional — do not add a fallback to `no-vacancies`. Misconfigured story selection must fail loudly so operators know immediately.

---

## Voice-First Migration Rule

When moving content into a new cartridge or refactoring the engine seam:
1. **First** extract authored voice maps, translation strings, and prompt assets into the cartridge
2. **Then** refactor engine code to read from the cartridge

Moving engine seams before moving voice assets means quality regressions hide inside "temporary" placeholder strings. The authored content is the quality reference — it must move intact.

---

## Context Translation Strings

`no-vacancies/context.ts` contains the thread-state and boundary translation maps. These strings are **author-voiced assets** — each line was written intentionally for its emotional register and behavioral specificity. Do not paraphrase. If a string seems wrong, stop and raise it rather than rewriting it.

---

## Shell Branding

Visible shell copy (`+layout.svelte`, `+page.svelte`) routes through `story.presentation.*` metadata. When `PUBLIC_STORY_ID` changes, visible branding changes automatically. Do not hardcode `no-vacancies` copy in shared shell surfaces.

---

## Stop Conditions → see `src/lib/stories/AGENTS.md`
