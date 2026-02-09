# Narrative Voice Audit - Flattening Risk + Original Line Register

This file is a practical remediation workbook with three tables:
1. Every known app location where your writing can be flattened.
2. The original authored lines (with current runtime status).
3. A blank fix worksheet you can fill as changes are made.

## Table 1 - Where Writing Can Be Flattened In App

| Surface ID | File | Area | How Flattening Can Happen | Evidence | Linked Original IDs |
|---|---|---|---|---|---|
| S1 | `js/prompts.js:15` | Legacy translation maps | Manual copy drift from authored lines (legacy JS path still exists) | `*_TRANSLATIONS` + `TRANSITION_BRIDGE_MAP` constants | O001-O037 |
| S2 | `src/lib/game/narrativeContext.ts:20` | Active context translation maps | Trimmed/generalized prose in thread-state lines | `TRINA_TENSION_TRANSLATIONS`, `MONEY_TRANSLATIONS`, `SYDNEY_REALIZATION_TRANSLATIONS` | O006-O029 |
| S3 | `src/lib/server/ai/narrative.ts:26` | Server prompt translation maps | Duplicate copy of same maps creates parallel drift risk | Same constants duplicated server-side | O001-O037 |
| S4 | `js/prompts.js:92` | Legacy transition bridges | Transition line softening/loss of concrete events | `TRANSITION_BRIDGE_MAP` text | O030-O037 |
| S5 | `src/lib/game/narrativeContext.ts:97` | Active transition bridges | Transition lines rewritten to abstract language | `trinaTension 1->3`, `oswaldoAwareness 0->2` | O031, O034 |
| S6 | `src/lib/server/ai/narrative.ts:103` | Server transition bridges | Same bridge drift duplicated in prompt path | Same bridge lines as S5 | O030-O037 |
| S7 | `js/prompts.js:486` | Legacy SYSTEM_PROMPT | Trina behavior examples simplified from authored specificity | Trina bullet examples around lines 552-558 | O006-O008 |
| S8 | `src/lib/server/ai/narrative.ts:503` | Active SYSTEM_PROMPT | Same simplified Trina behavior examples in active prompt | Trina bullet examples around lines 569-575 | O006-O008 |
| S9 | `src/lib/game/narrativeContext.ts:131` | Boundary fallback prose | Unknown-boundary fallback is generic and can overwrite authored tone | `Boundary set: ... one less loophole.` | O025-O029 |
| S10 | `src/lib/server/ai/narrative.ts:161` | Boundary fallback prose | Same generic fallback in prompt path | same fallback text | O025-O029 |
| S11 | `src/lib/game/narrativeContext.ts:145` | Lesson-history fallback prose | Unknown lesson fallback is utility text, not authored voice | `Lesson X has appeared...` | O001-O037 (indirect continuity) |
| S12 | `src/lib/server/ai/narrative.ts:175` | Lesson-history fallback prose | Same utility fallback in server prompt path | same fallback text | O001-O037 (indirect continuity) |
| S13 | `src/lib/server/ai/sanity.ts:10` | Post-generation normalization | Choice text normalization can flatten punctuation/shape | `normalizeChoiceText` + duplicate-choice heuristic | N/A (post-output mutation) |
| S14 | `src/lib/server/ai/providers/grok.ts:81` | Post-generation normalization | Scene normalization can coerce/trim model output before render | `normalizeScene` path | N/A (post-output mutation) |
| S15 | `tests/narrative/fixtures/goldenScenes.json` | Test fixture baselines | If fixtures contain flattened style, CI can reinforce weaker voice | Fixture snapshots gate scoring | O001-O037 (quality anchor risk) |
| S16 | `tests/narrative/lib/sanityMirror.js` | CI scoring mirror | Heuristic checks may reward safe text over authored edge | Rule mirror for sanity checks | O001-O037 (quality anchor risk) |

## Table 2 - Original Authored Writing (Corresponding Register)

Source of truth: `docs/HANDWRITTEN_NARRATIVE_ASSETS.md`

| Orig ID | Source Section | Key | Original Authored Line | Current Runtime Status |
|---|---|---|---|---|
| O001 | 1.1 | `oswaldoConflict=-2` | "He's weirdly helpful today, like he wants credit for doing the bare minimum without being asked." | Match |
| O002 | 1.1 | `oswaldoConflict=-1` | "He's not fighting, but every answer has an attitude tucked inside it." | Match |
| O003 | 1.1 | `oswaldoConflict=0` | "Oswaldo hasn't been challenged. The resentment is still underground." | Match |
| O004 | 1.1 | `oswaldoConflict=1` | "Every question turns into a dodge. He acts accused before anyone accuses him." | Match |
| O005 | 1.1 | `oswaldoConflict=2` | "Things with Oswaldo are actively hostile. He's in full deflection mode." | Match |
| O006 | 1.2 | `trinaTension=0` | "Trina's just furniture. Annoying furniture, but furniture." | Match |
| O007 | 1.2 | `trinaTension=1` | "The snack cake wrappers are piling up. The entitlement is starting to show. She wakes up every hour on the hour to eat a snack cake and throws the wrapper on the floor." | Changed (details removed) |
| O008 | 1.2 | `trinaTension=2` | "Trina's taking and taking and doesn't even see it as taking. She catfishes a guy on Facebook Dating for forty dollars, buys smokes, orders DoorDash for herself, and calls that survival." | Changed (details removed + wording flattened) |
| O009 | 1.2 | `trinaTension=3` | "Something has to happen with Trina. The math doesn't work anymore. Sydney fronts Trina the referral money, Trina hits six hundred at the casino, vanishes without a thank-you, then comes back broke two days later." | Changed (details removed + wording flattened) |
| O010 | 1.3 | `moneyResolved=false` | "The eighteen-dollar gap is still open, and the clock keeps moving like it gets paid to panic her." | Changed (simplified) |
| O011 | 1.3 | `moneyResolved=true` | "The room is paid. One less fire to put out." | Match |
| O012 | 1.4 | `carMentioned=false` | "Nobody says the car thing out loud, but it sits in the room anyway." | Match |
| O013 | 1.4 | `carMentioned=true` | "Once the car incident is named, the air changes. Nobody can pretend this is all random bad luck." | Changed (minor wording cut) |
| O014 | 1.5 | `sydneyRealization=0` | "She thinks Oswaldo can't help. He's just not built for this." | Changed (`can't` -> `cannot`) |
| O015 | 1.5 | `sydneyRealization=1` | "She's starting to see it's not 'can't.' It's 'won't.'" | Changed (`it's` -> `it is`) |
| O016 | 1.5 | `sydneyRealization=2` | "He helps other people. He rides his bike five miles for other people. So why not her?" | Changed (removed `his bike`) |
| O017 | 1.5 | `sydneyRealization=3` | "He helps everyone except her. On purpose. That's not neglect. That's a choice." | Changed (`That's` -> `That is`) |
| O018 | 1.6 | `oswaldoAwareness=0` | "He treats rent money like weather. It happens around him, not because of him." | Match |
| O019 | 1.6 | `oswaldoAwareness=1` | "He gets flashes that she's carrying this place, then slides back into convenience." | Match |
| O020 | 1.6 | `oswaldoAwareness=2` | "He can name what she does now, but he still acts like naming it is the same as helping." | Changed (removed `he`) |
| O021 | 1.6 | `oswaldoAwareness=3` | "He finally sees her labor as labor, not mood, and he changes behavior without being managed." | Changed (removed `he`) |
| O022 | 1.7 | `exhaustionLevel=1` | "She is steady enough to run the board, but only because she's forcing it." | Match |
| O023 | 1.7 | `exhaustionLevel=2` | "Her fuse is shorter and her patience now costs interest." | Match |
| O024 | 1.7 | `exhaustionLevel=3` | "Small disrespect lands big. She can still perform, but the seams are visible." | Match |
| O025 | 1.7 | `exhaustionLevel=4` | "Sydney is running on fumes. Every interaction costs more than it should." | Match |
| O026 | 1.7 | `exhaustionLevel=5` | "Her body clocks out before her responsibilities do. Survival mode takes over the whole room." | Changed (removed `whole`) |
| O027 | 1.8 | `boundariesSet=none` | "Anything goes means Sydney pays for everything, including everybody's bad habits." | Changed (`everybody's` -> `everybody else's`) |
| O028 | 1.8 | `boundariesSet=one` | "One line in the sand changes the room's weather, even if nobody likes it." | Match |
| O029 | 1.8 | `boundariesSet=multiple` | "With rules in place, chaos has to knock before it comes in." | Match |
| O030 | 2 | `oswaldoConflict 0->2` | "It goes from swallowed comments to open war after he calls her 'dramatic' while she is counting rent money." | Changed (minor contraction/wording) |
| O031 | 2 | `trinaTension 1->3` | "Wrappers on the floor turns into open disrespect when Trina scores six hundred, disappears, then reappears broke and entitled." | Changed (major context replaced) |
| O032 | 2 | `exhaustionLevel 2->4` | "One missed hour of sleep and three fresh asks push her from tired to done pretending she's fine." | Match |
| O033 | 2 | `sydneyRealization 1->3` | "The pattern gets too clean to deny: he can show up for everybody else, just not for her." | Match |
| O034 | 2 | `oswaldoAwareness 0->2` | "He overhears the referral hustle, the rent math, the cleanup, and finally has no excuse to claim he didn't know." | Changed (major context reduced) |
| O035 | 2 | `moneyResolved false->true` | "She patches it with one ugly move, buys one day of air, and everyone else mistakes that for stability." | Changed (removed `else`) |
| O036 | 2 (optional) | `oswaldoConflict 2->1` | "He backs off only after she stops negotiating and starts enforcing." | Match |
| O037 | 2 (optional) | `exhaustionLevel 4->3` | "A paid room and one uninterrupted hour lowers the heat, but not the history." | Changed (`lowers` -> `lower`) |

## Table 3 - Blank Remediation Table (Fill This In)

Situation:
- Your authored voice exists in `docs/HANDWRITTEN_NARRATIVE_ASSETS.md`.
- Runtime currently uses duplicated translation/bridge maps in multiple files.
- Some lines were flattened, generalized, or had concrete context removed.

Instructions:
1. Copy one row per mismatch from Table 2 where status is `Changed`.
2. Fill `Current Runtime Text` from the active runtime path first (`src/lib/game/narrativeContext.ts`, then `src/lib/server/ai/narrative.ts`).
3. Fill `Restored Target Text` with your approved line verbatim.
4. If you intentionally want a rewrite, document reason in `Decision Note`.
5. Add at least one test ID per row before marking done.

| Fix ID | Orig ID | Runtime File:Line | Current Runtime Text | Restored Target Text | Decision Note (why this version) | Test ID(s) | Owner | Status |
|---|---|---|---|---|---|---|---|---|
| F001 |  |  |  |  |  |  |  |  |
| F002 |  |  |  |  |  |  |  |  |
| F003 |  |  |  |  |  |  |  |  |
| F004 |  |  |  |  |  |  |  |  |
| F005 |  |  |  |  |  |  |  |  |
| F006 |  |  |  |  |  |  |  |  |
| F007 |  |  |  |  |  |  |  |  |
| F008 |  |  |  |  |  |  |  |  |
| F009 |  |  |  |  |  |  |  |  |
| F010 |  |  |  |  |  |  |  |  |
| F011 |  |  |  |  |  |  |  |  |
| F012 |  |  |  |  |  |  |  |  |
| F013 |  |  |  |  |  |  |  |  |
| F014 |  |  |  |  |  |  |  |  |
| F015 |  |  |  |  |  |  |  |  |

