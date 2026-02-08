# Changelog

## [Unreleased] - 2026-02-07

### Changed

- **Demo Readiness Indicator:** Added Home-page visual readiness dashboard with weighted progress bar and checklist, backed by `/api/demo/readiness` runtime checks.
- **Readiness Edge Coverage:** Expanded e2e assertions for `/api/demo/readiness` to validate weighted check IDs, total score weighting, and blocked-vs-ready behavior when `XAI_API_KEY` is missing/present.
- **Grok-Only Runtime:** Disabled mock runtime fallback paths for story/image server routes; requests now fail fast when Grok is unavailable or misconfigured.
- **Outage Policy:** Restricted `AI_OUTAGE_MODE` to `hard_fail` in runtime config and rejected `mock_fallback`/`AI_PROVIDER=mock` for active app flow.
- **UX Lock-In:** Removed `Static Story` toggle from Svelte settings and pinned `/play` mode indicator to `AI Mode`.
- **Dead Client Key Flow Removed:** Deleted Settings-page API key input + session persistence path so runtime no longer implies browser-side key entry.
- **Hard-Fail UX Copy:** Added user-facing error mapping for common provider/config failures (missing key, auth, rate limit, timeout, provider down).
- **E2E Contract Shift:** Replaced mock-playthrough e2e assertions with Grok-only behavior checks (explicit error assertions when `XAI_API_KEY` is missing).
- **Canary Naming Cleanup:** Renamed live provider canary spec from `gemini-live.spec.js` to `grok-live.spec.js` and updated docs references.
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

## [Unreleased] - 2026-02-05

### Changed

- **Narrative Context:** Added app-owned `NarrativeContext` building with hard budget enforcement, older-scene compression, boundary/lesson/thread narrative translations, and context-mode prompt path.
- **Context Policy Update:** Increased default context budget to `12000` chars and changed truncation policy to preserve the last two full scenes plus lesson/boundary/thread narrative lines; only older compressed summaries are now trimmed.
- **Prompt Hardening:** Added Trina behavior examples to `SYSTEM_PROMPT`, introduced generalized thread-state narrative lines, boundary-specific translation mapping, and 17-line lesson-history mapping.
- **Transition Bridges:** Moved transition-bridge enforcement to same-turn generation checks using current-scene `storyThreadUpdates` (instead of one-turn-late pending bridge injection).
- **Telemetry Guardrails:** Added context-size/truncation/transition usage telemetry and payload sanitization/redaction to prevent key/token leakage.
- **Contracts + App Flow:** Added `NarrativeContext` contract validation; app now builds/passes validated context to Gemini service through a compatibility seam.
- **Feature Flag Operations:** Added runtime feature-flag normalization plus localStorage/query override support so `narrativeContextV2` and `transitionBridges` can be toggled without code edits.
- **Lesson Nullability:** Updated Gemini structured response schema so `lessonId` can be `null` (matching prompt and contract intent).
- **Tests:** Expanded integration coverage with T1-T4 narrative-upgrade gates (prompt assets, context contract/budget, transition-only-on-jump behavior, telemetry redaction).
- **Auth Bypass Control:** Added non-production `AI_AUTH_BYPASS` handling so auth failures can intentionally route through mock fallback during local/preview debugging while remaining blocked in production.
- **Opening Fallback Parity:** Added opening-scene fallback in runtime start flow so first-turn AI failures degrade to playable mock mode instead of hard-stopping.
- **Provider Prompt Context:** Updated Grok provider prompt construction to include `NarrativeContext` sections (recent prose, lesson history, thread/boundary lines, transition bridge) for stronger continuity.
- **Image Reliability Hardening:** Added timeout/retry handling and guardrail enforcement to Grok image generation path, plus typed route error status mapping.
- **E2E Reliability Expansion:** Added endpoint coverage for image guardrail rejection and AI-mode opening request playability.
- **E2E Regression:** Added Playwright coverage proving transition bridges are requested in the same turn as a detected thread jump, and aligned telemetry stage contract assertions with current AI instrumentation.
- **Prompt Regression:** Added coverage that enforces prompt instructions to label `lessonId` only after scene writing (system + legacy + context prompt paths).
- **Prompt Depth:** Expanded lesson payload in `SYSTEM_PROMPT` formatting to include per-lesson emotional stakes, common triggers, and unconventional angle (in addition to title/quote/insight).
- **Continuity Language:** Replaced stale `laptop` continuity anchor with `phone/phones/popsocket` anchors in Gemini quality checks.
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
- **Schema:** Implemented strict JSON `responseSchema` in `geminiStoryService.js` for reliability.
- **Assets:** 5 new generated images in `images/`.

### Fixed

- **Testing:** Fixed smoke tests to align with new Oswaldo character and image keys. All tests passing.
- **Ending UX:** Endings no longer auto-jump to recap mid-typewriter. Players now click `View Recap` after ending text completes.
- **Lesson Timing:** Lesson insight popup now appears only after scene text has finished typing.
- **Regression Coverage:** Added renderer + e2e checks for delayed lesson display and recap transition/copy/download flow.
