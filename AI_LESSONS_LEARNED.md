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
