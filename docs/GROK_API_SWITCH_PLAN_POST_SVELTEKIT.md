# Grok API Switch Plan (Pre-SvelteKit Completion)

Date: 2026-02-07  
Scope: Switch AI provider before SvelteKit migration is complete, using seam-first work that ports cleanly into the final SvelteKit branch.
Note: filename is retained for continuity with prior references.

Execution mode:
- `Pre-SvelteKit in-flight only`: implement provider seam + Grok adapters on the current runtime branch, then cherry-pick/port seam modules into the SvelteKit branch.

## Objective

Replace Gemini integration with xAI Grok while preserving playability, bounded recovery behavior, and test confidence.

## Outage Policy (Explicit, Designed Behavior)

Provider-down behavior is a design decision, not an accident:
1. Production default: degrade to mock playability mode when Grok is unavailable.
2. If product intentionally chooses hard-stop mode, set `AI_OUTAGE_MODE=hard_fail` explicitly and test that UX path.
3. Recovery loops remain bounded in all modes (no infinite retries).
4. Preview/production must declare outage mode explicitly; local dev may default to `mock_fallback`.

Model policy:
- Text generation: `grok-4-1-fast-reasoning` (always)
- Image generation: `grok-imagine-image`

Execution method:
- Seam-driven development per your rule: `contract -> probe -> tests -> mock implementation -> actual implementation`.

## Start Conditions (Pre-SvelteKit In-Flight)

Start now with these constraints:
1. Implement Grok through provider seams only (no route/component hard-coupling).
2. Keep runtime interfaces stable so seam modules port forward cleanly.
3. Keep Gemini/mock fallback selectable behind config flags during cutover.
4. Do not block SvelteKit migration branch on provider-specific UI changes.

Branch strategy:
1. Create `feat/grok-pre-sveltekit`.
2. Land seam/contracts/tests first, then Grok adapter/text/image in small slices.
3. Keep commits atomic by phase and push after each passed phase gate.
4. When SvelteKit branch is ready, cherry-pick or port seam modules with tests first, then provider adapters.

## Current SvelteKit Baseline (Target Port Shape)

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

## Additional Baseline Specifics (Added)

Branch/workflow:
1. Active migration branch: `feat/sveltekit-migration`.
2. Existing legacy `js/*` app still present during transition; treat `src/*` as the migration target.
3. Keep non-related working-tree files untouched unless they block touched files.

Runtime/tooling:
1. Adapter runtime is pinned to `nodejs22.x` in `svelte.config.js`.
2. Use `npm run check` before Grok changes to ensure SvelteKit sync + TS diagnostics are clean.
3. For local e2e reliability, route startup can be slow in this environment; allow higher web-server startup timeout.

Playwright notes:
1. If Playwright cannot find browsers, use:
   - `PLAYWRIGHT_BROWSERS_PATH=.playwright-browsers npx playwright install chromium`
2. Run tests with the same browser path override when needed:
   - `PLAYWRIGHT_BROWSERS_PATH=.playwright-browsers npm run test:e2e`
3. Live Gemini spec is opt-in and should remain skipped unless explicit env is set.

Security/ops:
1. Do not store API tokens/keys in files or docs.
2. Keep provider keys server-side only once Grok routes are added.
3. Continue preserving fallback/recovery invariants while replacing provider transport.

Because this is a pre-SvelteKit execution plan:
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
- idempotency input key for retriable writes/calls (`requestId`)
- explicit retry classification (`retryable: true|false`)

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
- outage mode (`mock_fallback|hard_fail`)

Initial recommendation:
- `max_output_tokens` default: 1800
- hard cap: 3200
- request timeout: 20s
- retries: 2 max
- backoff: 400ms then 1200ms with jitter
- retryable classes only: timeout, 429, transient 5xx
- non-retryable classes: auth, schema contract violation, content guardrail rejection

Rationale: high enough for rich scenes, low enough to control latency/cost variance.

## Phase Plan

## Phase 0: Baseline Lock (Before Grok)

Contract:
- Freeze current scene/output contract and fallback invariants.

Probe:
- Confirm all tests green on the active pre-SvelteKit working baseline.

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
- Define typed config loader contract (`loadAiConfig(): AiConfig`) with fail-closed validation.

Probe:
- Create lightweight health probe command for provider client wiring only.

Tests:
- Contract tests ensure mock and grok adapters conform identically.
- Verify no secrets leak in logs/errors.
- Verify config loader fails closed on missing/invalid env combinations.

Mock implementation:
- Wire existing mock story behavior into new provider interface.

Actual implementation:
- Grok adapter skeleton returning `NotImplemented` typed errors.

Exit gate:
- App runs fully on interface-backed mock provider.

## Phase 2: xAI Connectivity Probe

Contract:
- Add probe endpoint schema (`modelAvailable`, `authValid`, `latencyMs`, `provider`, `model`).

Probe:
- Probe is exposed as server endpoint (for CI/ops/cron), not tied to process startup.
- Check auth and model availability for:
  - `grok-4-1-fast-reasoning`
  - `grok-imagine-image`

Tests:
- Probe parser tests for success/failure payload shapes.

Mock implementation:
- Probe mock responses for offline CI.

Actual implementation:
- Real probe in server-only module + controlled caller (CI job / ops cron / on-demand admin call).

Exit gate:
- Probe passes in preview env with configured secrets.

## Phase 3: Text Generation Cutover

Contract:
- Enforce strict `Scene` schema validation prior to apply/render.

Probe:
- One-step generation smoke with schema/invariant assertions (not exact output text).

Tests:
- Parse recovery remains bounded.
- Retry/backoff bounded.
- Fallback transition keeps game playable.
- Regression tests for malformed output handling.
- Story sanity validators pass (no apology loops, no contradictory thread updates, choices remain meaningfully distinct).

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
5. `AI_OUTAGE_MODE=mock_fallback|hard_fail`

Remove or lock flags after stabilization to avoid long-term drift.

## Config Validation Contract

All AI runtime settings must come from one typed loader:
1. Single source: `loadAiConfig()` returns normalized `AiConfig`.
2. Loader validates env combinations and fails closed on invalid state.
3. Runtime/modules consume only `AiConfig` (not raw `process.env` reads).
4. Unit tests cover valid configs and expected startup failures.

## Vercel Environment Variables (Server-Side Only)

Expected:
1. `XAI_API_KEY`
2. `AI_PROVIDER`
3. `GROK_TEXT_MODEL` (default `grok-4-1-fast-reasoning`)
4. `GROK_IMAGE_MODEL` (default `grok-imagine-image`)
5. `AI_MAX_OUTPUT_TOKENS` (default `1800`)
6. `AI_OUTAGE_MODE` (`mock_fallback|hard_fail`, required in preview/prod)

Rules:
- Never expose secret vars as public env.
- Never log raw key values.
- In preview/prod, missing `AI_OUTAGE_MODE` must fail closed during config load.
- In local dev only, `AI_OUTAGE_MODE` may default to `mock_fallback`.

## Observability Contract (Required)

Emit structured events for every provider request/response lifecycle:
1. `requestId`
2. `provider`
3. `model`
4. `route` (`opening|next|image|probe`)
5. `latencyMs`
6. `retryCount`
7. `parseAttempts`
8. `errorType` (typed bucket, never raw secrets)
9. `contextTruncated` (boolean)
10. `tokenUsage` where available

Operational requirements:
1. Correlate all retries via same `requestId`.
2. Redact API keys/tokens/authorization headers before log emission.
3. Add unit tests that prove secrets are redacted from logs and thrown error payloads.

## Risk Register

1. Model naming/version drift in provider console.
2. Latency/cost spikes if output token caps are too high.
3. Outage mode misconfiguration (`hard_fail` accidentally enabled).
4. Hidden schema drift if parser guards are too permissive.
5. Prompt/image guardrails regressing during adapter swap.
6. Env/feature-flag drift causing preview/prod behavior mismatch.
7. Semantic degradation that still passes schema validation.
8. Image URL expiry/CORS/payload bloat causing intermittent broken visuals.

## Mitigations

1. Keep probe step mandatory before enabling provider in production.
2. Keep strict scene validator and bounded retries.
3. Keep mock provider first-class with contract parity tests in every phase.
4. Add explicit tests for image/content guardrails and no-secret logging.
5. Use a single typed config loader and fail closed on invalid env/flag sets.
6. Add semantic sanity validator tests in integration suite.
7. Define image delivery strategy before launch (proxy/cache/store policy).

## Story Sanity Validator Set (Schema-Pass Is Not Enough)

Add a post-parse sanity layer before scene apply/render:
1. Choice distinctness: options are not paraphrases of each other.
2. Thread coherence: updates cannot contradict current state without transition context.
3. No apology loops: repetitive self-referential filler is rejected/regenerated within bounded retries.
4. Actionability: scene ends with clear pressure and playable choices.
5. Guardrail continuity: content/image constraints are preserved.

Test requirement:
1. Add fixtures that intentionally pass schema but fail narrative sanity.
2. Assert bounded recovery behavior when sanity checks fail.

## Image Delivery Decision (Must Be Set Before Production)

Pick one and lock it in config/docs:
1. Proxy-and-cache image responses server-side (preferred for expiry/CORS control).
2. Direct URL pass-through with TTL refresh logic.
3. Persist base64/object storage and serve stable URLs.

Decision must include:
1. Caching strategy
2. Expiry handling
3. Payload size limits
4. Fallback image behavior

## Review/Critique/Revise Loop (Required Each Phase)

Before phase close, answer:
1. What would a group of haters say about the work I just did?
2. Which part is most likely to fail silently?
3. What did we assume without proof?
4. Which test would fail first if we are wrong?

If critique reveals risk, revise before closing phase.

## Immediate Hardening Delta (Post-Review)

These items come from the latest code review and should be treated as required reliability closure.

### D1: Safe Temporary Auth Bypass (Non-Prod Only)
- Add `AI_AUTH_BYPASS=true|false` config.
- Permit bypass only in local/preview and reject in production.
- Emit telemetry when bypass path is used.
- Keep `auth` hard-fail behavior when bypass is off.

### D2: Opening Scene Fallback Parity
- Ensure `startGame()` has the same fallback behavior as mid-story scene generation.
- If AI opening fails in AI mode and outage policy is fallback, switch to mock and remain playable.

### D3: NarrativeContext Consumption in Provider Prompt
- Ensure provider prompt explicitly includes:
  - recent scene prose
  - lesson history lines
  - thread narrative lines
  - boundary narrative lines
  - transition bridge content (when present)
- Validate this path with test coverage (not just schema validity).

### D4: Image Path Reliability Hardening
- Add bounded timeout + retry/backoff parity for image calls.
- Enforce image guardrail rejection before provider call.
- Map typed errors to meaningful route status codes (`422`, `503`, `504`, etc.).

### D5: Regression Coverage Expansion
- Keep route-shell tests, plus explicit tests for:
  - guardrail rejection behavior
  - opening request playability under AI-mode payload shape
  - provider probe gate behavior
- Keep live provider e2e opt-in only.

### D6: Remaining Improvements (Next Iteration)
- Split lint coverage for legacy `js/` and migration `src/`.
- Centralize retry policy for text + image in one shared utility.
- Add request-correlation IDs through route -> provider telemetry.
- Add adapter contract fixtures that mock and grok must both pass.

Required phase artifact:
1. `Phase Review Note` with:
   - issues found
   - plan delta
   - test delta
   - rollback impact

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
6. Mock provider parity suite passes (rollback path proven, not assumed).
7. Changelog and lessons docs are updated with final cutover behavior and risks.

## Autonomous Execution Prompt (Rewritten)

Use this prompt for cloud/local Codex execution:

```md
Execute the full Grok provider migration autonomously before SvelteKit migration is complete.

Branch:
- Create and use `feat/grok-pre-sveltekit`.

Mission:
- Replace Gemini provider path with Grok while preserving playability and bounded recovery.
- Keep provider integration seam-first and framework-agnostic for later SvelteKit port/cherry-pick.

Model policy:
- Text: `grok-4-1-fast-reasoning`
- Image: `grok-imagine-image`

Outage policy (required):
- Set `AI_OUTAGE_MODE` explicitly in preview/prod (recommended: `mock_fallback`).
- If `hard_fail` is used, treat as explicit product policy and test UX for it.

Required implementation outcomes:
1. Provider seam + typed error model + idempotent requestId support.
2. Single typed config loader (`loadAiConfig`) with fail-closed validation.
3. Probe endpoint (`/api/ai/probe`) with CI/ops caller; no startup-probe assumption.
4. Grok text adapter with strict schema + narrative sanity validators + bounded recovery.
5. Grok image adapter with chosen image delivery policy (proxy/cache/store decision implemented).
6. Structured observability with required fields (`requestId`, latency, retries, parseAttempts, errorType, provider/model, truncation, tokenUsage when available).
7. Secret redaction enforcement in logs/errors with tests.
8. Mock parity continuously tested as rollback guarantee.

Test-first and gates per phase:
- `npm run lint`
- `npm test`
- `npm run test:e2e` when renderer/e2e paths changed
- Avoid deterministic-output assertions; assert schema/invariants/behavior.

Execution constraints:
- Commit per phase, push per passed phase.
- Ignore unrelated files unless they block touched files.
- Do not pause unless stop conditions hit:
  - invariant conflict
  - schema/backward-compat break risk
  - unexpected external edits in touched files

Mandatory RCR questions each phase:
1. What would a group of haters say about the work I just did?
2. Which part is most likely to fail silently?
3. What did we assume without proof?
4. Which test would fail first if we are wrong?

Final handoff must include:
- What was implemented by phase
- Commands run and pass/fail
- Docs Updated
- Risks Introduced
- Assumptions Made
- Rollback Note
- Commits and pushed refs
```

## Critique Summary and Revisions Applied (2026-02-07)

Key critiques addressed in this revision:
1. Contradiction between bounded recovery and outage handling:
   - Resolved by explicit outage policy and required `AI_OUTAGE_MODE` in preview/prod.
2. Startup probe mismatch with serverless runtime:
   - Replaced with `/api/ai/probe` endpoint + controlled caller model.
3. Insufficient observability for production debugging:
   - Added required observability event contract and redaction test expectations.
4. Deterministic smoke-test fragility:
   - Reframed smoke checks to schema/invariants instead of exact prose.
5. Schema-pass semantic degradation risk:
   - Added story sanity validator set and required failing fixtures.
6. Config/flag drift risk:
   - Added single typed `loadAiConfig()` contract with fail-closed validation.
7. Rollback realism:
   - Added mock parity gate in Definition of Done.

## Current Execution Caveat (Environment)

1. In this environment, Playwright may fail to launch Chromium with missing system libs (`libnspr4.so`) even when browser binaries exist.
2. If encountered, run:
   - `npx playwright install-deps chromium`
   - then `PLAYWRIGHT_BROWSERS_PATH=.playwright-browsers npm run test:e2e`
3. Treat this as environment setup, not app-regression, unless failures persist after deps install.
