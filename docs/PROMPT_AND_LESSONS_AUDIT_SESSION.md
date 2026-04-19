# AI Prompt Optimization & Lesson Architecture Review

**Status:** Questions for next investigation session  
**Priority:** High — Direct impact on story quality  
**Assign to:** Claude Agent (Haiku or Sonnet) for autonomous investigation

---

## Part 1: AI Prompt Analysis (Priority)

### 1.1 System Prompt Audit
Read `src/lib/stories/no-vacancies/prompts.ts` lines 57-369 (SYSTEM_PROMPT).

**Questions to answer:**
- Which character behavior rules are being followed consistently by the AI?
- Which sections are causing the most AI drift (therapy-speak, abstract language, forced lessons)?
- Are the 10 voice ceiling examples actually being matched/imitated?
- Is the forbidden phrasing list actually preventing those patterns, or do they still appear?

**Evidence to gather:**
- Generate 3-5 identical game states and compare AI output for consistency against SYSTEM_PROMPT rules
- Flag any therapy-speak, evasion patterns, or forbidden phrases that appear
- Note which character behavior patterns (Oswaldo deflection, Trina entitlement, Dex triangulation) are present

### 1.2 Continue Prompt Audit
Read `src/lib/stories/no-vacancies/prompts.ts` lines 371-398 (`getContinuePromptFromContext` function).

**Questions to answer:**
- Is the narrative context formatted in a way that actually guides the AI toward continuity?
- Does "RECENT OPENING STRATEGIES" constraint prevent repetition, or do opening beats repeat anyway?
- Are "state-shift memory" integrations actually landing, or are they redundant?
- Are choice costs (money, dignity, relationship, safety, time) being honored in prose?

**Evidence to gather:**
- Compare scenes 3-4, 7-8, 12-13 from same playthrough for repetition patterns
- Check if player choices that cost money show financial consequences
- Check if player choices that set boundaries show relational backlash
- Note if "cost visibility in prose" rule is working

### 1.3 Specific Craft Checks

**Scene length:** Do generated scenes hit the 150-250 word target, or consistently over/under?

**Choice distinctness:** Are the 2-3 choices truly different strategies, or near-paraphrases? (e.g., "Confront him" vs "Call him out" = bad; "Confront him" vs "Protect your money" = good)

**Dark humor:** Is it showing up as coping mechanism (Sydney's dry observation of transactional dynamics)? Or does it feel forced/cruel?

**Sydney's voice:** Stays dry/exhausted/observant? Or drifts toward introspection, therapy-speak, feelings-validation?

**Recommendations expected:**
- If specific sections aren't landing, propose rewrites with examples
- If the prompt is unclear on a rule, clarify it with better wording
- Flag any sections that conflict with each other

---

## Part 2: Lessons System Architecture (Secondary)

### 2.1 Lesson Definitions & Coverage
Read:
- `src/lib/narrative/lessonsCatalog.ts` (all 17 lessons)
- `src/lib/stories/no-vacancies/prompts.ts` lines 244-249 (how lessons are formatted for AI)

**Questions to answer:**
- Are all 17 lessons defined with clear, concrete titles?
- Which lessons are triggered most often? Least often? Why?
- Do lesson titles/quotes/insights clearly explain what they're about?
- Is there a lesson that almost never gets tagged? Should it be removed or is it just hard to earn?

**Evidence to gather:**
- Generate 10+ full playthroughs and tally which lessons appeared and how often
- Identify any lessons that appeared 0 times
- Identify lessons that appeared 8+ times (over-represented)
- Note: are lessons being forced into scenes, or earned organically?

### 2.2 Lesson-to-Scene Mapping
The prompt says: "Write the scene first, then set lessonId (prefer null if no single lesson clearly dominates)"

**Questions to answer:**
- Is the AI actually following this rule, or force-fitting lessons to every scene?
- What % of scenes have lessonId: null vs actual lesson ID? (Target: ~30-40% null, 60-70% tagged)
- Does the lesson feel earned by the scene's action/dialogue, or shoehorned?

**Evidence to gather:**
- Sample 20 generated scenes from a playthrough
- For each scene with a lesson: does the scene text clearly demonstrate that lesson, or is it tangential?
- Flag any scenes where the lesson felt forced

### 2.3 Thread State + Lessons Integration
Read `src/lib/stories/no-vacancies/context.ts` (translation maps).

**Questions to answer:**
- Are the translation map levels (Sydney Realization 0→1→2→3, Oswaldo Awareness 0→1→2→3) tied to specific lessons?
- Should lessons be locked to thread state milestones, or discovered organically?
- Is there a lesson that should trigger when a specific thread state is reached but isn't?

**Evidence to gather:**
- For each thread state in context.ts, identify which lessons align with those narrative arcs
- Map: should a lesson be "discovered" when Sydney Realization hits 2? Or left organic?
- Identify conflicts: does lesson 5 contradict the Oswaldo behavior rules?

---

## Part 3: Specific Rewrites Needed (If Applicable)

If investigation finds drift or unclear rules, propose:
1. **Rewrite examples** with before/after
2. **Clarity improvements** for ambiguous prompt sections
3. **New rules** if a pattern isn't covered
4. **Rule removal** if a section isn't landing

---

## Deliverables Expected

After investigation, provide:
- **Prompt audit report:** Which sections are working, which need rewriting
- **Lesson coverage audit:** Which lessons over/under-represented, which should be removed/rewritten
- **Integration gaps:** Where thread state and lessons should tie together but don't
- **3-5 concrete changes** to tighten AI output (specific edits to SYSTEM_PROMPT or getContinuePrompt)
- **Acceptance criteria:** How to test that changes improved quality

---

## How to Run This

**Option A: Autonomous Agent**
```bash
# Give this prompt to Claude Agent (Haiku or Sonnet) with permission to:
# - Read src/lib/stories/no-vacancies/prompts.ts
# - Read src/lib/narrative/lessonsCatalog.ts
# - Read src/lib/stories/no-vacancies/context.ts
# - Run npm run dev and generate sample scenes for evidence gathering
# - Write findings to findings-report.md
```

**Option B: Manual Review**
Follow the sections in order, gathering evidence for each.

---

## Related Files
- `src/lib/stories/no-vacancies/prompts.ts` — SYSTEM_PROMPT and getContinuePrompt
- `src/lib/narrative/lessonsCatalog.ts` — All 17 lessons
- `src/lib/stories/no-vacancies/context.ts` — Thread state translation maps
- `tests/narrative/narrativeQuality.test.js` — Existing quality tests (reference)
