# Grok API Switch Plan (Post-SvelteKit)

Date: 2026-02-07  
Scope: Switch AI provider with a seam-first strategy that works both before and after SvelteKit migration stabilizes.

Execution mode:
- `Mode A (Post-SvelteKit)`: run this plan against the SvelteKit baseline.
- `Mode B (Pre-SvelteKit in-flight)`: implement provider seam + Grok adapters on the current runtime branch, then cherry-pick/port seam modules into SvelteKit branch.

## Objective

Replace Gemini integration with xAI Grok while preserving playability, bounded recovery behavior, and test confidence.

Model policy:
- Text generation: `grok-4-1-fast-reasoning` (always)
- Image generation: `grok-imagine-image`

Execution method:
- Seam-driven development per your rule: `contract -> probe -> tests -> mock implementation -> actual implementation`.

## Start Conditions (Choose Path)

### Path A: Post-SvelteKit (preferred if available)
Start when all are true:
1. SvelteKit migration branch is green (`lint`, unit/integration, e2e).
2. Vercel preview deploy is stable.
3. Story playthrough works end-to-end in mock mode.
4. AI provider calls are already server-side (no client key exposure).

### Path B: Pre-SvelteKit In-Flight (allowed)
Start now if Path A is not yet ready, with these constraints:
1. Implement Grok through provider seams only (no route/component hard-coupling).
2. Keep runtime interfaces stable so seam modules port forward cleanly.
3. Keep Gemini/mock fallback selectable behind config flags during cutover.
4. Do not block SvelteKit migration branch on provider-specific UI changes.

Branch strategy for Path B:
1. Create `feat/grok-pre-sveltekit`.
2. Land seam/contracts/tests first, then Grok adapter/text/image in small slices.
3. Keep commits atomic by phase and push after each passed phase gate.
4. When SvelteKit branch is ready, cherry-pick or port seam modules with tests first, then provider adapters.

## Current SvelteKit Baseline (Use This Exact Layout for Path A, or target shape for Path B)

This section reflects the current migration state so another agent can start Grok work without rediscovery.

Framework/config:
1. `svelte.config.js` uses `@sveltejs/adapter-vercel` with `runtime: 'nodejs22.x'`.
2. `vite.config.ts` uses SvelteKit plugin.
3. `tsconfig.json` extends `.svelte-kit/tsconfig.json`.
4. `package.json` scripts now include:
   - `dev` -> `vite dev`
   - `build` -> `vite build`
   - `preview` -> `vite preview`
   - `check` -> `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json`

Route structure:
1. `src/routes/+layout.svelte` shared shell + nav + PWA registration.
2. `src/routes/+page.svelte` landing/start.
3. `src/routes/settings/+page.svelte` settings state UI.
4. `src/routes/play/+page.svelte` mock-mode playthrough UI.
5. `src/routes/ending/+page.svelte` ending summary UI.

Game/runtime modules:
1. `src/lib/contracts/game.ts` core typed contracts and validators.
2. `src/lib/services/mockStoryService.ts` migrated story graph/service.
3. `src/lib/game/gameRuntime.ts` runtime orchestration + fallback semantics.
4. `src/lib/game/store.ts` Svelte store bridge for settings/state/choices.
5. `src/lib/services/settingsStorage.ts` local/session persistence.
6. `src/lib/game/imagePaths.ts` image-key to `/static/images` mapping.

PWA/static baseline:
1. `static/manifest.json`
2. `static/service-worker.js`
3. `static/icons/*`
4. `static/images/*`
5. PWA registration helper: `src/lib/client/pwa.ts`

Important current constraint for Grok work:
1. Keep current UI/store/runtime contracts stable.
2. Introduce Grok via provider seam, not direct route-component calls.
3. Do not re-introduce browser-side secret handling.

Recommended first Grok implementation target files:
1. `src/lib/server/ai/provider.interface.ts`
2. `src/lib/server/ai/providers/mock.ts`
3. `src/lib/server/ai/providers/grok.ts`
4. `src/routes/api/story/opening/+server.ts`
5. `src/routes/api/story/next/+server.ts`
6. `src/routes/api/image/+server.ts`
7. `src/lib/services/storyService.ts` (switch to endpoint client adapter)

Handoff command checklist for incoming agent:
1. `npm install`
2. `npm run check`
3. `npm run lint`
4. `npm test`
5. `npm run build`
6. `npm run test:e2e` (ensure Playwright browser path is correctly configured in the environment)

If running Path B before SvelteKit is complete:
1. Run equivalent gates on the current branch runtime.
2. Enforce provider contract tests so porting to SvelteKit is mechanical.
3. Avoid introducing framework-specific assumptions into server/provider modules.

## Out of Scope

1. Story-creator platform abstraction.
2. Major prompt redesign not required for provider switch.
3. UI redesign unrelated to provider integration.

## Architecture Seams

## Seam A: Provider Interface

Single internal contract used by routes/actions/endpoints:
- `openScene(...) -> Scene`
- `nextScene(...) -> Scene`
- `generateImage(...) -> { url | b64 }`
- provider-agnostic typed errors (timeout, parse, rate-limit, auth, provider-down)

Implementation targets:
- `src/lib/server/ai/provider.interface.ts`
- `src/lib/server/ai/providers/mock.ts`
- `src/lib/server/ai/providers/grok.ts`

## Seam B: Prompt + Response Schema

Keep prompt/build logic provider-independent where possible:
- prompt builder module remains separate from transport/client module
- scene shape validated before apply/render
- recovery prompts bounded by explicit retry counters

## Seam C: Runtime Policy

Centralize in one policy file:
- text model id
- image model id
- timeout, retry, backoff
- `max_output_tokens` default and hard cap

Initial recommendation:
- `max_output_tokens` default: 1800
- hard cap: 3200

Rationale: high enough for rich scenes, low enough to control latency/cost variance.

## Phase Plan

## Phase 0: Baseline Lock (Before Grok)

Contract:
- Freeze current scene/output contract and fallback invariants.

Probe:
- Confirm all tests green on SvelteKit baseline.

Tests:
- `npm run lint`
- `npm test`
- `npm run test:e2e`

Mock implementation:
- none (baseline only)

Actual implementation:
- none (baseline only)

Exit gate:
- Baseline commit tagged as rollback anchor.

## Phase 1: Provider Contract + Adapters

Contract:
- Define provider interface and typed error model.

Probe:
- Create lightweight health probe command for provider client wiring only.

Tests:
- Contract tests ensure mock and grok adapters conform identically.
- Verify no secrets leak in logs/errors.

Mock implementation:
- Wire existing mock story behavior into new provider interface.

Actual implementation:
- Grok adapter skeleton returning `NotImplemented` typed errors.

Exit gate:
- App runs fully on interface-backed mock provider.

## Phase 2: xAI Connectivity Probe

Contract:
- Add startup/self-test probe schema (`modelAvailable`, `authValid`, `latencyMs`).

Probe:
- Check key auth and model availability for:
  - `grok-4-1-fast-reasoning`
  - `grok-imagine-image`

Tests:
- Probe parser tests for success/failure payload shapes.

Mock implementation:
- Probe mock responses for offline CI.

Actual implementation:
- Real probe in server-only module, disabled in client builds.

Exit gate:
- Probe passes in preview env with configured secrets.

## Phase 3: Text Generation Cutover

Contract:
- Enforce strict `Scene` schema validation prior to apply/render.

Probe:
- One-step generation smoke with deterministic test prompt.

Tests:
- Parse recovery remains bounded.
- Retry/backoff bounded.
- Fallback transition keeps game playable.
- Regression tests for malformed output handling.

Mock implementation:
- Keep mock provider selectable via feature flag.

Actual implementation:
- Implement `grok-4-1-fast-reasoning` text calls.
- Add structured-output mode where supported; otherwise robust parse guards.

Exit gate:
- AI mode playthrough reaches ending on preview without invariant regressions.

## Phase 4: Image Generation Cutover

Contract:
- Normalize image response to app format (`url` or `b64` converted to displayable asset).

Probe:
- Single prompt image generation smoke.

Tests:
- Response format handling tests (`url`, `b64`).
- Guardrail test: rejected prompt traits are blocked before provider call.
- Timeout and retry behavior tested.

Mock implementation:
- deterministic mock image responses for CI/e2e.

Actual implementation:
- Implement `grok-imagine-image` adapter and mapper.

Exit gate:
- Scene image flow works in preview with no broken-image regressions.

## Phase 5: Full Reliability + Rollout

Contract:
- Freeze provider contract and feature flags.

Probe:
- Full-playthrough smoke in preview, then production canary.

Tests:
- Full gate:
  - `npm run lint`
  - `npm test`
  - `npm run test:e2e`
- Add one live-provider opt-in e2e canary (non-blocking for normal CI).

Mock implementation:
- retained for dev/test safety only.

Actual implementation:
- Default provider set to Grok in production.

Exit gate:
- Definition of done met: deployed app, full playthrough works, test gates pass.

## Feature Flags

Use explicit flags during cutover:
1. `AI_PROVIDER=mock|grok`
2. `ENABLE_GROK_IMAGES=true|false`
3. `ENABLE_PROVIDER_PROBE=true|false`
4. `ENABLE_GROK_TEXT=true|false` (recommended for staged text cutover)

Remove or lock flags after stabilization to avoid long-term drift.

## Vercel Environment Variables (Server-Side Only)

Expected:
1. `XAI_API_KEY`
2. `AI_PROVIDER`
3. `GROK_TEXT_MODEL` (default `grok-4-1-fast-reasoning`)
4. `GROK_IMAGE_MODEL` (default `grok-imagine-image`)
5. `AI_MAX_OUTPUT_TOKENS` (default `1800`)

Rules:
- Never expose secret vars as public env.
- Never log raw key values.

## Risk Register

1. Model naming/version drift in provider console.
2. Latency/cost spikes if output token caps are too high.
3. Provider outage causing hard failure (known accepted risk per product decision).
4. Hidden schema drift if parser guards are too permissive.
5. Prompt/image guardrails regressing during adapter swap.

## Mitigations

1. Keep probe step mandatory before enabling provider in production.
2. Keep strict scene validator and bounded retries.
3. Keep mock provider for dev/test even if not used as prod fallback.
4. Add explicit tests for image/content guardrails and no-secret logging.

## Review/Critique/Revise Loop (Required Each Phase)

Before phase close, answer:
1. What would a group of haters say about the work I just did?
2. Which part is most likely to fail silently?
3. What did we assume without proof?
4. Which test would fail first if we are wrong?

If critique reveals risk, revise before closing phase.

## Rollback Note

Safe rollback path:
1. Set `AI_PROVIDER=mock`
2. Disable Grok image flag
3. Redeploy previous green commit

This restores app operability while preserving migration artifacts for retry.

## Definition of Done (Release Gate)

1. Provider seam is the only integration point used by runtime/routes.
2. Grok text (`grok-4-1-fast-reasoning`) and image (`grok-imagine-image`) paths both pass contract validation.
3. Parse recovery, retry, and fallback behavior remain bounded and tested.
4. No secret leakage in logs/telemetry (tests included).
5. Full gate passes with evidence attached:
   - `npm run lint`
   - `npm test`
   - `npm run test:e2e` (or explicit environment block note)
6. Changelog and lessons docs are updated with final cutover behavior and risks.
