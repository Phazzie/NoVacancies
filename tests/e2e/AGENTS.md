# AGENTS.md (tests/e2e/)

Scope: Playwright and end-to-end tests.

## Purpose

Validate user-visible reliability for demo-critical flows.

## Execution Rules

- Use local static serving for app boot (no `file://` module loading).
- Respect env-configured host/port (`E2E_HOST`, `E2E_PORT`) where supported.
- Keep live-provider tests opt-in and clearly gated (for example, `LIVE_GEMINI=1`).

## Test Content Rules

- Cover happy path + one failure/recovery path for each critical flow.
- Keep assertions user-centered (what user sees/can do).
- Explicitly document when sandbox/environment constraints block execution.

## Flake Control

- Avoid brittle timing assumptions.
- Prefer stable selectors and deterministic setup.
- If retries are used, note why and keep count minimal.

## Reporting

- For failures, include reproduction command and likely environment requirement.
