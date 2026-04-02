# CLAUDE.md — src/lib/server/ai/

Directory-specific reference for the AI provider layer. Extends root `CLAUDE.md` and `AGENTS.md`.

> **Server-only boundary.** Nothing in this directory may be imported from client-side code.
> This is silent in `npm run dev` — it fails only at `npm run build`. Always build-verify changes here.

---

## What This Directory Does

| File | Role |
|------|------|
| `config.ts` | Parse + validate env vars — **throws on misconfiguration**, never returns null |
| `sanity.ts` | Structural validators — word count, choice count, JSON shape, duplicates **only** |
| `narrative.ts` | Prompt assets — imports canonical helpers from `src/lib/game/narrativeContext.ts` |
| `providers/grok.ts` | Grok API adapter — chat, JSON extraction, two-stage parse recovery, retry |
| `guardrails.ts` | Content safety gates |
| `telemetry.ts` | Structural metrics only — sanitizes key/token-like strings before any emission |
| `builder.ts` | Story draft generation |
| `lessons.ts` | Lesson narrative generation |
| `routeHelpers.ts` | Shared API route helpers |

---

## `loadAiConfig()` Throw Conditions

`src/lib/server/ai/config.ts` throws `Error` (not returns null) on:

- `AI_PROVIDER=mock` — mock provider is disabled
- `AI_OUTAGE_MODE=mock_fallback` — mock fallback is disabled
- `AI_AUTH_BYPASS=true` (any truthy value) — disabled in Grok-only mode
- `XAI_API_KEY` missing when Grok text, images, or probe are enabled
- `AI_OUTAGE_MODE` missing in prod-like env (`VERCEL_ENV=production|preview` or `NODE_ENV=production`)

These surface as unhandled 500 errors from any route that touches AI. Misconfiguration is a startup failure.

---

## Scene Generation Constraints (exact values — sanity.ts)

| Constraint | Soft (retryable) | Hard (blocking) |
|------------|-----------------|----------------|
| Scene word count | > 280 words | > 350 words |
| Ending word count | > 370 words | > 450 words |
| Scene text length | — | < 80 chars |
| Choices (non-ending) | — | < 2 or > 3 |
| Duplicate choice text | — | any match (normalized) |

Retry backoff: `[400ms, 1200ms]`. Blocking → reject immediately. Retryable → one retry, then fail typed.

**`sanity.ts` rule:** Structural guards only — word count, choice count, JSON shape, duplicate choices. No taste heuristics. No banned-phrase lists. No therapy-speak detectors. Ever.

---

## Parse Recovery Contract

`providers/grok.ts` uses a strict two-stage parse path:
1. Standard JSON extraction (fenced blocks + balanced object scanning)
2. One recovery prompt on extraction failure
3. → typed `invalid_response` failure

**Never manufacture a synthetic fallback scene.** Parse failure must surface as a typed error. UI/runtime handles the user-facing degradation.

---

## Telemetry Rule

`telemetry.ts` sanitizes payloads before emission — any key matching `/api.?key|secret|token|authorization|password/i` is redacted to `[REDACTED]`. Do not double-redact. Do not log prompt content or response text. Emit only structural metrics: sizes, counts, flags, timing.

---

## Retry Defaults

From `config.ts` line 97: `retryBackoffMs: [400, 1200]`

- `maxRetries`: default `2`, range `0–5`
- `requestTimeoutMs`: default `20000ms`, range `5000–60000ms`
- `maxOutputTokens`: default `1800`, range `200–3200`

---

## Stop Conditions → see `src/lib/server/ai/AGENTS.md`
