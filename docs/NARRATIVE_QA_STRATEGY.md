# Narrative QA Strategy: Heuristics & Evaluation

**Date:** 2026-02-12
**Context:** Strategy for enforcing narrative quality in CI/CD without relying solely on "vibes."

---

## The Two-Layer Gate

We separate **Sanity Checks** (Runtime, Deterministic, Fast) from **Evaluations** (Build-time, Probabilistic, Deep).

### Layer 1: Runtime Sanity (The Bouncer)

_Runs on every generated scene in production. Zero tolerance for structural failures._

**Checks:**

1.  **Schema Validity:** JSON structure, field types.
2.  **Choice Count:** Exact count (3 for normal scenes, variable for endings).
3.  **Banned Phrases:** Regex-based rejection of "The lesson is...", therapy-speak, moralizing.
4.  **Word Count:**
    - Normal Scenes: Warn @ 280, Fail @ 350.
    - Endings: Warn @ 370, Fail @ 450.
5.  **Apology Loops:** Detection of AI refusual/apology patterns.

---

### Layer 2: CI Evaluation (The Critic)

_Runs in CI pipelines. Uses LLM (Claude/Grok) to judge `src/` output quality._

**Metrics (1-5 Scale or Boolean):**

1.  **Voice Fidelity:** Does Oswaldo sound distinct from the narrator? (1-5)
2.  **Cost Distinctness:** Do the three choices spend different currencies? (Boolean)
3.  **Didactic Slips:** Does the narrative summarize the theme? ("She realized...") (Boolean)
4.  **Sensory Detail:** Is there at least one concrete physical detail? (Boolean)
5.  **Continuity Callback:** Does the scene reference a past thread/fact? (Boolean)

**The Evaluator Prompt:**

- Input: Generated Scene + Rubric.
- Output: Structured JSON score (`{ voiceFidelity: 4, costDistinct: true, ... }`).
- Action: Fail build on `< 3` voice fidelity or `false` cost distinctness. Warn on others.

---

## Test Types

1.  **Adversarial Fixtures:** Handcrafted _bad_ scenes that must trigger rejection. (e.g., A scene with "The lesson is...").
2.  **Golden Fixtures:** Handcrafted _good_ scenes that must pass. (Prevents over-tuning).
3.  **Translation Map Coverage:** Verify every thread value has a voice translation entry.
4.  **Transition Bridge Map:** Verify all bridges connect valid states.

**Why this works:**

- Heuristics catch the machine failures (broken JSON, refusal loops).
- Evaluators catch the artistic failures (boring prose, generic voice) that regex can't see.
