# AGENTS.md (js/services/)

Scope: `js/services/`.

## Purpose

Maintain robust AI/service behavior under malformed output, network failures, and provider drift.

## Reliability Rules

- All external responses must be parsed and validated before use.
- Retry/repair behavior must be bounded and deterministic.
- Fallback behavior must preserve playability and continuity.
- Timeouts must produce clear typed errors.
- Telemetry stage names should remain stable unless intentionally versioned.

## Security Rules

- Never log API keys, request secrets, or sensitive user data.
- Exported recap or diagnostics must not leak credential material.

## Architecture Rules

- Service modules must not touch the DOM.
- Keep request wrappers and transformation logic testable via dependency injection/mocks.
- Favor small pure helpers for formatting, parsing, and normalization.

## Testing Expectations

- Any bug fix in services adds at least one regression test.
- New parsing paths require malformed-input tests.
- New fallback paths require explicit branch coverage.
