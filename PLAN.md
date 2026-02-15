# Story Engine 10/10 Completion Plan (Configurable Authoring + Modern UI + Dynamic Images)

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This repository does not currently contain a separate `.agent/PLANS.md`; this document embeds the required execution-plan structure and must be maintained as the single source of truth for implementation sequencing.

## Purpose / Big Picture

After this plan is fully implemented, a creator will be able to launch a polished “create-your-own-adventure” product where they can start from templates, configure story identity and behavior without editing engine internals, generate and approve images dynamically through Grok image generation, and publish a playable narrative experience with a modern, clean, slightly eclectic visual style. The observable proof will be: a creator can create a new cartridge from template, set it active, run the app, see the new branding/theme and content, play end-to-end scenes with AI text and generated images, and pass automated validation gates.

## Progress

- [x] (2026-02-12 23:40Z) Reviewed repository state and latest squash commit to identify current abstraction coverage and remaining gaps.
- [x] (2026-02-12 23:50Z) Defined 10/10 target state criteria covering product UX, creator workflow, configuration surface, testing, and operations.
- [ ] Draft and align full configuration inventory mapped to current files, schemas, and runtime seams.
- [ ] Implement creator template system (starter templates + generator command + validation) and document exact usage.
- [ ] Implement full cartridge configurability layer (narrative, rules, progression, UI theme, media strategy, telemetry labels).
- [ ] Implement image-generation pipeline completion (prompt policy, generation queue/state, caching, retry/recovery, review controls).
- [ ] Implement modern UI refresh with “eclectic-clean” design system and creator mode surfaces.
- [ ] Implement operational controls and observability (active cartridge/version, generation health, failure diagnostics).
- [ ] Add/expand tests for invariants, cartridge selection, template correctness, image reliability, and end-to-end creator flow.
- [ ] Complete documentation, retrospective, and release/rollback playbook.

## Surprises & Discoveries

- Observation: Current architecture already introduced a functional cartridge seam and a second proof cartridge, so the major remaining work is depth/completeness of configurability and UX, not foundational decoupling.
  Evidence: `src/lib/stories/types.ts`, `src/lib/stories/index.ts`, and `src/lib/stories/starter-kit/index.ts` exist and are wired.

- Observation: Runtime selection is intentionally fail-fast on unknown story IDs, which is correct for safety but requires stronger creator/operator guidance to avoid local misconfiguration friction.
  Evidence: `src/lib/stories/index.ts` throws on unknown cartridge ids.

- Observation: Dynamic image route and provider hooks exist, but there is no end-user creator workflow for prompt strategy selection, review, regeneration, or asset approval lifecycle.
  Evidence: Image generation route exists under `src/routes/api/image/+server.ts`; no creator-facing flow currently manages image generation lifecycle.

## Decision Log

- Decision: Treat “10/10” as a product-completion bar, not just a code-abstraction bar.
  Rationale: User goal is a subscription-grade final product where creators can author similar narratives, not merely a technical refactor.
  Date/Author: 2026-02-12 / Codex

- Decision: Keep No Vacancies as default production cartridge while building creator-template and configuration depth around it.
  Rationale: Preserves current playable behavior and reduces migration risk while expanding capability.
  Date/Author: 2026-02-12 / Codex

- Decision: Prioritize config inventory and schema hardening before UI polish implementation.
  Rationale: UI on top of unstable contracts leads to rework and hidden coupling.
  Date/Author: 2026-02-12 / Codex

## Outcomes & Retrospective

This section will be completed at the end of each major milestone and at plan completion. Initial status: plan drafted, implementation not yet started under this document.

## Context and Orientation

The repository is a SvelteKit app (`src/routes`, `src/lib`) with a game runtime (`src/lib/game/gameRuntime.ts`), server AI provider paths (`src/lib/server/ai`), and cartridge registry (`src/lib/stories`). A cartridge is the package of story-specific assets and behavior contracts currently expressed through `StoryCartridge` in `src/lib/stories/types.ts` and concrete adapters such as `src/lib/stories/no-vacancies/index.ts`.

The app currently supports selecting a cartridge by `PUBLIC_STORY_ID`, uses Grok text/image provider plumbing, and has a readiness endpoint (`src/routes/api/demo/readiness/+server.ts`) with basic active-story metadata. The current second cartridge (`starter-kit`) is a structural proof, not a creator-ready template system.

Terms used in this plan:

- Cartridge: A story package that supplies prompts, initial state, lessons, and UI/media mappings.
- Creator mode: Product surfaces and workflows used by non-engineers to configure and publish stories.
- Template: A pre-structured starter package that can generate a new cartridge with safe defaults.
- Image lifecycle: Prompt composition, generation call, storage/caching, approval/rejection, and fallback behavior.
- Design system: Shared styling tokens/components that produce consistent visual quality across routes.

## Plan of Work

### Milestone 1: Full configuration inventory and schema hardening

This milestone creates the exact map of what can currently be hardcoded and moves each item into explicit configuration contracts where appropriate. At the end of this milestone, a novice can point to one canonical schema per configurable concern and know where each runtime value comes from.

Edits will focus on `src/lib/stories/types.ts`, supporting schema modules under `src/lib/stories/schema/*`, and adapters in `src/lib/stories/no-vacancies/*`. The work will enumerate and classify every configurable axis: identity/branding, protagonist metadata, companion cast, initial state/thread defaults, prompt modules, lesson catalog behavior, ending policy, scene constraints, image strategy, sound/style/theme tokens, feature toggles, telemetry labels, and moderation policy.

Acceptance for this milestone is a complete configuration matrix in repo docs and runtime validation that blocks incomplete cartridge configs with precise error messages.

### Milestone 2: Creator templates and scaffolding pipeline

This milestone creates creator-ready templates and generator tooling so users can start a new narrative without touching engine internals. A command such as a Node script under `scripts/create-cartridge.mjs` will scaffold a new cartridge package from templates.

The template system will include at least three tiers: minimal quickstart template, full-featured dramatic template (closest to No Vacancies depth), and visual-first template with rich image policy defaults. Generated cartridges must include mandatory metadata, prompts, lessons, image policy, and theme token files.

Acceptance is: from a clean checkout, run the generator once, register cartridge, set `PUBLIC_STORY_ID`, run app, and play a generated story shell without code edits outside generated files and registry registration.

### Milestone 3: Dynamic Grok image-generation completion

This milestone finishes creator-grade dynamic image functionality. It will implement configurable image prompt strategy per cartridge, robust retry and bounded recovery, cache key strategy, persisted image metadata, and creator controls for regenerate/accept/fallback image paths.

Work will review and extend `src/routes/api/image/+server.ts`, provider integration in `src/lib/server/ai/providers/grok.ts`, and client/runtime wiring for scene image state. Guardrails must remain strict for banned depictions and must never leak keys.

Acceptance is: playthrough can trigger dynamic images for scenes, failures are surfaced clearly with bounded retries and fallback image behavior, and creators can audit/regenerate within allowed limits.

### Milestone 4: Snazzy modern UI with eclectic flavor

This milestone introduces a design system and route-level UX refresh for both player mode and creator mode. “Eclectic-clean” means crisp spacing/typography and modern controls with personality accents (micro-animations, layered cards, narrative motif treatments) without reducing readability/accessibility.

Core additions include tokenized theme system (light/dark and cartridge-overrides), reusable component primitives, cleaner navigation, richer play scene composition, and a dedicated creator workspace for template selection/config editing/preview.

Acceptance is human-visible: side-by-side before/after screenshots and route walkthrough show a notably modernized interface while preserving accessibility baseline and stable interaction flow.

### Milestone 5: Productization, operations, and release readiness

This milestone finalizes observability, governance, and release quality. It adds deeper readiness health details (active cartridge version, image generation health, queue depth/retry stats), documentation for deployment patterns, and end-to-end tests for creator-to-player flow.

Acceptance is: one command path for CI passes, docs explain how a new creator launches a new story, and rollback instructions allow safe retreat to previous cartridge/app state.

## Concrete Steps

Run all commands from repository root `/workspace/NoVacancies`.

1. Inspect baseline contracts and runtime wiring.

    rg -n "StoryCartridge|PUBLIC_STORY_ID|getActiveStoryCartridge|resolveImagePayload|generateImage" src tests

2. Build config inventory document and schema files.

    mkdir -p src/lib/stories/schema docs
    # add schema modules and docs/config matrix

3. Build template generator and template assets.

    mkdir -p scripts templates/cartridge-minimal templates/cartridge-full templates/cartridge-visual
    # implement scripts/create-cartridge.mjs and template manifests

4. Extend image lifecycle and creator controls.

    # edit server routes, provider adapters, and UI state components

5. Implement design system and creator workspace UI.

    # edit src/app.css, route components, and reusable UI primitives

6. Add and run tests after each milestone.

    npm run lint
    npm test
    npm run check
    npm run test:narrative
    npm run test:e2e

Expected transcript pattern for successful checkpoints:

    > npm run lint
    ... no errors

    > npm test
    ... all configured smoke checks pass

    > npm run check
    ... svelte-check found 0 errors

## Validation and Acceptance

Validation is successful only when a novice can follow docs to create and run a new narrative cartridge from template and observe all of the following:

- A new cartridge appears in the registry and can be selected by configuration.
- The app loads with cartridge-specific branding/theme/content.
- AI text scenes generate and progress coherently.
- Dynamic images generate through Grok with clear fallback behavior.
- Creator workspace allows regenerate/approve image decisions.
- CI-quality gates pass and demonstrate behavior beyond compilation.

Manual acceptance scenario (must be documented in README once implemented):

- Create cartridge from template.
- Register cartridge.
- Set `PUBLIC_STORY_ID` to new cartridge.
- Start app.
- Play first 3 scenes.
- Trigger at least one image generation and one fallback/retry path.
- Verify readiness endpoint includes active cartridge and image health.

## Idempotence and Recovery

The implementation sequence must be safe to re-run. Generator commands must be idempotent or fail with actionable messages (for example, refusing to overwrite existing cartridge directory unless `--force` is passed). New migrations or schema validations must not mutate user content destructively.

If a milestone fails mid-way, recovery path is:

- Revert to last green commit.
- Re-run the milestone branch from first checklist step.
- Use tests listed in this plan to confirm clean state.

Rollback for production is always “set active story back to known stable cartridge + deploy previous app release” until newer milestone issues are resolved.

## Artifacts and Notes

Implementation must capture concise artifacts as work proceeds:

- Before/after UI screenshots for player and creator routes.
- Sample generated cartridge directory tree.
- Example readiness payload showing active cartridge and image health.
- Test transcript snippets proving milestone acceptance.

## Interfaces and Dependencies

At plan completion, the following interfaces must exist or be expanded with backward-safe defaults:

- `src/lib/stories/types.ts`
  - `StoryCartridge` expanded to include explicit configuration modules for narrative rules, theme tokens, image policy, and creator metadata.

- `src/lib/stories/index.ts`
  - Registry/selection APIs plus optional metadata discovery helpers for creator UI.

- `src/lib/server/ai/providers/grok.ts`
  - Text and image calls that consume cartridge-level policies and enforce bounded retries.

- `src/routes/api/image/+server.ts`
  - Endpoints supporting generation, retry, and status reporting with guardrail enforcement.

- `src/routes/api/demo/readiness/+server.ts`
  - Extended operational checks including active cartridge details and image pipeline health metrics.

- `scripts/create-cartridge.mjs`
  - Scaffolding command with template selection and validation.

Dependencies should remain current SvelteKit/TypeScript toolchain unless a milestone explicitly justifies additions.

## Change Note

Updated on 2026-02-12 by Codex to replace previous short abstraction plan with a full self-contained ExecPlan aimed at reaching a 10/10 creator-grade product outcome, including modern UI, full configurability, template-driven onboarding, and dynamic Grok image lifecycle completion.
