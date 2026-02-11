# Voice Upgrade Plan - Bringing Everything to Voice Ceiling

**Goal:** Upgrade all prose in the app to match the voice quality in `HANDWRITTEN_NARRATIVE_ASSETS.md`

**Voice Standards:**
- Short lines with emotional texture over generic prose
- Concrete, scene-ready language (not abstract notes)
- Dark humor as coping mechanism
- Show-don't-tell specificity
- Sydney's voice: dry, observant, exhausted but precise

---

## Priority 1: RESTORE DEGRADED CORE NARRATIVE (Critical)

### Surface S2, S5: Translation Maps
**Files:** `src/lib/game/narrativeContext.ts` + `src/lib/server/ai/narrative.ts`

| ID | Current (Flat) | Target (Voice Ceiling) | Impact |
|---|---|---|---|
| trinaTension=1 | "The snack cake wrappers are piling up. The entitlement is starting to show." | "The snack cake wrappers are piling up. The entitlement is starting to show. She wakes up every hour on the hour to eat a snack cake and throws the wrapper on the floor." | **HIGH** - Lost concrete behavior |
| trinaTension=2 | "Trina's taking and taking and does not even see it as taking." | "Trina's taking and taking and doesn't even see it as taking. She catfishes a guy on Facebook Dating for forty dollars, buys smokes, orders DoorDash for herself, and calls that survival." | **HIGH** - Lost all examples |
| trinaTension=3 | "Something has to happen with Trina. The math does not work anymore." | "Something has to happen with Trina. The math doesn't work anymore. Sydney fronts Trina the referral money, Trina hits six hundred at the casino, vanishes without a thank-you, then comes back broke two days later." | **CRITICAL** - Lost entire story |
| moneyResolved=false | "Still eighteen short. The clock does not care." | "The eighteen-dollar gap is still open, and the clock keeps moving like it gets paid to panic her." | **HIGH** - Lost voice ceiling line |
| sydneyRealization=0 | "She thinks Oswaldo cannot help. He's just not built for this." | "She thinks Oswaldo can't help. He's just not built for this." | **MEDIUM** - Contraction |
| sydneyRealization=1 | "She's starting to see it is not 'can't.' It's 'won't.'" | "She's starting to see it's not 'can't.' It's 'won't.'" | **MEDIUM** - Contraction |
| sydneyRealization=2 | "He helps other people. He rides five miles for other people. So why not her?" | "He helps other people. He rides his bike five miles for other people. So why not her?" | **LOW** - Missing detail |
| sydneyRealization=3 | "He helps everyone except her. On purpose. That is not neglect. That is a choice." | "He helps everyone except her. On purpose. That's not neglect. That's a choice." | **MEDIUM** - Contractions |
| oswaldoAwareness=2 | "He can name what she does now, but still acts like naming it is the same as helping." | "He can name what she does now, but he still acts like naming it is the same as helping." | **LOW** - Rhythm |
| oswaldoAwareness=3 | "He finally sees her labor as labor, not mood, and changes behavior without being managed." | "He finally sees her labor as labor, not mood, and he changes behavior without being managed." | **LOW** - Rhythm |
| exhaustionLevel=5 | "Her body clocks out before her responsibilities do. Survival mode takes over the room." | "Her body clocks out before her responsibilities do. Survival mode takes over the whole room." | **LOW** - Word choice |
| boundariesSet=none | "Anything goes means Sydney pays for everything, including everybody else's bad habits." | "Anything goes means Sydney pays for everything, including everybody's bad habits." | **MATCH** ✓ |

### Transition Bridges

| ID | Current | Target | Impact |
|---|---|---|---|
| trinaTension 1->3 | "Wrappers on the floor turns into open disrespect, and the room finally says the quiet part out loud." | "Wrappers on the floor turns into open disrespect when Trina scores six hundred, disappears, then reappears broke and entitled." | **CRITICAL** - Lost casino story |
| oswaldoAwareness 0->2 | "He overhears the hustle, the rent math, and the cleanup, and loses the excuse that he did not know." | "He overhears the referral hustle, the rent math, the cleanup, and finally has no excuse to claim he didn't know." | **MEDIUM** - Detail + contraction |
| moneyResolved false->true | "She patches it with one ugly move, buys one day of air, and everyone mistakes that for stability." | "She patches it with one ugly move, buys one day of air, and everyone else mistakes that for stability." | **LOW** - Word choice |
| exhaustionLevel 4->3 | "A paid room and one uninterrupted hour lower the heat, but not the history." | "A paid room and one uninterrupted hour lowers the heat, but not the history." | **LOW** - Grammar |

**Action:** Restore all lines verbatim from `HANDWRITTEN_NARRATIVE_ASSETS.md`

---

## Priority 2: UPGRADE UI TEXT (High Impact)

### Home Page (`src/routes/+page.svelte`)

**Current UI copy feels generic/corporate. Make it feel like Sydney's world.**

| Current | Voice Upgrade | Why |
|---|---|---|
| "Carry What Matters" | "Carry What Matters" | **KEEP** - Already good |
| "A story about invisible labor, pressure, and what finally changes." | "A story about invisible labor, pressure, and what finally changes." | **KEEP** - Already good |
| "Begin Story" | "Begin Story" | **KEEP** - Neutral is fine |
| "Open Settings" | "Settings" | Shorter, less formal |
| "Loading readiness checks..." | "Running checks..." | Less technical |
| "Refresh" | "Refresh" | **KEEP** - Fine |

### Settings Page (`src/routes/settings/+page.svelte`)

| Current | Voice Upgrade | Why |
|---|---|---|
| "AI Generated only. No mock fallback path is active." | "AI mode only. No fallback." | Less technical, Sydney-direct |
| "On" / "Off" | "On" / "Off" | **KEEP** - Clear |
| "Lesson Insights" | "Show the thesis" | More Sydney voice? Or keep clear? |

**Decision needed:** Settings should stay clear/technical OR match Sydney's dry voice?

### Play Page (`src/routes/play/+page.svelte`)

| Current | Voice Upgrade | Why |
|---|---|---|
| "Loading story..." | "Loading..." | Shorter |
| "Scene {sceneCount}" | "Scene {sceneCount}" | **KEEP** - Clear |
| "AI Mode" | "AI" | Shorter |
| "Lesson Insight #{lessonId}" | "Lesson #{lessonId}" | Shorter |
| "View Ending" | "See how it ends" | More human? |

### Ending Page (`src/routes/ending/+page.svelte`)

| Current | Voice Upgrade | Why |
|---|---|---|
| "No ending has been reached in this session yet." | "You haven't reached an ending yet." | Second person matches game |
| "Scenes: {count}" | "Scenes: {count}" | **KEEP** |
| "Insights: {count}" | "Lessons: {count}" | More accurate |
| "Duration: {time}s" | "{time}s" | Shorter |
| "Play Again" | "Start over" | More Sydney? |
| "Back to Play" | "Keep going" | More active |

### Content Warning (`index.html`)

| Current | Voice Upgrade | Why |
|---|---|---|
| "This story deals with themes of codependency, substance use, and emotional labor. It contains strong language and mature situations." | "This story is about meth addicts in a motel. Codependency, invisible labor, and people who won't help themselves. Strong language. Not uplifting." | More honest, less clinical |

---

## Priority 3: AUDIT SYSTEM PROMPT (Medium)

### System Prompt in `src/lib/server/ai/narrative.ts`

**Review sections for flat spots:**

#### Section: Dark Humor Examples (Lines 590-599)
**Current examples are already good. Check for any generic spots.**

Example lines to review:
- "They use her hotspot til it's throttled, then complain the wifi sucks" ✓ GOOD
- "The hotel clerk doesn't accept 'he's going through it' as payment" ✓ GOOD
- "She's sick with fever. Oswaldo: 'So... are we gonna have money for the room?'" ✓ GOOD

**Verdict: System prompt dark humor is ALREADY at voice ceiling. Keep as-is.**

#### Section: Voice Ceiling Examples (Lines 601-602)
Only 2 examples. Could add more from HANDWRITTEN_NARRATIVE_ASSETS.md section 12.1:

**ADD TO SYSTEM PROMPT:**
```
- "The motel clock blinks 6:47 like it is judging her math."
- "Trina wakes up hourly for snack cakes and leaves confetti made of wrappers."
- "Forty dollars from a catfish turns into smokes and solo DoorDash in under an hour."
- "Sydney fronts the referral money; Trina hits six hundred and forgets who opened the door."
- "Two days later, Trina returns broke and loud, like gratitude was never in stock."
- "He will ride five miles for strangers and five inches for nobody in this room."
- "Every favor in this room is a loan with hidden interest."
- "When she sets one boundary, everyone acts like she started a war."
- "She keeps the room alive and still gets treated like an interruption."
```

**Action:** Add these 9 lines to VOICE CEILING EXAMPLES section in system prompt.

---

## Priority 4: AUDIT LESSONS (Medium)

### Review `src/lib/server/ai/lessons.ts`

**Check each lesson for:**
1. Voice consistency with Sydney's world
2. Concrete vs abstract language
3. Emotional texture

**Sample from Lesson 1:**
```javascript
quote: 'You only notice the beam when it breaks.',
insight: 'Sydney is the infrastructure. Everyone leans on her stability...',
emotionalStakes: [
    'If Sydney stops, the room collapses. Oswaldo sleeps in his car...',
    'Nobody sees the work until it stops happening...',
    'Sydney carries the system alone, and alone is the operational word.'
]
```

**Verdict: Lessons are ALREADY STRONG. Minor tweaks only if needed.**

**Potential tweaks:**
- Lesson 6 "Invisibility of Competence" - check if stakes are concrete enough
- Lesson 13 "Won't vs Can't" - might need more Sydney-specific examples

**Action:** Light review only. Lessons are 90%+ voice ceiling already.

---

## Priority 5: AUDIT MOCK SCENES (Low)

### Review `src/lib/services/mockStoryService.ts`

**Opening scene (lines 26-59):**
```javascript
sceneText: `The clock blinks 6:47 AM in that particular shade of motel...`
```

**Check:**
- Are mock scenes at the same voice quality as AI-generated scenes should be?
- Do they demonstrate the voice ceiling examples?

**Sample lines to review:**
- "Oswaldo's asleep. Of course he is." ✓ GOOD - Short, bitter
- "Trina's on the floor in a nest of clothes she doesn't own." ✓ GOOD - Specific detail
- "You have forty-seven dollars. You need sixty-five. By 11 AM." ✓ GOOD - Stark stakes

**Verdict: Mock scenes are ALREADY at voice ceiling. Keep as-is.**

---

## Priority 6: ERROR MESSAGES (Low)

### Technical Errors in `src/lib/server/ai/sanity.ts`

**Current error codes are internal-only. No user-facing prose here.**

Example:
- `'scene_text_too_short'` - Dev-facing only
- `'duplicate_choice_phrasing'` - Dev-facing only

**Decision:** These don't need voice upgrade. They're validation codes, not user-facing text.

---

## Priority 7: DELETE LEGACY DUPLICATION

### File: `js/prompts.js`

**Status:** This entire file is legacy and duplicates `src/lib/server/ai/narrative.ts`

**Action:** DELETE ENTIRE FILE after confirming nothing imports it.

**Risk check:**
```bash
grep -r "js/prompts" src/
grep -r "from './prompts" src/
```

If no imports found, DELETE FILE.

---

## Summary: Voice Upgrade Actions

### CRITICAL (Do First)
1. ✅ **Restore 18 degraded narrative lines** in `narrativeContext.ts` + `narrative.ts`
2. ✅ **Add 9 voice ceiling examples** to system prompt
3. ✅ **Delete legacy `js/prompts.js`** (after import check)

### HIGH (Do Second)
4. ⚠️ **Upgrade content warning** to honest/direct voice
5. ⚠️ **Simplify UI labels** (7 changes across play/ending/settings pages)

### MEDIUM (Review)
6. 📝 **Light audit of lessons.ts** (check Lesson 6 & 13 for concreteness)
7. 📝 **Confirm system prompt sections** (already strong, minimal changes)

### LOW (Optional Polish)
8. 📝 **Review mock scenes** (already at voice ceiling, likely no changes)

---

## Testing Strategy

After voice upgrades:

1. **Smoke test:** Run full playthrough in AI mode
2. **Voice consistency check:** Compare 3 AI-generated scenes to restored translation maps
3. **Regression check:** Ensure narrative quality CI still passes
4. **Human read:** Read 5 random scenes aloud - does it sound like Sydney?

---

## Metrics: Before/After Voice Quality

### Before Upgrade
- **Core narrative lines at voice ceiling:** 19/37 (51%)
- **System prompt voice ceiling examples:** 2
- **UI text voice-matched:** ~20%
- **Contraction usage (conversational):** ~40%

### After Upgrade (Target)
- **Core narrative lines at voice ceiling:** 37/37 (100%)
- **System prompt voice ceiling examples:** 11
- **UI text voice-matched:** ~70%
- **Contraction usage (conversational):** ~85%

---

## Roll-Out Plan

### Phase 1: Critical Restoration (Today)
- [ ] Restore 18 degraded lines in both files
- [ ] Add 9 voice ceiling examples to system prompt
- [ ] Delete legacy prompts.js
- [ ] Test: Full AI playthrough

### Phase 2: UI Polish (This Week)
- [ ] Upgrade content warning
- [ ] Simplify UI labels
- [ ] Test: User-facing text audit

### Phase 3: Final Review (Next Week)
- [ ] Light lesson audit (if needed)
- [ ] Mock scene check (if needed)
- [ ] Full voice consistency pass

---

**Estimated Effort:**
- Phase 1: 2 hours
- Phase 2: 1 hour
- Phase 3: 1 hour
- **Total: 4 hours to voice ceiling**
