# CLAUDE.md — No Vacancies

AI assistant reference for the No Vacancies repository. Read this before making any changes.

> Also read `AGENTS.md` — it defines the engineering workflow, confidence protocol, stop/ask conditions, and autonomy defaults that govern *how* to work here.

---

## Project Overview

**No Vacancies** is a PWA interactive narrative game exploring invisible labor, codependency, and emotional load-bearing in relationships. Sydney, the 44-year-old protagonist, holds everything together for everyone in a daily-rate motel room while receiving no acknowledgment.

**Core thesis:** Invisible labor looks like nothing is wrong, so it gets no credit.

**Status:** Phase 1 ~60% complete. Version 1.0.0 deployed to Vercel.

---

## Fast Orientation — Read These First

Before touching any file, orient by task type:

| Task | Start here | Then |
|------|-----------|------|
| Narrative / story content | `src/lib/stories/no-vacancies/prompts.ts`, `context.ts` | `src/lib/contracts/game.ts` (types) |
| AI generation / retry / sanity | `src/lib/server/ai/sanity.ts`, `providers/grok.ts` | `src/lib/server/ai/config.ts` |
| Context / prompt assembly | `src/lib/game/narrativeContext.ts` | `src/lib/contracts/game.ts` (NarrativeContext) |
| UI / gameplay flow | `src/routes/play/+page.svelte`, `src/lib/game/gameRuntime.ts` | `src/lib/game/store.ts` |
| Story cartridge | `src/lib/stories/types.ts`, `src/lib/stories/no-vacancies/index.ts` | `src/lib/stories/starter-kit/index.ts` |
| Config / env | `src/lib/server/ai/config.ts` | `src/hooks.server.ts` |
| Tests / CI | `tests/narrative/narrativeQuality.test.js`, `playwright.config.js` | `.github/workflows/narrative-quality.yml` |

---

## Core Type Reference

Key shapes from `src/lib/contracts/game.ts`:

**Scene** (required in every AI response):
```
sceneId: string          sceneText: string         choices: Choice[]
lessonId: number|null    imageKey: string           isEnding: boolean
endingType: string|null  mood?: Mood                storyThreadUpdates?: Partial<StoryThreads>|null
```

**StoryThreads** — 9 narrative state dimensions:

| Field | Type | Init | Meaning |
|-------|------|------|---------|
| `oswaldoConflict` | `number` | `0` | Resistance/hostility level; can go **negative** (performative helping mode) |
| `trinaTension` | `number` | `0` | Trina's entitlement / obliviousness accumulation |
| `moneyResolved` | `boolean` | `false` | Rent paid vs. still short |
| `carMentioned` | `boolean` | `false` | Car incident named aloud in scene |
| `sydneyRealization` | `number` | `0` | Sydney's clarity that "cannot" = "will not" (0–3) |
| `oswaldoAwareness` | `number` | `0` | Oswaldo's demonstrated acknowledgment of Sydney's load |
| `exhaustionLevel` | `number` | **`1`** | Sydney's depletion — **starts at 1, not 0**; level-0 translation is dead code |
| `dexTriangulation` | `number` | `0` | Dex sabotage sophistication (0–3) |
| `boundariesSet` | `string[]` | `[]` | Explicit named limits Sydney has drawn |

**NarrativeContext** field semantics (built client-side, sent with every request — server is stateless):

| Field | What it is | Budget behavior |
|-------|-----------|----------------|
| `recentSceneProse` | Last 2 full scenes verbatim + choice label | **Protected — trimmed last** |
| `olderSceneSummaries` | Up to 6 older scenes compressed to first sentence (≤160 chars) | **Dropped first** under pressure |
| `recentOpenings` | First sentences of last 3 scenes — beat-variety signal | Never trimmed |
| `recentChoiceTexts` | Last 5 player choice texts | Never trimmed |
| `threadNarrativeLines` | Human-readable StoryThreads translations | Never trimmed |
| `transitionBridge` | Up to 2 structured before/after thread-shift moments | Never trimmed |
| `meta` | `{ contextChars, budgetChars, truncated, droppedOlderSummaries, droppedRecentProse }` | Observability only |

Hard budget: **12,000 chars**. Truncation: oldest summaries first → recent prose clipped in 240-char steps (floor 120 chars).

**Ending types** (canonical): `loop` | `shift` | `exit` | `rare`. Polarity rule: **bad-to-uneasy only — no clean wins**.

---

## Scene Generation Constraints

Exact values from `src/lib/server/ai/sanity.ts` — generation fails silently on these:

| Constraint | Soft (retryable) | Hard (blocking) |
|------------|-----------------|----------------|
| Scene word count | > 280 words | > 350 words |
| Ending word count | > 370 words | > 450 words |
| Scene text length | — | < 80 chars |
| Choices (non-ending) | — | < 2 or > 3 |
| Duplicate choice text | — | any match (normalized) |

Retry backoff: `[400ms, 1200ms]`. Blocking → immediate rejection. Retryable → one retry then fail.

---

## Silent Failure Modes

Things that fail without obvious errors — know these before starting:

1. **`$lib/server/*` import from client** — passes `npm run dev`, fails only at `npm run build`. Never caught by lint or `npm run check` alone. Always run `npm run build` before claiming done on any `src/` change.

2. **`loadAiConfig()` throws, not returns null** — misconfiguration surfaces as unhandled 500. Throws on:
   - `AI_PROVIDER=mock`
   - `AI_OUTAGE_MODE=mock_fallback`
   - `AI_AUTH_BYPASS=true` (any truthy value)
   - `XAI_API_KEY` missing when Grok is enabled
   - `AI_OUTAGE_MODE` missing in prod-like env (`VERCEL_ENV=production|preview` or `NODE_ENV=production`)

3. **Rate limiter is per-Vercel-instance** — `hooks.server.ts` uses an in-memory `Map`. Each cold-start resets it. The 20 req/IP/min limit is not globally enforced across serverless instances. Do not treat it as a hard abuse-prevention guarantee at scale.

4. **`exhaustionLevel` starts at `1`** — `createStoryThreads()` initializes it to `1`. The `'0'` key in `EXHAUSTION_TRANSLATIONS` exists but is unreachable at game start. Tests checking "initial exhaustion state" must assert `1`, not `0`.

5. **`npm run lint` covers only `tests/`** — ESLint scope is test files only. `src/` type and style quality is enforced by `npm run check`. Running lint without check is not a complete quality pass for source code changes.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | SvelteKit 2.x (TypeScript) |
| Build | Vite 7.x |
| UI | Svelte 5.x |
| AI Provider | X.ai Grok (hard-fail only; no mock fallback) |
| Deployment | Vercel (Node.js 22.x) |
| Testing | Playwright (E2E) + custom JS test scripts |
| Linting | ESLint 9.x — test files only (0 warnings) |
| Formatting | Prettier 3.x |
| Type checking | `svelte-check` + TypeScript strict mode |

---

## Repository Layout

```
src/
  hooks.server.ts              # Security headers + rate limiting (per-instance, see Silent Failures)
  lib/
    contracts/game.ts          # Core types — Scene, Choice, StoryThreads, GameState, NarrativeContext
    game/
      gameRuntime.ts           # Turn processing, state mutations, ending detection
      narrativeContext.ts      # Context building — 12,000-char budget, deterministic truncation
      store.ts                 # Svelte writable store over gameRuntime
      imagePaths.ts            # Deterministic image resolution by scene hash
    narrative/
      lessonsCatalog.ts        # 17 core narrative lessons
    server/ai/                 # ← SERVER-ONLY — never import from client (silent in dev, fails at build)
      config.ts                # Env var parsing — THROWS on misconfiguration (see Silent Failures)
      sanity.ts                # Structural validators — word count, choice count, JSON shape only
      narrative.ts             # Prompt assets: system / opening / continue / recovery
      providers/grok.ts        # Grok API adapter: chat, JSON extraction, retry
      guardrails.ts            # Content safety gates
      telemetry.ts             # Structural metrics only — no key/prompt logging
    services/
      storyService.ts          # Client-side API story service
    stories/
      types.ts                 # StoryDefinition interface
      index.ts                 # Story registry — reads PUBLIC_STORY_ID; throws on unknown id
      no-vacancies/            # Main story cartridge (prompts, context translations, voice)
      starter-kit/             # Neutral template cartridge (builder fallback + abstraction validation)
  routes/
    +layout.svelte             # Root shell with motel-noir nav
    +page.svelte               # Home: readiness dashboard
    api/story/opening/         # POST: generate opening scene
    api/story/next/            # POST: generate next scene from choice + context
    api/image/                 # POST: image generation (ENABLE_GROK_IMAGES=1 only)
    api/builder/**             # Draft generation + prose evaluation
    api/demo/readiness/        # GET: weighted demo-readiness checklist
    play/+page.svelte          # Gameplay: prose-first deck, keyboard shortcuts 1/2/3
    ending/+page.svelte        # Ending display
    builder/+page.svelte       # Story builder UI
    settings/+page.svelte      # Settings: lessons, unlocked endings
    debug/+page.svelte         # Error log (localStorage) + manual test entry
static/
  images/                      # 22 pre-generated scene PNGs (default image pool)
tests/
  noLegacyProviderMarkers.js   # Guard: no Gemini/mock markers in src/
  storyEngineRuntimeSelection.js # Smoke: default/explicit/invalid cartridge selection
  narrative/narrativeQuality.test.js  # Tier 1 structural narrative gates
  e2e/                         # Playwright specs
```

---

## Environment Variables

Copy `.env.example` → `.env.local`.

**Required:**
```
AI_PROVIDER=grok
AI_OUTAGE_MODE=hard_fail        # Missing in prod → THROWS (see Silent Failures)
ENABLE_GROK_TEXT=1
XAI_API_KEY=<your-xai-key>      # Server-only; missing when Grok enabled → THROWS
```

**Optional:**
```
ENABLE_GROK_IMAGES=0            # Default off; uses 22-image static pool
ENABLE_PROVIDER_PROBE=0
GROK_TEXT_MODEL=grok-4-1-fast-reasoning
AI_MAX_OUTPUT_TOKENS=1800       # Range: 200–3200
AI_REQUEST_TIMEOUT_MS=20000     # Range: 5000–60000
AI_MAX_RETRIES=2                # Range: 0–5
PUBLIC_STORY_ID=no-vacancies    # Unknown IDs THROW at startup
```

---

## Development Workflow

```bash
npm install
npm run dev          # → http://127.0.0.1:5173
```

**Quality gates — all must pass before every commit:**
```bash
npm run lint         # ESLint — tests/ only, 0 warnings
npm run check        # TypeScript + Svelte — covers src/
npm test             # Tier 1: decommission markers + story selection smoke
npm run test:narrative  # Tier 1 narrative: structural/contract gates
npm run build        # Build verification — catches $lib/server boundary violations
npm run test:e2e     # Playwright E2E
```

---

## Testing Architecture

| Tier | Runs on | Blocking? | Purpose |
|------|---------|-----------|---------|
| 1 | Every PR + push | Yes | Contracts, schema, structural narrative, decommission guards, build |
| 2 | `main` push / manual | No | Claude AI prose rubric scoring |
| 3 | `main` push / manual | No | Live Grok canary (`LIVE_GROK=1`) |

**Conventions:**
- E2E blocks service workers (`serviceWorkers: 'block'`) for isolation
- Playwright: single worker, headless Chromium, baseURL `http://localhost:8080`
- Grok canary: only when `LIVE_GROK=1` + `XAI_API_KEY` — never blocks PRs
- GitHub Actions cancels superseded runs (concurrency group per PR/branch)

---

## Code Conventions

**Naming:** `PascalCase` types · `camelCase` functions/vars · `UPPER_SNAKE_CASE` constants · `+page.svelte` / `+server.ts` SvelteKit files

**Imports:** Always `$lib` alias; never relative into `src/lib`; never `$lib/server/*` from client code

**Formatting:** 4-space indent · single quotes · semicolons · 100-char print width · no trailing commas

**TypeScript:** Strict mode; no `@ts-nocheck`; use `unknown` + type guards not `any`; validate only at system boundaries (`validateScene()`, `validateChoice()`, `isValidChoiceId()`)

**Svelte:** `$:` for reactive declarations; `writable<T>` stores; guard `console.*` with `import { dev } from '$app/environment'`

**Comments:** Only explain *why*, never *what*

---

## Architecture Decisions

- **Hard-fail only:** No mock fallback in the runtime. `AI_OUTAGE_MODE=hard_fail` required in prod. Explicit error shown with paths to `/settings` and `/debug`.
- **Story cartridge system:** Story content isolated via `StoryDefinition` (`src/lib/stories/types.ts`). `PUBLIC_STORY_ID` selects the cartridge. Unknown IDs throw at startup. Two cartridges: `no-vacancies` (main) + `starter-kit` (builder fallback and validation template).
- **Stateless API:** Server holds no game state. Full `GameState` + `NarrativeContext` sent with every request. Client persists state to localStorage. Any mutation returned from the server must be round-tripped back to the client — lost state is silent.
- **Context budget:** Hard 12,000-char cap. Truncation: oldest summaries first → older recent prose → (rarely) line clipping. Never trim last 2 scenes, lesson history, or thread/boundary lines.
- **Structural validators only:** `sanity.ts` enforces word count, choice count, JSON shape, duplicate choices — nothing taste-based. Narrative taste lives in the system prompt and Tier 2 scoring.
- **Image strategy:** 22 pre-generated PNGs in `/static/images/`. Deterministic rotation by scene hash. Live generation opt-in (`ENABLE_GROK_IMAGES=1`).
- **Security:** Strict CSP (includes `'unsafe-inline'` for SvelteKit hydration); rate limiting 20 AI req/IP/min (per-instance — see Silent Failures); API key server-only.

---

## Non-Negotiable Invariants

Any change touching these requires a test update.

1. **Playability:** No abrupt forced endings from parse failures; recovery must be bounded (no infinite retry loops).
2. **API key safety:** `XAI_API_KEY` must never appear in logs, client bundles, or recaps.
3. **Accessibility:** Zoom enabled, focus continuity maintained, scene text readable.
4. **Image guardrail:** Never depict Oswaldo's face or bare skin.
5. **Sydney visual continuity:** 44, brunette, asymmetric bob, blue eyes; 3–5 smartphones with pop sockets (no laptop in new work depictions).
6. **Hard-fail mode:** `AI_OUTAGE_MODE=hard_fail` in prod/preview; never add mock fallback paths.

---

## Execution Protocol

**Confidence:** Do not claim "done" or "fixed" without fresh command evidence. If environment-blocked, say so explicitly and provide the exact command for user-side verification.

**Invariant-to-Test:** Any change touching a non-negotiable invariant must include or update at least one test proving it.

**Stop/Ask conditions — pause and check with user if:**
- Requirements conflict with existing invariants
- Change requires destructive operations or sweeping refactors
- Schema contract change breaks backward compatibility
- Unexpected external edits detected during active work

**Minimal-change rule:** Don't refactor code you didn't need to touch. A bug fix is not an invitation to clean up surrounding code.

**Haters critique:** Before claiming done, ask: *"What would a group of haters say about the work I just did?"* Answer it honestly. Fix real problems before handoff.

---

## Canonical Documentation

| File | Purpose |
|------|---------|
| `README.md` | How to run, operational status, docs map |
| `CHANGELOG.md` | Dated "what changed" + rationale |
| `AI_LESSONS_LEARNED.md` | 54 durable engineering/narrative lessons |
| `AGENTS.md` | Engineering workflow, confidence protocol, stop conditions |
| `docs/DECISIONS.md` | Major architecture/product tradeoffs (if present) |

**Update routing:** behavior change → `CHANGELOG.md` · new rule/anti-pattern → `AI_LESSONS_LEARNED.md` · run/test/setup change → `README.md` · major tradeoff → `docs/DECISIONS.md`

---

## Common Pitfalls

- **Do not add taste heuristics to `sanity.ts`.** Structural guards only.
- **Do not add mock fallback paths.** The product decision is hard-fail.
- **Do not log prompts or API keys.** Structural telemetry only (sizes, counts, flags).
- **Do not default to No Vacancies copy in builder surfaces.** Use `starter-kit` for neutral scaffolding.
- **Do not claim "done" without running quality gates.** Report commands run and pass/fail.
- **Do not commit unrelated files.** `git status --short` before every commit; stage explicit file lists.

---

## Priority Order

1. Correctness and reliability
2. Security / privacy
3. Accessibility and UX continuity
4. Narrative quality
5. Performance
6. Cosmetic polish

Narrative rule: prefer AI-driven narrative judgment over brittle code-level taste heuristics.

---

## Handoff Format

For significant changes, always include:
- **Docs Updated** — which canonical docs changed
- **Risks Introduced** — what could go wrong
- **Assumptions Made** — what you treated as given
- **Rollback Note** — how to back out safely

---

*Last updated: 2026-04-02. Reflects SvelteKit 2.x / Grok-only architecture.*
