# Changelog

## [Unreleased] - 2026-02-07

### Changed

- **Creator Workflow Route Group:** Added `/create/*` creator pages for template start, draft editing (metadata/prompts/theme/assets), play preview, and publish/unpublish version control with separate persisted draft vs publish state, explicit Draft/Ready/Published badges, and pre-publish validation messaging (`src/routes/create/+layout.svelte`, `src/routes/create/template/+page.svelte`, `src/routes/create/editor/+page.svelte`, `src/routes/create/preview/+page.svelte`, `src/routes/create/publish/+page.svelte`, `src/lib/creator/storyBuilder.ts`, `src/lib/creator/store.ts`, `src/routes/+layout.svelte`, `src/app.css`).
- **Prompt Voice-Safety Reinforcement:** Added explicit forbidden-phrasing guidance to the main system prompt and recovery prompt path so didactic/therapy-summary drift is redirected to behavior+motive+consequence framing (`src/lib/server/ai/narrative.ts`).
- **Narrative Prompt Encoding Cleanup:** Replaced mojibake-affected prompt markers/punctuation with ASCII-safe wording in active narrative prompt assets (`src/lib/server/ai/narrative.ts`, `docs/NARRATIVE_DRIFT_REMAINING_WORK_2026-02-13.md`).
- **Context/Transition Test Hardening:** Added deterministic unit coverage that proves context budgeting trims older summaries before recent prose and that transition bridges emit mapped lines only when thread deltas exist (`tests/unit/contextBudget.spec.ts`, `tests/unit/transitionBridge.spec.ts`).
- **Play Utility Controls:** Added lightweight `/play` utility affordances (restart-run action, scene/arc/mood chips, debug shortcut) without changing core turn-processing behavior (`src/routes/play/+page.svelte`, `src/app.css`).
- **Legacy Runtime Deletion:** Removed the entire legacy `js/` runtime tree (`app/contracts/prompts/renderer/services`) from the repo to eliminate duplicate architecture and prompt drift risk.
- **Game Runtime Dependency Cleanup:** Removed active mock-service wiring from `src/lib/game/gameRuntime.ts` and `src/lib/game/store.ts`; runtime now requires an explicit API story service path.
- **Provider Selection Simplification:** Removed remaining `useMocks` provider branching in server-side provider selection and opening/probe route helpers.
- **Mock-Mode Contract Removal:** Removed `useMocks` from active `GameState`/`GameSettings` contracts and settings persistence; runtime and API story opening now operate on Grok-only shape without mock-mode fields.
- **Legacy Test/Script Cleanup:** Removed legacy JS-coupled test files (`tests/rendererTest.js`, `tests/rendererNodeTest.js`, `tests/smokeTest.js`, `tests/threadTest.js`) and retired `test:renderer` script.
- **Decommission Guard Update:** Updated legacy-provider marker scan scope to active paths only (`src/**`, `tests/e2e/**`, `package.json`) after removing `js/`.
- **Narrative Context Deduplication:** Removed duplicated translation/context-builder logic from `src/lib/server/ai/narrative.ts`; server prompt generation now reuses the canonical implementations exported by `src/lib/game/narrativeContext.ts`.
- **Narrative Runtime Contract Simplification:** Removed legacy narrative feature-flag plumbing (`narrativeContextV2`, `transitionBridges`) from contracts/runtime/settings storage now that both behaviors are always-on, and aligned opening route/request handling to the simplified shape.
- **Legacy Continue Prompt Path Removal:** Deleted unused `formatThreadState()` and legacy `getContinuePrompt()` from `src/lib/server/ai/narrative.ts`; active Grok flow now has one continue path (`getContinuePromptFromContext`) with anti-regression test coverage.
- **Narrative Drift Hardening (Follow-Through):** Enforced anti-duplication in Tier 1 narrative tests (explicitly fail if context maps/builders reappear in `narrative.ts`), rewired `narrative.ts` to import/re-export canonical context helpers from `src/lib/game/narrativeContext.ts`, and aligned unit sanity tests with structural-only issue contracts.
- **Narrative Plan Canonicalization:** Archived stale pre-migration local upgrade plan (`docs/LOCAL_NARRATIVE_UPGRADE_PLAN.md` -> `docs/archive/2026-02-13_local_narrative_upgrade_plan.md`) and added an explicit remaining-work tracker (`docs/NARRATIVE_DRIFT_REMAINING_WORK_2026-02-13.md`).
- **Dex Role Deepening:** Expanded Dex guidance from generic friend behavior to explicit subtle-saboteur triangulation (validate Sydney for access, then reframe her venting to others) so scene generation preserves his two-faced incentive model (`src/lib/server/ai/narrative.ts`).
- **Fallback Prose Strengthening + Freeze Gate:** Rewrote weak fallback context lines (generic "unclear/uncertain" phrasing) into behavior-led language in both narrative modules and added a blocking narrative-quality suite that prevents those weak strings from re-entering (`src/lib/game/narrativeContext.ts`, `src/lib/server/ai/narrative.ts`, `tests/narrative/narrativeQuality.test.js`).
- **Dex Thread State Added:** Added `dexTriangulation` as a first-class `StoryThreads` dimension with continuity translations/transition bridges and prompt-schema example support, so Dex sabotage intensity can be tracked and carried turn-to-turn (`src/lib/contracts/game.ts`, `src/lib/game/narrativeContext.ts`, `src/lib/server/ai/narrative.ts`).
- **Beat Diversity Memory:** Added `recentBeats` to `NarrativeContext`, injected into context rendering, and added anti-repeat continue-prompt instructions to reduce back-to-back scene openings that replay the same conflict move (`src/lib/contracts/game.ts`, `src/lib/game/narrativeContext.ts`, `src/lib/server/ai/narrative.ts`).
- **Narrative Test Coverage Expansion:** Updated Tier 1 narrative quality gates for the new thread dimension and beat-memory contract (`tests/narrative/narrativeQuality.test.js`).
- **UI Visual System Refresh:** Reworked app shell and global styling to a stronger motel-noir visual direction (new masthead, typography, atmospheric layered background, refined controls/cards, improved mobile behavior) without changing runtime flow (`src/routes/+layout.svelte`, `src/app.css`).
- **Play Command Deck Redesign:** Rebuilt `/play` into a bolder, higher-clarity command-deck layout with scene overlay status, arc progress meter, improved narrative readability card, and indexed choice controls with keyboard shortcuts (`1/2/3`) while preserving existing runtime behavior and Grok-only flow (`src/routes/play/+page.svelte`, `src/app.css`).
- **Stitch UI Prompt Blueprint:** Added a reusable Stitch prompt doc for `/play` targeting clean-modern UI with restrained visual flair and explicit accessibility/interaction requirements (`docs/STITCH_PLAY_PROMPT_CLEAN_MODERN_FLAIR_2026-02-13.md`).
- **Narrative Drift Cleanup Plan:** Added a decision-complete execution plan documenting remaining dedupe work, sanity policy alignment, anti-drift test hardening, and phased rollback strategy (`docs/NARRATIVE_DRIFT_CLEANUP_EXECUTION_PLAN_2026-02-13.md`).
- **Ending Tone Constraint:** Reframed ending examples and ending-steering guidance to disallow clean-win resolution; all ending trajectories are now explicitly bad-to-uneasy (`src/lib/server/ai/narrative.ts`).
- **Server Provider Registry Cleanup:** Removed the unused server-side mock provider adapter path (`src/lib/server/ai/providers/mock.ts`), narrowed provider registry/probe flow to Grok-only, and tightened provider type unions accordingly.
- **Canon Voice Restoration:** Restored thread/transition/boundary wording in active runtime mappings (`src/lib/server/ai/narrative.ts`, `src/lib/game/narrativeContext.ts`) and legacy prompt duplicate (`js/prompts.js`) to match handwritten canonical phrasing.
- **Motive-Driven Style Integration:** Added a formal motive-driven anthropomorphism writing-style reference and marked it as the active prose north star (`docs/WRITING_STYLE_REFERENCE_MOTIVE_DRIVEN_ANTHROPOMORPHISM.md`).
- **Prompt-Line Rewrite Pass:** Rewrote thread-state, lesson-history, and transition-bridge narrative lines in both active runtime and server prompt modules (`src/lib/game/narrativeContext.ts`, `src/lib/server/ai/narrative.ts`) to prioritize behavior/motive framing over abstract summary phrasing.
- **Generation Instruction Reinforcement:** Added explicit continue-prompt guidance to require motive-driven behavioral prose and avoid self-explaining abstract labels in scene generation output.
- **Narrative Pipeline Lock-In:** Removed runtime feature-flag gating for `narrativeContextV2` and `transitionBridges` inside `gameRuntime`; context building and transition bridge detection now run as always-on behavior in active play flow.
- **Opening Thread Parity:** `startGame()` now merges opening-scene `storyThreadUpdates`, preventing first-turn continuity deltas from being silently dropped.
- **Provider Prompt Path Simplification:** Grok text generation now requires `NarrativeContext` for non-opening scenes and no longer falls back to the legacy continue-prompt builder.
- **Context Budget Hardening:** Strengthened context budgeting to trim older summaries first and then deterministically trim recent-scene prose when required, instead of silently overrunning cap targets.
- **Heuristic Reduction (Full Pass):** Removed all taste/semantic heuristics from `sanity.ts`: apology-loop pattern, 4 banned didactic phrases (`lesson_is`, `teaches_us`, `in_the_end_realized`, `everything_happens_for_reason`), 3 therapy-speak detectors (`validate_feelings`, `safe_space`, `process_trauma`), and evasion-attempt regex. Retained only deterministic structural guards (text length, choice count, duplicate choices, word-count hard/soft limits). Updated `sanityMirror.js` and 3 adversarial fixtures to match. All 153 Tier 1 tests pass.
- **Adapter Type Tightening:** Added `sceneId` to the Grok scene-candidate shape and removed cast-based access in scene normalization.
- **Narrative Test Alignment:** Updated narrative regression fixtures/guards to match the reduced-heuristic sanity policy and unflagged transition bridge runtime.
- **Playwright Scope Fix:** Restored Playwright discovery to `tests/e2e` only so end-to-end runs do not accidentally execute non-e2e suites.
- **Browser-Safe Narrative Context:** Moved runtime context/transition helpers into `src/lib/game/narrativeContext.ts` and switched `gameRuntime` imports away from `$lib/server/*` to fix SvelteKit client/server boundary violations during `/play` and route-shell rendering.
- **Debug E2E Hydration Gate:** Added a debug-page hydration readiness marker and updated e2e sequencing so manual test-entry assertions only fire after client hydration, removing SSR-click race flakes.
- **Narrative CI Gate:** Added deterministic `test:narrative` Tier 1 quality suite with fixture-backed sanity assertions, canonical prompt/context wiring checks, continuity-dimension coverage, and regression guardrails.
- **CI Workflow:** Added `.github/workflows/narrative-quality.yml` with blocking Tier 1 gate, optional Tier 2 Claude rubric evaluation artifact upload, and non-blocking live Grok canary job.
- **Repo Hygiene:** Added `artifacts/` to `.gitignore` for generated narrative quality reports and retained local artifact output for CI/debug inspection.
- **Collaboration Rule:** Updated `AGENTS.md` with explicit narrative decision policy: prefer AI-guided narrative judgment over brittle taste heuristics, while keeping code guards structural.
- **Type Hardening (Narrative Runtime):** Removed `@ts-nocheck` from `src/lib/server/ai/narrative.ts` and `src/lib/server/ai/lessons.ts`, added strict function/shape typing, and removed the Grok prompt-call cast workaround so prompt wiring compiles under strict TS without escape hatches.
- **Narrative Parity Activation:** Added `src/lib/server/ai/narrative.ts` + `src/lib/server/ai/lessons.ts` as active runtime copies of canonical prompt/context assets, and switched Grok text generation to use the full system/opening/continue/recovery prompt set (instead of the single-line system stub).
- **Context + Transition Wiring:** Updated `src/lib/game/gameRuntime.ts` to build/pass `NarrativeContext` on each turn and to set `pendingTransitionBridge` from real thread deltas via `detectThreadTransitions`, preserving intended next-turn bridge behavior.
- **Sanity Guard Upgrade:** Expanded `src/lib/server/ai/sanity.ts` with banned-phrase checks, therapy-speak detection, and dual word-budget thresholds (soft/hard, ending vs non-ending) plus retryable-vs-blocking issue classification.
- **Grok Recovery Path:** Updated `src/lib/server/ai/providers/grok.ts` to run parse-recovery prompts when JSON extraction fails and to retry once on retryable sanity drift before failing hard.
- **Grok Parse Robustness:** Replaced naive JSON extraction with candidate-based extraction (fenced blocks + balanced object scanning) and enforced a strict two-stage parse path (standard parse, recovery parse, then typed `invalid_response` failure) with no synthetic fallback scene generation.
- **Parity Regression Guard:** Extended `tests/noLegacyProviderMarkers.js` with narrative parity marker checks (canonical prompt wiring, runtime context wiring, sanity thresholds, voice anchor presence).
- **Ending Debug Shortcut (Temp):** Added `Open Debug (Temp)` button on `/ending` so runtime errors are one click away during demo validation.
- **CSP Hardening:** Added a baseline Content Security Policy in `src/app.html` for the SvelteKit runtime, then tuned `script-src` compatibility so SvelteKit client hydration remains functional.
- **Debug UX Resilience:** `/debug` manual test entries now stay visible even when localStorage writes fail (quota/privacy mode), instead of silently no-oping.
- **Service Worker Cleanup:** Removed legacy root `service-worker.js` and stripped stale legacy provider endpoint exception from `static/service-worker.js`.
- **Legacy Provider Verification Reconciliation:** Added archival reconciliation notes classifying active vs legacy findings and tying each to decommission steps.
- **Legacy Provider Decommission Plan:** Added archival execution plan with file-level work breakdown, critique loop output (haters + Wu-Bob), and phased execution order.
- **Quality Gate Realignment:** Moved default `lint`/`test` scripts to active-runtime checks (`tests/e2e/**` lint + legacy-provider marker guard) and removed legacy provider-era test/lint scripts from the default workflow.
- **Legacy Provider Runtime Removal:** Deleted the legacy AI story-service runtime, retired legacy-provider-coupled integration tests, and scrubbed provider markers from legacy JS runtime comments/telemetry assumptions.
- **Guard Expansion:** Extended decommission guard coverage to include `js/**` (in addition to `src/**`, `tests/e2e/**`, and `package.json`) so legacy provider markers cannot silently return in code paths.
- **Legacy Artifact Archival:** Moved root legacy-provider reference files into `docs/archive/2026-02-08_legacy_provider/`.
- **Demo Readiness Indicator:** Added Home-page visual readiness dashboard with weighted progress bar and checklist, backed by `/api/demo/readiness` runtime checks.
- **Readiness Edge Coverage:** Expanded e2e assertions for `/api/demo/readiness` to validate weighted check IDs, total score weighting, and blocked-vs-ready behavior when `XAI_API_KEY` is missing/present.
- **Debug Error Surface:** Added `/debug` page with persisted runtime/API error log, manual test entry, and clear/reset actions for fast play-session triage.
- **Error Event Logging:** Wired client error logging for `startGame`, `choose`, network failures, and non-200 API responses with timestamped scope/details payloads.
- **Grok-Only Runtime:** Disabled mock runtime fallback paths for story/image server routes; requests now fail fast when Grok is unavailable or misconfigured.
- **Outage Policy:** Restricted `AI_OUTAGE_MODE` to `hard_fail` in runtime config and rejected `mock_fallback`/`AI_PROVIDER=mock` for active app flow.
- **UX Lock-In:** Removed `Static Story` toggle from Svelte settings and pinned `/play` mode indicator to `AI Mode`.
- **Dead Client Key Flow Removed:** Deleted Settings-page API key input + session persistence path so runtime no longer implies browser-side key entry.
- **Hard-Fail UX Copy:** Added user-facing error mapping for common provider/config failures (missing key, auth, rate limit, timeout, provider down).
- **E2E Contract Shift:** Replaced mock-playthrough e2e assertions with Grok-only behavior checks (explicit error assertions when `XAI_API_KEY` is missing).
- **Canary Naming Cleanup:** Renamed the live provider canary spec to `grok-live.spec.js` and updated docs references.
- **Provider Defaults:** Set Grok as the default text provider path (`AI_PROVIDER=grok` when unset) while keeping image generation on pre-generated/static assets by default unless `ENABLE_GROK_IMAGES=1`.
- **Runtime Defaults:** Switched game settings/opening request defaults to AI mode (`useMocks=false`) so new sessions start in AI Generated mode.
- **Credential Guard:** Provider configuration now requires `XAI_API_KEY` in Grok-only mode and hard-fails when missing.
- **Framework Migration:** Added SvelteKit TypeScript scaffold with split routes (`/`, `/settings`, `/play`, `/ending`) and shared layout navigation.
- **Gameplay Runtime Port:** Added typed `src/lib` game/runtime/service modules to support mock-mode playthrough in SvelteKit while preserving scene/state contracts and fallback-safe behavior.
- **PWA Preservation:** Added SvelteKit static manifest/service worker pathing and client-side registration helper under `src/lib/client/pwa.ts`.
- **Build Pipeline:** Switched project scripts to Vite/SvelteKit (`dev`, `build`, `preview`, `check`) and updated config files (`svelte.config.js`, `vite.config.ts`, `tsconfig.json`).
- **E2E Migration:** Reworked primary Playwright reliability spec for route-based SvelteKit flow and mock playthrough ending verification.
- **Runtime Mode Visibility:** Added an explicit `/play` mode pill so players can always see whether they are in `Mock Mode` or `AI Mode`, with Playwright coverage for both states.
- **Docs:** Added migration execution docs (`docs/SVELTEKIT_MIGRATION_PLAN.md`, `docs/GROK_API_SWITCH_PLAN_POST_SVELTEKIT.md`) and refreshed `README.md` run/test/build guidance.
- **Provider Seams:** Added server-side AI provider interface + registry (`mock` and `grok`) with typed error handling, bounded retry classification, and outage-mode policy loading.
- **Grok Integration:** Added Grok text/image adapters and SvelteKit API endpoints (`/api/story/opening`, `/api/story/next`, `/api/image`, `/api/ai/probe`) behind env/config flags.
- **Runtime Routing:** Updated Svelte runtime/store to call server endpoints in AI mode while preserving mock fallback playability and compatibility-safe opening/next scene contracts.
- **Observability Hardening:** Added server telemetry redaction/sanitization and basic story-sanity checks to catch schema-valid but low-quality outputs before apply.
- **Security Headers:** Added SvelteKit server hook (`src/hooks.server.ts`) that applies baseline hardening headers and conditional HTTPS HSTS.
- **Deploy Env Baseline:** Added `.env.example` and documented server-side AI env variables in `README.md` for consistent local/preview/production setup.
- **Runtime Pinning:** Added Node.js engine requirement `22.x` in `package.json` for deploy/runtime consistency.
- **Vercel Hygiene:** Added `.vercel/` to `.gitignore` to avoid committing local deployment artifacts.
- **E2E Reliability:** Removed legacy static-server branch from Playwright config, pinned e2e runtime defaults to safe mock mode, updated route-shell heading expectation, and migrated opt-in live canary flow to Grok/SvelteKit selectors.
- **Pregenerated Image Rotation:** Updated `/play` image rendering to use deterministic randomized selection from `static/images`, so each scene resolves to a stable pre-generated art frame without requiring live image generation.
- **Lesson UI Rendering:** `/play` now renders lesson title + quote + insight when `lessonId` is present (instead of only showing a numeric pill), and shows an explicit “no lesson tagged” message when lesson insights are enabled but absent for a scene.
- **Play Layout Tuning:** Updated `/play` layout to reduce oversized image dominance (desktop split layout + bounded image height/aspect) so story text and choices remain visible without excessive scrolling.
- **Lesson Catalog Sharing:** Moved lesson catalog to shared runtime module (`src/lib/narrative/lessonsCatalog.ts`) so both server prompt generation and client lesson rendering use the same canonical lesson data.
- **Cache Bust for Stale UI:** Bumped service worker cache key to `sydney-story-v4-sveltekit` so old cached shells (including stale key-entry UI) are invalidated on refresh.

## [Unreleased] - 2026-02-05

### Changed

- **Narrative Context:** Added app-owned `NarrativeContext` building with hard budget enforcement, older-scene compression, boundary/lesson/thread narrative translations, and context-mode prompt path.
- **Context Policy Update:** Increased default context budget to `12000` chars and changed truncation policy to preserve the last two full scenes plus lesson/boundary/thread narrative lines; only older compressed summaries are now trimmed.
- **Prompt Hardening:** Added Trina behavior examples to `SYSTEM_PROMPT`, introduced generalized thread-state narrative lines, boundary-specific translation mapping, and 17-line lesson-history mapping.
- **Transition Bridges:** Moved transition-bridge enforcement to same-turn generation checks using current-scene `storyThreadUpdates` (instead of one-turn-late pending bridge injection).
- **Telemetry Guardrails:** Added context-size/truncation/transition usage telemetry and payload sanitization/redaction to prevent key/token leakage.
- **Contracts + App Flow:** Added `NarrativeContext` contract validation; app now builds/passes validated context through a provider compatibility seam.
- **Feature Flag Operations:** Added runtime feature-flag normalization plus localStorage/query override support so `narrativeContextV2` and `transitionBridges` can be toggled without code edits.
- **Lesson Nullability:** Updated structured response schema so `lessonId` can be `null` (matching prompt and contract intent).
- **Tests:** Expanded integration coverage with T1-T4 narrative-upgrade gates (prompt assets, context contract/budget, transition-only-on-jump behavior, telemetry redaction).
- **Auth Bypass Control:** Added non-production `AI_AUTH_BYPASS` handling so auth failures can intentionally route through mock fallback during local/preview debugging while remaining blocked in production.
- **Opening Fallback Parity:** Added opening-scene fallback in runtime start flow so first-turn AI failures degrade to playable mock mode instead of hard-stopping.
- **Provider Prompt Context:** Updated Grok provider prompt construction to include `NarrativeContext` sections (recent prose, lesson history, thread/boundary lines, transition bridge) for stronger continuity.
- **Image Reliability Hardening:** Added timeout/retry handling and guardrail enforcement to Grok image generation path, plus typed route error status mapping.
- **E2E Reliability Expansion:** Added endpoint coverage for image guardrail rejection and AI-mode opening request playability.
- **E2E Regression:** Added Playwright coverage proving transition bridges are requested in the same turn as a detected thread jump, and aligned telemetry stage contract assertions with current AI instrumentation.
- **Prompt Regression:** Added coverage that enforces prompt instructions to label `lessonId` only after scene writing (system + legacy + context prompt paths).
- **Prompt Depth:** Expanded lesson payload in `SYSTEM_PROMPT` formatting to include per-lesson emotional stakes, common triggers, and unconventional angle (in addition to title/quote/insight).
- **Continuity Language:** Replaced stale `laptop` continuity anchor with `phone/phones/popsocket` anchors in provider quality checks.
- **Voice Anchors:** Added two high-signal narrative lines to `SYSTEM_PROMPT` as explicit voice-ceiling examples so model tone targets stay sharp across generations.

## [Unreleased] - 2026-02-03

### Changed

- **Character Overhaul:** Renamed "Marcus" to "Oswaldo" throughout the codebase, prompts, and assets. Oswaldo is now defined as more actively toxic (gaslighting, weaponized incompetence) rather than just lazy.
- **Narrative Logic:** Shifted core motivation metaphor from "Trapped by Empathy" to "Sunk Cost/Double Down". Sydney stays because calling it quits means admitting she was wrong.
- **Visual Style:** Pivoted from pixel-art experiments back to the original digital painting style. Added 3 new Sydney-centric scenes: `sydney_phone`, `sydney_coffee`, `sydney_window`.
- **Ending System:** Replaced 4 fixed ending types with a dynamic system. AI generates custom 1-3 word poetic endings (e.g., "Cold Clarity").
- **Contracts:** Updated `ImageKeys` to focus on Sydney's perspective. Removed generic setting keys.

### Added

- **Writing Craft Rules:** System prompt now includes specific instructions for "Show Don't Tell", "Sensory Grounding", and "Voice" to reduce AI-sounding prose.
- **Validation:** Added `validateEndingType` in `contracts.js` to support custom endings while preventing garbage output.
- **Schema:** Implemented strict JSON `responseSchema` in the legacy AI service for reliability.
- **Assets:** 5 new generated images in `images/`.

### Fixed

- **Testing:** Fixed smoke tests to align with new Oswaldo character and image keys. All tests passing.
- **Ending UX:** Endings no longer auto-jump to recap mid-typewriter. Players now click `View Recap` after ending text completes.
- **Lesson Timing:** Lesson insight popup now appears only after scene text has finished typing.
- **Regression Coverage:** Added renderer + e2e checks for delayed lesson display and recap transition/copy/download flow.
