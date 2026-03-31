# CLAUDE.md — No Vacancies

AI assistant reference for the No Vacancies repository. Read this before making any changes.

> **Note:** `claude.md` (lowercase) in the repo root is a legacy artifact from the pre-SvelteKit / Gemini era. Treat it as archived. This file (`CLAUDE.md`) is the authoritative reference.

---

## Project Overview

**No Vacancies** is a PWA interactive narrative game exploring invisible labor, codependency, and emotional load-bearing in relationships. The protagonist is Sydney, a 44-year-old functional meth addict who holds everything together for everyone around her—in a daily-rate motel room—while receiving no acknowledgment.

**Core thesis:** Invisible labor looks like nothing is wrong, so it gets no credit.

**Status:** Phase 1 ~60% complete. Version 1.0.0 deployed to Vercel.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | SvelteKit 2.x (TypeScript) |
| Build | Vite 7.x |
| UI | Svelte 5.x |
| AI Provider | X.ai Grok (hard-fail only; no mock fallback in production) |
| Deployment | Vercel (Node.js 22.x) |
| Testing | Playwright (E2E) + custom JS test scripts |
| Linting | ESLint 9.x (0 warnings allowed) |
| Formatting | Prettier 3.x |
| Type checking | `svelte-check` + TypeScript strict mode |

---

## Repository Layout

```
src/
  app.css                      # Global motel-noir styles
  app.html                     # PWA HTML shell
  hooks.server.ts              # Security headers + rate limiting (20 req/IP/min)
  lib/
    builder/store.ts           # Story builder client state
    client/pwa.ts              # Service worker registration
    contracts/game.ts          # Core types: Scene, Choice, StoryThreads, GameState, etc.
    debug/errorLog.ts          # Appends to localStorage; shown on /debug
    game/
      gameRuntime.ts           # Turn processing, state mutations, ending detection
      narrativeContext.ts      # Context building with hard 12,000-char budget
      store.ts                 # Svelte writable store over gameRuntime
      imagePaths.ts            # Deterministic image resolution by scene hash
    narrative/
      lessonsCatalog.ts        # 17 core narrative lessons
      promptFormatting.ts      # Prompt construction helpers
    server/ai/                 # Server-only AI integration (never imported by client)
      config.ts                # Env var parsing + type safety
      guardrails.ts            # Content safety gates
      sanity.ts                # Structural validators (word count, choice count, JSON shape)
      narrative.ts             # Prompt assets: system / opening / continue / recovery
      telemetry.ts             # Structural metrics only (no key/secret logging)
      providers/grok.ts        # Grok API adapter: chat, JSON extraction, retry
      builder.ts               # Story draft generation
      lessons.ts               # Lesson narrative generation
      routeHelpers.ts          # Shared API route helpers
    services/
      settingsStorage.ts       # localStorage-backed settings with fallback
      storyService.ts          # Client-side API story service
    stories/
      types.ts                 # StoryDefinition interface
      index.ts                 # Story registry; reads PUBLIC_STORY_ID; fails fast on unknown id
      no-vacancies/
        index.ts               # Main story cartridge
        context.ts             # Story-specific context translation functions
        prompts.ts             # No Vacancies system/opening/continue prompts
      starter-kit/index.ts     # Neutral template cartridge (validates the abstraction)
  routes/
    +layout.svelte             # Root shell with motel-noir nav
    +page.svelte               # Home: readiness dashboard + story entry
    api/
      story/opening/+server.ts # POST: generate opening scene
      story/next/+server.ts    # POST: generate next scene from choice + context
      image/+server.ts         # POST: image generation (ENABLE_GROK_IMAGES=1 only)
      builder/generate-draft/+server.ts
      builder/evaluate-prose/+server.ts
      ai/probe/+server.ts      # POST: provider health check
      demo/readiness/+server.ts # GET: weighted demo-readiness checklist
    play/+page.svelte          # Main gameplay: prose-first deck, keyboard shortcuts 1/2/3
    ending/+page.svelte        # Ending display
    builder/+page.svelte       # Story builder UI
    settings/+page.svelte      # Settings: lessons, unlocked endings
    debug/+page.svelte         # Error log + manual test entry
static/
  manifest.json                # PWA manifest
  service-worker.js            # Offline support
  images/                      # 22 pre-generated scene PNGs (default image pool)
tests/
  noLegacyProviderMarkers.js   # Guard: no Gemini/mock markers in src/
  storyEngineRuntimeSelection.js # Smoke: default/explicit/invalid cartridge selection
  narrative/narrativeQuality.test.js  # Tier 1 structural narrative gates
  e2e/                         # Playwright specs
docs/                          # 48+ docs; see README.md Docs Map
```

---

## Environment Variables

Copy `.env.example` → `.env.local` and fill in secrets.

### Required (Grok mode)

```
AI_PROVIDER=grok
AI_OUTAGE_MODE=hard_fail
ENABLE_GROK_TEXT=1
XAI_API_KEY=<your-xai-key>
```

### Optional / Tuning

```
ENABLE_GROK_IMAGES=0            # Default off; uses static image pool
ENABLE_PROVIDER_PROBE=0         # /api/ai/probe health endpoint
GROK_TEXT_MODEL=grok-4-1-fast-reasoning
GROK_IMAGE_MODEL=grok-imagine-image
AI_MAX_OUTPUT_TOKENS=1800
AI_REQUEST_TIMEOUT_MS=20000
AI_MAX_RETRIES=2
PUBLIC_STORY_ID=no-vacancies    # Unknown IDs fail fast at runtime
```

**Security rule:** `XAI_API_KEY` is server-only. Never send it to the browser or log it. `telemetry.ts` sanitizes payloads; follow that pattern.

---

## Development Workflow

```bash
npm install
npm run dev          # Vite dev server → http://127.0.0.1:5173
```

### Quality Gates (run before every commit)

```bash
npm run lint         # ESLint — 0 warnings allowed
npm run check        # TypeScript + Svelte type check
npm test             # Tier 1 guards: decommission markers + story selection smoke
npm run test:narrative  # Tier 1 narrative: structural/contract gates
npm run build        # Verify build succeeds
npm run test:e2e     # Playwright E2E suite
```

### Build & Preview

```bash
npm run build
npm run serve        # Preview on 0.0.0.0:8080
```

---

## Testing Architecture

### Three-Tier Model

| Tier | When | Blocking? | Purpose |
|------|------|-----------|---------|
| Tier 1 | Every PR + push | Yes | Contracts, schema, structural narrative gates, decommission guards |
| Tier 2 | `main` push / manual dispatch | No | Claude AI prose rubric scoring |
| Tier 3 | `main` push / manual dispatch | No | Live Grok canary (`LIVE_GROK=1` + `XAI_API_KEY`) |

**Tier 1 suite includes:**
- `npm run lint` — ESLint
- `npm run check` — TypeScript
- `tests/noLegacyProviderMarkers.js` — no Gemini/mock markers
- `tests/storyEngineRuntimeSelection.js` — default/explicit/invalid cartridge selection
- `tests/narrative/narrativeQuality.test.js` — source/contract structural checks
- Playwright unit tests + E2E demo reliability spec
- `npm run build` — full build gate

**Key test conventions:**
- E2E tests block service workers (`serviceWorkers: 'block'`) for isolation
- Playwright uses single worker (`workers: 1`), headless Chromium, environment-configurable host/port via `E2E_HOST` and `E2E_PORT` (defaults to `127.0.0.1:8080`)
- Grok live canary only runs when `LIVE_GROK=1` env var is set
- GitHub Actions cancels superseded runs (concurrency group per PR/branch)

---

## Code Conventions

### Naming

- Types / interfaces: `PascalCase` (`StoryDefinition`, `GameState`)
- Functions / variables: `camelCase` (`buildNarrativeContext`, `validateScene`)
- Constants: `UPPER_SNAKE_CASE` (`SYSTEM_PROMPT`, `XAI_CHAT_URL`)
- SvelteKit files: `+page.svelte`, `+server.ts`, `+layout.svelte`

### Imports

- Prefer `$lib` alias for imports that cross top-level feature areas under `src/lib` (e.g., `src/lib/game` → `$lib/services/...`)
- Relative imports are acceptable within a cohesive feature/package folder under `src/lib` (e.g., siblings in `src/lib/game/*`, `src/lib/services/*`)
- Never import `$lib/server/*` from client-side modules — SvelteKit enforces this boundary at build time

### Formatting

- 4-space indentation
- Single quotes
- Semicolons required
- 100-character print width
- No trailing commas

### TypeScript

- Strict mode enabled; no `@ts-nocheck` in active source paths
- Use `unknown` + type guards instead of `any`
- Validate at system boundaries (`validateScene()`, `validateChoice()`, `isValidChoiceId()`)
- Do not add internal validation for impossible states

### Comments

- Only explain *why*, never *what*
- Document non-obvious architectural decisions inline; everything else in `CHANGELOG.md` or `docs/`

### Svelte

- Reactive declarations: `$:` for derived values
- Stores: `writable<T>` from `svelte/store`
- Lifecycle: `onMount()`, `onDestroy()`
- Use `import { dev } from '$app/environment'` to guard client-side `console` calls in production

---

## Architecture Decisions

### Grok-Only / Hard Fail
Mock fallback is removed from the runtime. When Grok is unavailable, the app shows an explicit error with paths to `/settings` and `/debug`. No silent degradation. `AI_OUTAGE_MODE=hard_fail` is required in preview/production.

### Story Cartridge System
Story content is isolated from engine code via the `StoryDefinition` interface (`src/lib/stories/types.ts`). `PUBLIC_STORY_ID` selects the active cartridge. Unknown IDs throw at startup. Two cartridges exist: `no-vacancies` (main) and `starter-kit` (validation template). Adding a new story: implement `StoryDefinition`, register in `stories/index.ts`, validate with smoke tests.

### Stateless API
The server holds no game state. Each request includes the full `GameState` + `NarrativeContext` from the client. State is persisted in localStorage. This enables horizontal scaling with no session affinity.

### Narrative Context Budget
Target ~12,000-character context budget per generation call (not a strict hard cap). Deterministic truncation order: drop older summaries first → then older recent prose → then, if still over budget, trim recent scene prose (including the last 2 scenes) in small fixed-size steps down to a minimum length, and only as a last resort perform line clipping. Truncation metadata is emitted for observability. High-signal context (lesson history, thread/boundary lines, and the most recent scenes) is deprioritized for trimming and only reduced after lower-priority context has been exhausted; estimates may still slightly exceed the target if nothing else is safely trimmable.

### Structural Validators Only
`sanity.ts` enforces only deterministic constraints: word count, choice count, JSON schema, duplicate choices. No taste-based regex checks (no apology-loop counters, no therapy-speak detectors). Narrative taste enforcement lives in the system prompt and Tier 2 scoring.

### Image Strategy
Pre-generated pool of 22 PNGs in `/static/images/`. Deterministic rotation by scene hash. Live Grok image generation is opt-in (`ENABLE_GROK_IMAGES=1`). Default is off.

### Security
- Strict CSP (includes `'unsafe-inline'` for SvelteKit hydration bootstrap)
- Rate limiting: 20 AI requests / IP / 60 seconds in `hooks.server.ts`
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, HSTS, etc.
- No user authentication; API key is server-only

---

## Non-Negotiable Invariants

These must never be broken. Any change touching one requires a test update.

1. **Playability**: No abrupt forced endings from parse failures; recovery must be bounded (no infinite retry loops).
2. **API key safety**: `XAI_API_KEY` must never appear in logs, client bundles, or recaps.
3. **Accessibility**: zoom enabled, focus continuity maintained, scene text is readable.
4. **Image guardrail**: Never depict Oswaldo's face or bare skin.
5. **Sydney visual continuity**: 44, brunette, asymmetric bob, blue eyes; work setup uses 3-5 smartphones with pop sockets (no laptop in new work depictions).
6. **Hard-fail mode**: `AI_OUTAGE_MODE=hard_fail` required in preview/production; never silently fall back to mock.

---

## Canonical Documentation

| File | Purpose |
|------|---------|
| `README.md` | How to run, current operational status, docs map |
| `CHANGELOG.md` | Dated "what changed" + short rationale |
| `AI_LESSONS_LEARNED.md` | 54 durable engineering/narrative lessons |
| `AGENTS.md` | AI workflow rules, autonomy defaults, stop conditions |
| `docs/DECISIONS.md` | Major architecture/product tradeoffs (if present) |

**Update routing:**
- Behavior change → `CHANGELOG.md`
- New reusable rule/anti-pattern → `AI_LESSONS_LEARNED.md`
- Run/test/setup change → `README.md`
- Major tradeoff → `docs/DECISIONS.md`

---

## Common Pitfalls

- **Do not import `$lib/server/*` from client code.** SvelteKit will catch this at build but not always in dev.
- **Do not add taste heuristics to `sanity.ts`.** Keep guards structural only.
- **Do not add mock fallback paths.** The product decision is hard-fail.
- **Do not log prompts or API keys.** Emit only structural telemetry (sizes, counts, flags).
- **Do not create a `StoryDefinition` that defaults to No Vacancies copy in neutral surfaces.** Builder fallbacks must use `starter-kit` scaffolding.
- **Do not claim "done" without running the quality gates.** Report commands run and pass/fail, not assumptions.
- **Do not commit unrelated files.** Use `git status --short` before every commit and stage only explicit file lists.

---

## Priority Order

When tradeoffs arise:

1. Correctness and reliability
2. Security / privacy
3. Accessibility and UX continuity
4. Narrative quality
5. Performance
6. Cosmetic polish

Narrative rule: prefer AI-driven narrative judgment over brittle code-level taste heuristics. Keep code guards structural (schema, parse, limits).

---

## Handoff Format for Significant Changes

Always include:
- **Docs Updated** — which canonical docs changed
- **Risks Introduced** — what could go wrong
- **Assumptions Made** — what you treated as given
- **Rollback Note** — how to back out safely

---

*Last updated: 2026-03-31. Reflects SvelteKit 2.x / Grok-only architecture (post-migration from vanilla JS / Gemini).*