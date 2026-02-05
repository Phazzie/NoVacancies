# AGENTS.md (js/)

Scope: `js/` and subfolders unless a deeper `AGENTS.md` overrides.

## Purpose

Keep core game logic deterministic, contract-driven, and easy to test.

## Module Boundary Rules

- `app.js`: orchestration/state transitions/event wiring only.
- `renderer.js`: DOM/UI rendering only.
- `contracts.js`: type contracts, validators, creators.
- `prompts.js`: prompt templates/heuristics, no network calls.
- `services/*`: API/service integrations and pure helpers; no direct DOM work.

## Change Rules

- Contract changes in `contracts.js` require test updates in `tests/`.
- Prompt/heuristic changes require integration tests that prove behavior change.
- Reliability path changes (fallback, retry, timeout, parse recovery) require explicit regression coverage.
- Prefer pure helper functions for complex logic; isolate side effects.

## Invariants

- Scene data must be validated before apply/render.
- `storyThreadUpdates` handling must remain merge-safe and partial-update safe.
- Ending inference must avoid broad token false positives.

## Do Not

- Mix UI concerns into services.
- Bypass validators for convenience.
- Add hidden global state without tests.
