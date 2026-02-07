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
