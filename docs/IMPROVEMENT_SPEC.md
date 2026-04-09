# Improvement Spec — No Vacancies

> **Purpose:** This document is an actionable spec for an implementation agent.
> Each item below is a self-contained, scoped change. Implement them in order.
> Run `npm run lint && npm run check && npm test && npm run test:unit` after each item.
> Do not change unrelated code. Do not delete existing tests.

---

## Item 1 — Fix: `MemoryRateLimitStore` memory leak

**File:** `src/lib/server/rateLimit/memoryStore.ts`

**Problem:**  
The `counters: Map<string, CounterEntry>` grows without bound. An expired entry is only
replaced when the *same* IP makes a new request. Any IP that hits the server once and never
returns stays in memory forever. On a long-running server, this is a steady memory leak.

**Fix:**  
In `consume()`, after the existing expiry/reset branch (the `!current || now >= current.resetAt`
path), add a lazy GC sweep: iterate the map and delete any entry whose `resetAt <= now`. To
keep `consume()` O(n) only occasionally, only run the sweep when the map exceeds 500 entries.
Do **not** change the public `RateLimitStore` interface or test-reset helper.

**Test requirement:**  
Add a test to the **existing** `tests/unit/rateLimit/memoryStore.spec.ts` (do not create a new
file — one already exists) that:
1. Creates a store with `windowMs: 50`.
2. Adds 600 unique keys (loop with `consume('key_N')`).
3. Waits 60 ms (all entries now expired).
4. Calls `consume('trigger')` to force the sweep.
5. Asserts that the internal map size has shrunk (use `(store as any).counters.size`).

---

## Item 2 — Fix: Remove duplicate and inaccurate telemetry in `resolveTextScene`

**File:** `src/lib/server/ai/routeHelpers.ts`

**Problem:**  
`resolveTextScene` emits a `story_scene` telemetry event with hardcoded
`retryCount: 0` and `parseAttempts: 1`:

```ts
emitAiServerTelemetry('story_scene', {
    provider: provider.name,
    mode,
    requestId: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    retryCount: 0,
    parseAttempts: 1,
    route: mode
});
```

The actual retry and parse counts are already emitted correctly as `provider_chat` by
`GrokAiProvider.callChat()` inside `grok.ts`. The `story_scene` event is therefore a
duplicate with wrong values — it misrepresents actual performance.

**Fix:**  
Delete the entire `emitAiServerTelemetry('story_scene', ...)` call from `resolveTextScene`.
The `provider_chat` event from inside the provider already covers this. No other changes needed.

**Test requirement:**  
Update the **existing** `tests/unit/routeHelpers.spec.ts` to confirm that `resolveTextScene`
no longer emits a `story_scene` event. Use `setAiTelemetrySink` from
`$lib/server/ai/telemetry` to capture events and assert none have `stage === 'story_scene'`.

⚠️ **Determinism note:** `resolveTextScene` calls `loadAiConfig()` internally which requires
`XAI_API_KEY`. In a test environment without a real key, `loadAiConfig()` will throw before
any network call occurs. The test should wrap the call in a `try/catch` (the throw is
expected), then assert that no `story_scene` event was captured. This ensures the test is
fully deterministic with no live network calls and no flakiness in CI.

---

## Item 3 — Add: Unit tests for `transport.ts`

**File (new):** `tests/unit/grok/transport.spec.ts`

**Problem:**  
`src/lib/server/ai/providers/grok/transport.ts` is the only Grok submodule without unit
tests. It handles the full HTTP request lifecycle: timeouts, auth errors, rate-limit
responses, server errors, and generic failures.

**Fix:**  
Create `tests/unit/grok/transport.spec.ts` using `@playwright/test`. Import
`executeJsonRequest` from `../../../src/lib/server/ai/providers/grok/transport`.
Use a fake `fetchImpl` to simulate each scenario.

Cover these cases:

| Test case | `fetchImpl` behavior | Expected result |
|---|---|---|
| Successful response | `ok: true`, returns `{ data: 'ok' }` | resolves with `{ data: 'ok' }` |
| 401 Unauthorized | `ok: false`, `status: 401` | throws `AiProviderError` with `code: 'auth'`, `status: 401`, `retryable: false` |
| 403 Forbidden | `ok: false`, `status: 403` | throws `AiProviderError` with `code: 'auth'`, `status: 403`, `retryable: false` |
| 429 Rate Limit | `ok: false`, `status: 429` | throws `AiProviderError` with `code: 'rate_limit'`, `retryable: true` |
| 503 Server Error | `ok: false`, `status: 503` | throws `AiProviderError` with `code: 'provider_down'`, `retryable: true` |
| AbortError timeout | `fetch` throws `Object.assign(new Error('aborted'), { name: 'AbortError' })` | throws `AiProviderError` with `code: 'timeout'`, `retryable: true`, `status: 504` |
| Generic network error | `fetch` throws `new Error('socket hang up')` | throws `AiProviderError` with `code: 'unknown'`, `retryable: false` |

Use `requestTimeoutMs: 5000` for all tests. For the timeout case, `fetch` must throw an
actual `Error` instance with `name: 'AbortError'` (e.g.,
`Object.assign(new Error('aborted'), { name: 'AbortError' })`), because `executeJsonRequest`
checks `error instanceof Error && error.name === 'AbortError'`. A plain object
`{ name: 'AbortError' }` will not match the `instanceof Error` guard and will be treated as
a generic network error instead.

---

## Item 4 — Fix: Validate `storyThreadUpdates` from AI before applying to game state

**File:** `src/lib/server/ai/providers/grok/sceneNormalizer.ts`

**Problem:**  
When the AI returns `storyThreadUpdates`, it's cast directly:

```ts
storyThreadUpdates:
    candidate.storyThreadUpdates && typeof candidate.storyThreadUpdates === 'object'
        ? (candidate.storyThreadUpdates as Partial<StoryThreads>)
        : null
```

No field-level validation is performed. Unknown keys or wrong value types from the AI
(e.g., `{ "exhaustionLevel": "very tired" }`) pass through unchecked and can corrupt the
`StoryThreads` state in `gameRuntime`.

**Fix:**  
Add a `sanitizeStoryThreadUpdates` function in `sceneNormalizer.ts` (not exported — internal
only). It must:
- Accept `unknown` input.
- Build a clean `Partial<StoryThreads>` by checking each known key:
  - `oswaldoConflict`, `trinaTension`, `sydneyRealization`, `oswaldoAwareness`,
    `exhaustionLevel`, `dexTriangulation`: only copy if value is a finite `number`.
  - `moneyResolved`, `carMentioned`: only copy if value is a `boolean`.
  - `boundariesSet`: only copy if value is an `Array` where every element is a `string`.
- Return `null` if the result has no valid keys (i.e., all fields were malformed).
- Drop any key not in `StoryThreads` silently (no throw).

Replace the existing cast in `normalizeSceneCandidate` with a call to this function.

**Test requirement:**  
Add tests in `tests/unit/grok/sceneNormalizer.spec.ts`:
1. `storyThreadUpdates` with valid numeric/boolean/array fields → all values preserved.
2. `storyThreadUpdates` where `exhaustionLevel` is a string → field dropped, others kept.
3. `storyThreadUpdates` where an unknown key is present → key dropped silently.
4. `storyThreadUpdates` that is entirely malformed (all wrong types) → result is `null`.

---

## Item 5 — Fix: Make `retryBackoffMs` configurable via env var

**File:** `src/lib/server/ai/config.ts`

**Problem:**  
Every other timing parameter has an env-var override (`AI_REQUEST_TIMEOUT_MS`,
`AI_MAX_RETRIES`), but `retryBackoffMs` is hardcoded:

```ts
retryBackoffMs: [400, 1200]
```

This makes it impossible to tune retry pacing in staging/production without a code change.

**Fix:**  
Add parsing for a new optional env var `AI_RETRY_BACKOFF_MS` (comma-separated integer
milliseconds, e.g., `"400,1200"` or `"200,600,2000"`).

Rules:
- If unset or empty → use default `[400, 1200]`.
- Split on commas, trim whitespace, parse each as `parseInt`.
- Any value that is not a finite non-negative integer → fall back to the default silently.
- Cap at 4 values maximum (ignore extras beyond index 3).
- Each value is capped between 0 and 10 000 ms.

Return the parsed array (or default) as `retryBackoffMs` in the returned `AiConfig`.

Update `AiConfig` interface if needed (the type is already `number[]` — no change needed
there).

**Test requirement:**  
Add tests to `tests/unit/config.spec.ts`:
1. `AI_RETRY_BACKOFF_MS` unset → returns `[400, 1200]`.
2. `AI_RETRY_BACKOFF_MS=100,500` → returns `[100, 500]`.
3. `AI_RETRY_BACKOFF_MS=100,abc,500` → falls back to `[400, 1200]` (invalid entry).
4. `AI_RETRY_BACKOFF_MS=10,20,30,40,50` → returns only first 4: `[10, 20, 30, 40]`.
5. `AI_RETRY_BACKOFF_MS=0,20000` → values clamped to `[0, 10000]`.

---

## Item 6 — Fix: Dead `aiAuthBypass` field in `AiConfig`

**Files:** `src/lib/server/ai/config.ts`, `src/routes/api/demo/readiness/+server.ts`

**Problem:**  
`loadAiConfig` throws immediately if `AI_AUTH_BYPASS=true`:

```ts
const aiAuthBypass = parseBoolean(env.AI_AUTH_BYPASS, false);
if (aiAuthBypass) {
    throw new Error('AI_AUTH_BYPASS is disabled in Grok-only mode');
}
// ...
return { ..., aiAuthBypass, ... };  // always false
```

`aiAuthBypass` is always `false` in the returned config. The field is dead, but
`src/routes/api/demo/readiness/+server.ts` reads `config.aiAuthBypass` to compute a
readiness check. It always reports `ok: true` because the field is always false.

**Fix:**

1. In `config.ts`: Remove `aiAuthBypass` from the `AiConfig` interface and from the
   `loadAiConfig` return object. Keep the runtime guard (the `throw` if the env var is set)
   — that validation is still valuable. Just don't put the (always-false) result into the
   config struct.

2. In `demo/readiness/+server.ts`: Remove the check that reads `config.aiAuthBypass`.
   Replace it with a static check that always passes (since the config loader now guarantees
   it can never be enabled). For example:

   ```ts
   { id: 'auth_bypass_disabled', label: 'Auth bypass disabled', ok: true,
     details: 'Security controls active' }
   ```

**Test requirement:**  
Update `tests/unit/config.spec.ts`:
1. Confirm that the returned config from `loadAiConfig` does NOT include an `aiAuthBypass`
   property. Pass a valid env object: `loadAiConfig({ AI_PROVIDER: 'grok', AI_OUTAGE_MODE: 'hard_fail', XAI_API_KEY: 'test-key' })`.
   Note: calling `loadAiConfig({})` with no env vars will throw (because `XAI_API_KEY` is
   required) — always pass an explicit env object with all required fields.
2. Confirm that `loadAiConfig({ AI_AUTH_BYPASS: 'true', XAI_API_KEY: 'x', AI_OUTAGE_MODE: 'hard_fail' })` still throws.

---

## Quality Gates

After all items are implemented, run and confirm all pass:

```bash
npm run lint
npm run check
npm test
npm run test:unit
npm run build
```

If `npm run test:e2e` runs without a live server, skip it and note the block explicitly.

---

## Docs to Update

After implementing the above:

- `CHANGELOG.md`: Add an entry for this batch of reliability/correctness fixes.
- `AI_LESSONS_LEARNED.md`: Add a lesson about validating AI-supplied partial structs before
  applying them to game state (covers Item 4).
