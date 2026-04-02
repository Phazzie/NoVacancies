# AGENTS.md — src/lib/stories/

Behavioral rules for story cartridge authoring. Extends root `AGENTS.md`.

Changes here affect both AI generation quality and user-facing narrative content. Voice regressions in this directory can be hard to detect without Tier 2 prose evaluation.

---

## Stop / Ask Before Proceeding

**STOP and ask the user before:**
- Rewriting or paraphrasing any string in `no-vacancies/context.ts` — translation strings are author-voiced narrative assets, not arbitrary text; if a string seems wrong, raise it rather than rewriting it
- Changing `StoryDefinition` interface shape in `types.ts` — this affects both cartridges; verify `no-vacancies` and `starter-kit` still type-check before marking done
- Adding a `detectInScene?` lesson detection function — review with narrative intent before implementation
- Adding a third story cartridge — requires a full `StoryDefinition` implementation, registry update, and smoke test coverage

---

## Confidence Requirements

- **After any cartridge change**, run `npm test` (story selection smoke tests) and report result explicitly
- **Changes to translation maps** in `context.ts` or `no-vacancies/index.ts` should be accompanied by a note in `AI_LESSONS_LEARNED.md` if a new voice behavior pattern is discovered
- **Changes to `StoryDefinition` interface** require a `npm run check` pass confirming both cartridges satisfy the contract

---

## Anti-Goals

- Do not seed `starter-kit` defaults with `no-vacancies` content — the kit must remain story-neutral
- Do not add hardcoded `no-vacancies` references to `index.ts`, `types.ts`, or any shared engine code
- Do not add fallback logic for unknown `PUBLIC_STORY_ID` — the throw is intentional; don't mask it
- Do not move engine seams before moving voice assets — extract voice content first, then refactor

---

## Cross-References

- `no-vacancies/prompts.ts` changes → update `tests/narrative/narrativeQuality.test.js` prompt-wiring assertions
- `no-vacancies/context.ts` translation changes → run `npm run test:narrative` to verify quality-floor strings
- `types.ts` interface changes → run `npm run check` and update both cartridges in the same PR
- New cartridge → update `README.md` story engine section + run full `npm test` suite
