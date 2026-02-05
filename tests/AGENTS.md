# AGENTS.md (tests/)

Scope: `tests/` and subfolders unless deeper file overrides.

## Purpose

Guarantee regression resistance with deterministic, meaningful tests.

## Test Design Rules

- Prefer deterministic tests over timing-dependent behavior.
- Use clear Arrange/Act/Assert structure.
- Test names should describe behavior, not implementation details.
- Every bug fix should include a regression test in the closest relevant suite.

## Reliability Rules

- Do not depend on live network by default in standard test runs.
- Avoid flaky sleeps; use explicit state checks/timeouts.
- Keep test fixtures minimal and readable.

## Coverage Priorities

1. AI error handling and fallback paths
2. Contract/validation boundaries
3. State transitions and persistence edge cases
4. Renderer/accessibility behavior

## Maintenance Rules

- If a suite becomes obsolete, archive/remove it with rationale in `CHANGELOG.md`.
- Keep `npm test` representative of core quality gates.
