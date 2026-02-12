# AI Lessons Learned

## 1. Visual Consistency Matters More Than Style

**Mistake:** I attempted to generate pixel-art images because I assumed a retro-indie aesthetic. This clashed with the existing digital painting style assets.
**Lesson:** Always check existing assets (`images/`) before generating new ones. Use `ImagePaths` reference in `generate_image` to enforce style consistency.

## 2. Character Depth Requires Toxicity

**Insight:** A "lazy" boyfriend is annoying. A "gaslighting" boyfriend who believes his own lies ("I help with the ENERGY") is tragic.
**Lesson:** Specificity in negative traits creates higher stakes. Renaming "Marcus" to "Oswaldo" helped break the AI's previous training bias towards a generic "lazy bf" archetype.

## 3. The "Doubling Down" Metaphor

**Insight:** "Empathy" is a soft motivation that makes the protagonist look weak. "Refusing to admit a mistake" (Sunk Cost) is a hard motivation that makes the protagonist look stubborn/flawed but strong.
**Lesson:** Give the protagonist a selfish reason for their altruism to make them more complex.

## 4. Prompt Engineering vs. Craft

**Insight:** AI defaults to cheesy summaries ("Sydney felt sad").
**Lesson:** Explicit "Writing Craft" rules in the system prompt (Show Don't Tell, Sensory Grounding) drastically improve prose quality. Adding "Voice" constraints (dry, exhausted) stops the AI from being too cheerful.

## 5. Voice Ceiling Anchors Beat Generic Style Notes

**Insight:** General style directives ("be gritty", "dark humor") help, but specific high-quality exemplar lines set a clearer target for model tone.
**Lesson:** Keep 1-3 canonical "voice ceiling" lines in the system prompt so generation quality regresses less over long playthroughs and prompt edits.

## 6. Separate Framework Migration From Provider Migration

**Insight:** Moving UI/runtime framework and swapping AI providers in the same phase multiplies unknowns and slows debugging.
**Lesson:** Keep framework migration mock-first, lock test gates, then switch providers against a stable contract seam.

## 6. Generalize State, Specialize Character Examples

**Insight:** If thread-state translations include concrete incidents, the model can treat those incidents as already happened facts and drift continuity.
**Lesson:** Keep state translations emotionally general; put concrete incidents (e.g., Trina snack-cake/catfish/referral beats) in character-example sections where they inform voice without forcing timeline facts.

## 7. Context Budgets Need Deterministic Truncation

**Insight:** "Last two full scenes plus summaries" still overruns context unless truncation order is explicit.
**Lesson:** Enforce a hard context cap with deterministic drop order (older summaries first, then older recent prose, then optional line clipping) and test it directly.

## 8. Telemetry Is Only Useful If It Is Safe

**Insight:** Logging rich prompt/context payloads helps debugging but can accidentally leak keys or sensitive text.
**Lesson:** Emit only structural metrics (sizes/counts/flags), and sanitize telemetry payloads by redacting key/token/secret-like fields before any console/event emission.

## 9. Protect High-Signal Context Before Chasing Hard Caps

**Insight:** Aggressive trimming to force a strict context cap can quietly delete the exact continuity data that improves narrative quality.
**Lesson:** Preserve high-signal context first (last 2 full scenes, lesson history, boundary/thread narrative lines) and trim lower-signal history summaries instead.

## 10. Transition Bridges Must Be Enforced in the Same Turn

**Insight:** Detecting thread jumps only after scene application creates one-turn-late bridge guidance and makes shift beats feel delayed.
**Lesson:** Detect jumps from current-scene `storyThreadUpdates` and enforce bridge rewrites in the same generation cycle when needed.

## 11. Feature Flags Need an Operations Path

**Insight:** Hardcoded feature flags force code edits and redeploys for tuning and rollback decisions.
**Lesson:** Normalize flags at runtime and allow safe overrides through controlled inputs (persistent storage and explicit query keys).

## 12. Unsolicited Process Critique: We Still Mix Delivery with Discovery

**What haters would say:** "You keep proving fixes in tests, but you still do too much discovery while shipping. That's how scope creep sneaks in."
**Lesson:** Freeze scope per phase up front, and track every "nice-to-have" separately so implementation commits stay purpose-pure.

## 13. Unsolicited Process Critique: Worktree Noise Hides Real Risk

**What haters would say:** "Your branch always has unrelated local files, so nobody can tell what actually changed for the feature."
**Lesson:** Keep local noise out of feature diffs:
- use `git status --short` before every commit
- commit only explicit file lists
- maintain local ignore rules (`.git/info/exclude`) for personal artifacts instead of polluting tracked ignores
- never include unrelated files in phase commits, even when tests are passing

## 14. First-Turn Reliability Must Match Mid-Turn Reliability

**Insight:** A robust fallback path in `handleChoice()` is not enough if `startGame()` can still hard-fail on the very first provider call.
**Lesson:** Apply identical fallback semantics to opening-scene generation so playability invariants hold from turn zero.

## 15. Auth Bypass Can Be Useful, But It Must Be Contained

**Insight:** Temporary auth bypass speeds local debugging, but if it leaks into production it can mask broken secrets and delay incident detection.
**Lesson:** Gate bypass behind explicit env, block it in production, and emit telemetry whenever bypass is used.

## 16. Provider Prompts Need the Same Narrative Context as Runtime

**Insight:** Building `NarrativeContext` but not injecting it into provider prompts silently degrades continuity while all schema checks still pass.
**Lesson:** Enforce context-to-prompt wiring tests so continuity assets are always consumed by the active provider path.

## 17. If Product Chooses "Burn the Boats," Enforce It in Code, Not Just Env

**Insight:** Leaving mock fallback branches available while saying "Grok-only" creates split-brain runtime behavior and confusion during incidents.
**Lesson:** When hard-fail is the product decision, disable mock runtime selection, block fallback outage modes, and make tests assert explicit provider errors instead of implicit fallback playability.

## 18. Demo Confidence Needs a Runtime Indicator, Not a Gut Feel

**Insight:** Teams lose time asking "are we demo-ready?" when readiness is spread across env vars, docs, and memory.
**Lesson:** Expose a small readiness API + UI progress card with weighted checks so demo risk is visible at a glance.

## 19. Remove Dead Credential UX Once Server-Side Secrets Are Required

**Insight:** Keeping a browser API-key input after moving to server-only env auth creates false debugging paths and user confusion.
**Lesson:** When provider auth is server-only, delete client key entry/persistence flows and replace them with explicit hard-fail guidance tied to environment setup.

## 20. Keep Legacy Findings Out of Active Incident Triage

**Insight:** Security/reliability reports against legacy files can look urgent even when those paths are not part of the running stack.
**Lesson:** Reconcile findings into `ACTIVE` vs `LEGACY` quickly, fix active issues immediately, and attach legacy findings to a decommission checklist so the team does not lose focus.

## 21. CSP in SvelteKit Must Account for Hydration Bootstrap

**Insight:** A strict `script-src 'self'` CSP can silently break SvelteKit client hydration because startup bootstrapping may include inline script content.
**Lesson:** Roll out CSP with runtime verification (SSR + hydrated UI + e2e interaction tests), and prefer incremental hardening over “max strict” policies that disable app behavior.

## 22. Debug Surfaces Should Degrade Gracefully When Storage Fails

**Insight:** Local debug tooling that depends only on localStorage can appear broken in privacy/quota-constrained contexts.
**Lesson:** Keep an in-memory fallback path so manual debug actions still produce visible feedback even when persistence is unavailable.

## 23. Behavior-Led Prose Holds Voice Better Than Label-Led Prose

**Insight:** Even when continuity state is correct, abstract status-label phrasing ("hostile", "tension high", "already learned") flattens scene output and invites generic model prose.
**Lesson:** Encode state lines as behavior with motive and social consequence. Keep prose lines as enacted observations, not diagnostic summaries.

## 24. Style Rules Must Live in Three Layers, Not One

**Insight:** A style guide in docs alone does not reliably shape output if translation maps and prompt task bullets still allow explanatory language.
**Lesson:** Apply voice constraints at all three layers:
1. reference docs (north star),
2. prompt instructions,
3. state-translation strings injected into context.

## 25. Test Gates Must Follow the Active Runtime, Not Legacy Convenience

**Insight:** Keeping `npm test`/`npm run lint` pointed at legacy folders makes decommission work look incomplete forever and blocks objective progress.
**Lesson:** Align default gates with the live runtime first, and keep legacy checks as explicitly named transitional scripts (`*:legacy`) until deletion is complete.

## 24. Marker Guards Work Best When They Cover Every Runtime Code Root

**Insight:** A marker guard limited to `src/**` can still miss old code roots (`js/**`) that remain in the repo and reintroduce banned provider assumptions.
**Lesson:** Expand guard scope to every runtime code directory that still exists, then shrink scope only after those directories are fully deleted.

## 25. Narrative Assets Must Be Runtime-Reachable, Not Just Well-Written

**Insight:** High-quality prompt assets (voice maps, lesson history, transition bridges, recovery rules) have zero product value if the active provider path does not import them.
**Lesson:** Treat narrative parity as an integration contract:
- full `SYSTEM_PROMPT` must be wired in active provider code
- opening/continue/recovery prompt builders must be used in generation flow
- `NarrativeContext` must be built/passed at runtime
- sanity checks must enforce voice constraints (not only JSON shape)

## 26. No-Shortcut Type Hardening Prevents Quiet Prompt Regressions

**Insight:** `@ts-nocheck` and broad cast workarounds in narrative modules hide integration drift until runtime.
**Lesson:** Keep prompt/context modules strict-typed in `src` so function signatures, thread/context fields, and prompt wiring fail fast during `npm run check` instead of during live story generation.

## 27. Split Narrative CI Into Deterministic Gates and Subjective Scoring

**Insight:** Narrative quality has both objective failure modes (broken prompt wiring, missing context fields, banned phrasing) and subjective quality signals (voice strength, emotional resonance, novelty).
**Lesson:** Keep Tier 1 blocking checks deterministic and fixture-backed (`npm run test:narrative`), then layer subjective rubric scoring (Tier 2) as non-blocking CI artifacts so creative evaluation informs iteration without destabilizing release gates.

## 28. Never Import `$lib/server/*` From Client Runtime Modules

**Insight:** `gameRuntime` is consumed by browser routes; importing server-only modules into that path can pass static checks but fail at runtime/hydration with SvelteKit boundary errors.
**Lesson:** Keep context/transition helpers in browser-safe shared modules (`$lib/game/*` or `$lib/shared/*`) and reserve `$lib/server/*` for provider/routes-only code.

## 29. Gate UI Click Assertions Behind Hydration Readiness

**Insight:** SSR route markup can appear before client handlers bind, causing false-negative e2e failures when tests click immediately after heading visibility.
**Lesson:** Expose a tiny hydration-ready marker for interactive debug/admin surfaces and make e2e wait for it before click/assert sequences.

## 30. Remove Taste Heuristics, Keep Structural Guards

**Insight:** Regex-heavy voice policing (therapy-speak detectors, banned phrase lists, apology-loop counters, evasion regex) adds brittle false positives, fights prompt intent, and creates blind-retry loops where the provider gets no feedback about what was wrong.
**Lesson:** Keep sanity gates deterministic and structural only (text length, choice count, duplicate choices, word-count hard/soft limits). Let the system prompt and Tier 2 AI-evaluated scoring carry narrative taste enforcement — those surfaces are tunable without code changes and can explain *why* something fails, unlike a regex.

## 31. A "Hard Cap" Must Have a Final Deterministic Trim Path

**Insight:** Declaring a context budget is not enough if protected sections can silently push payload size beyond target.
**Lesson:** Enforce deterministic trim order to stay within budget (older summaries first, then controlled recent-prose clipping) and expose truncation metadata for observability.

## 32. Canonical Prompt Paths Reduce Drift Risk

**Insight:** Keeping both legacy and v2 continue-prompt paths doubles maintenance surface and creates flag-dependent narrative divergence.
**Lesson:** Use one canonical context-driven continue path in active runtime/provider flow; treat alternate prompt paths as temporary migration scaffolding only.

## 33. Parse Recovery Should Degrade to Typed Failure, Not Synthetic Story Content

**Insight:** When provider JSON is malformed, inventing a synthetic "fallback scene" may keep the app moving but can silently corrupt narrative continuity and hide provider defects.
**Lesson:** Prefer deterministic parse layers (robust extraction, one recovery prompt) and then fail with typed `invalid_response` errors. Keep UX recovery in the UI/runtime layer, not by manufacturing story content inside the provider adapter.

## 34. Side-Character Harm Needs an Explicit Operating Pattern

**Insight:** Labeling a character as "friend" or "chaotic" is too weak; the model defaults to generic banter unless the character's incentive loop and betrayal mechanics are concretely specified.
**Lesson:** For manipulative supporting characters, encode the operating model directly in the system prompt (what they want, how they earn trust, how they convert trust into harm). This keeps behavior consistent across scenes and prevents flattening into one-note archetypes.

## 35. Freeze Narrative Quality Floors With Phrase-Level Gates

**Insight:** Weak fallback strings (for missing or out-of-range thread states) quietly flatten output even when primary translation maps are strong.
**Lesson:** Put a blocking quality-floor suite in CI that rejects known weak fallback phrases and asserts high-signal replacements. This makes voice regressions visible at review time instead of after prose quality drops in live runs.

## 36. Model Variety Improves When Repetition Constraints Are Explicit

**Insight:** Even with strong voice instructions, scene openings can loop on the same conflict beat across adjacent turns.
**Lesson:** Add compact beat-memory (`recentBeats`) to narrative context and explicitly forbid reusing a recent opening beat unless thread state escalation justifies it. This keeps continuity while forcing structural variety.

## 37. Manipulation Arcs Need Stateful Tracking, Not Prompt-Only Description

**Insight:** Describing Dex as two-faced in the system prompt improves tone but does not guarantee consistent escalation across turns.
**Lesson:** Track manipulative dynamics as their own thread dimension (`dexTriangulation`) so updates can accumulate and future scenes can react to concrete state instead of re-inferring from scratch each turn.

## 38. Ending Palettes Need Explicit Polarity Constraints

**Insight:** If ending guidance only describes structure (loop/shift/exit/rare) but not emotional polarity, the model can drift toward unearned hopeful resolution.
**Lesson:** State ending polarity directly in prompt instructions (for this project: bad-to-uneasy only, no clean wins) and reinforce it inside each ending steering branch.
