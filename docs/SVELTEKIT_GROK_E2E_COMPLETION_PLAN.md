# SvelteKit + Grok End-to-End Completion Plan

Date: 2026-02-07  
Scope: complete delivery path from migrated SvelteKit runtime to Grok-backed story + image generation, with reliability-first gates.

## Done Definition

1. SvelteKit routes are the active UX (`/`, `/settings`, `/play`, `/ending`).
2. Story + image APIs run server-side via Grok with mock fallback preserving playability.
3. Non-negotiables hold: bounded recovery, no secret leaks, accessibility continuity, image/content guardrails.
4. `npm run lint`, `npm test`, `npm run test:e2e`, and `npm run build` pass on release candidate.
5. Preview deployment passes full playthrough + recap smoke.

## Phase Plan

## Phase 0 - Baseline Lock + Acceptance Contract
Goal: freeze what "correct" means before changing implementation.

Execution order:
- Contract: define acceptance checks for routing, scene continuity, fallback continuity, recap, and guardrails.
- Probe: run baseline smoke playthrough and collect current failure list.
- Tests: run `npm run lint`, `npm test`, `npm run test:e2e` to establish baseline.
- Mock: n/a.
- Actual: n/a.

Exit gate:
- Baseline evidence logged; blocker list prioritized.

What haters would say:
- "You are planning against vibes, not measurable acceptance."

Revisions/actions:
- Convert each acceptance point into a named test/smoke check before Phase 1 starts.

## Phase 1 - SvelteKit Runtime Stabilization (Mock-Only)
Goal: make SvelteKit route flow stable before provider cutover.

Execution order:
- Contract: define route responsibilities and typed state transitions.
- Probe: verify navigation and hydration behavior in dev + preview mode.
- Tests: route smoke + state transition tests + existing suites.
- Mock: make mock story service the default runtime path.
- Actual: connect migrated runtime/store wiring only after mock path is green.

Exit gate:
- Mock full playthrough works end-to-end in SvelteKit routes.

What haters would say:
- "You changed framework and behavior simultaneously; regressions are hidden."

Revisions/actions:
- Enforce mock-only mode for this phase; reject any Grok network dependency in CI.

## Phase 2 - Provider Seam + Grok Connectivity Probe
Goal: introduce provider contract and validate Grok availability without gameplay coupling.

Execution order:
- Contract: lock provider interface, typed error taxonomy, and config validation rules.
- Probe: implement server probe for auth/model availability/latency.
- Tests: contract conformance tests (mock + grok adapters), config fail-closed tests, probe schema tests.
- Mock: run gameplay strictly on mock adapter via the new seam.
- Actual: add Grok adapter skeleton + probe-only real calls.

Exit gate:
- Probe passes in preview; gameplay remains mock-backed and stable.

What haters would say:
- "Your seam is fake if gameplay still bypasses it somewhere."

Revisions/actions:
- Add a test that fails if routes/services import provider SDK directly.

## Phase 3 - Story Text Cutover (Mock -> Actual Grok)
Goal: switch story generation to Grok while preserving bounded recovery and fallback playability.

Execution order:
- Contract: lock `Scene` schema, retry bounds, fallback policy, and incompatible-scene handling.
- Probe: single-step story generation probe validating schema + invariants.
- Tests: parser recovery bounds, retry/backoff bounds, fallback continuity, recap integrity.
- Mock: first run all story endpoints through seam with forced mock mode.
- Actual: enable Grok for text generation behind config flag; keep outage mode explicit.

Exit gate:
- Grok text mode passes integration/e2e and fallback mode remains playable.

What haters would say:
- "One bad model response still breaks flow; your fallback is theater."

Revisions/actions:
- Add chaos tests injecting malformed/empty/timeout responses and assert no forced dead-end.

## Phase 4 - Image Path Cutover + Content Guardrails
Goal: deliver Grok image generation while enforcing visual and safety constraints.

Execution order:
- Contract: lock image request/response schema and guardrail policy (including prohibited depictions).
- Probe: image endpoint probe with policy enforcement results.
- Tests: guardrail tests, prompt-policy tests, fallback image tests.
- Mock: keep deterministic placeholder image path in CI/offline mode.
- Actual: enable Grok image model via server endpoint with policy gate before return.

Exit gate:
- Guardrails pass in tests; image failures degrade gracefully to approved fallback.

What haters would say:
- "Image rules are in docs, not enforced in code."

Revisions/actions:
- Require policy check in endpoint path and add explicit failing tests for prohibited outputs.

## Phase 5 - Reliability Hardening + Release Candidate
Goal: convert working behavior into release confidence.

Execution order:
- Contract: define release SLO checks (startup, response latency budget, retry ceilings, error UX).
- Probe: run targeted reliability probes in preview.
- Tests: full gate (`lint`, `test`, `test:e2e`, `build`) plus outage-mode matrix.
- Mock: verify forced-mock mode still supports complete demo.
- Actual: validate Grok-enabled mode under same scenarios.

Exit gate:
- Full gate green; no P0/P1 reliability gaps.

What haters would say:
- "You only tested happy path in one environment."

Revisions/actions:
- Add outage-mode matrix (provider down, timeout, 429, malformed payload) to CI checklist.

## Phase 6 - Deploy, Verify, and Rollback Readiness
Goal: ship safely with proof and rollback clarity.

Execution order:
- Contract: publish release checklist + rollback trigger criteria.
- Probe: verify preview/prod env wiring and key presence without exposing secrets.
- Tests: post-deploy smoke (start -> choices -> ending -> recap, text+image path).
- Mock: verify forced-mock toggle in deployed env.
- Actual: verify Grok mode in deployed env with probe and smoke.

Exit gate:
- Deployment verified, rollback steps tested, handoff completed.

What haters would say:
- "You can deploy, but you cannot recover quickly when Grok fails."

Revisions/actions:
- Add one-click config rollback path (`mock_fallback`) and document trigger/runbook before go-live.

## Cross-Phase Operating Rules

1. Commit per phase, push only after that phase gate passes.
2. Mandatory phase critique question: `What would a group of haters say about the work I just did?`
3. No phase closes without explicit revision/action updates from critique.
4. Stop and ask on invariant conflict, backward-compat break risk, or unexpected external edits in touched files.
