# Narrative Content Baseline, Tone Intent, Flattening, and Drift (2026-02-12)

## Purpose
This document consolidates the narrative content you asked for in one place:
1. Full baseline text content (translation layers, voice examples, lessons).
2. Intended tone explanation.
3. Flattening analysis (where and how language got blunted).
4. Drift analysis (why this keeps happening).
5. Reconstruction buckets (`can`, `cannot`, `unsure`).

## Intended Tone (Target Writing DNA)
The intended voice is not generic dramatic fiction. It is:
1. Intimate and direct: second person, present tense, close camera.
2. Street-level specific: concrete details, not abstract sentiment.
3. Dry, exhausted, sharp: dark humor as coping, not theatrical snark.
4. Load-bearing realism: labor distribution is the core lens.
5. Anti-lecture: lessons emerge through situation, not moral narration.

Anchor instructions live in `src/lib/server/ai/narrative.ts:503`, including:
1. Voice ceiling lines.
2. Show-don't-tell guidance.
3. Sensory grounding requirement.
4. Continuity-first priority order.

Active style reference point:
1. `docs/WRITING_STYLE_REFERENCE_MOTIVE_DRIVEN_ANTHROPOMORPHISM.md`
2. Treat that file as the live prose north star for rewrites.

## Full Narrative Content Baseline

### A) Translation Layer Baseline (runtime-rich phrasing)
Primary source used here: `src/lib/game/narrativeContext.ts`.

#### Exhaustion Levels (`exhaustionLevel` 0-5)
1. `0`: "She's awake, alert, and has not spent herself yet."
2. `1`: "She is steady enough to run the board, but only because she's forcing it."
3. `2`: "Her fuse is shorter and her patience now costs interest."
4. `3`: "Small disrespect lands big. She can still perform, but the seams are visible."
5. `4`: "Sydney is running on fumes. Every interaction costs more than it should."
6. `5`: "Her body clocks out before her responsibilities do. Survival mode takes over the whole room."

#### Oswaldo Conflict (`oswaldoConflict` -2 to 2)
1. `-2`: "He's weirdly helpful today, like he wants credit for doing the bare minimum without being asked."
2. `-1`: "He's not fighting, but every answer has an attitude tucked inside it."
3. `0`: "Oswaldo hasn't been challenged. The resentment is still underground."
4. `1`: "Every question turns into a dodge. He acts accused before anyone accuses him."
5. `2`: "Things with Oswaldo are actively hostile. He's in full deflection mode."

#### Oswaldo Awareness (`oswaldoAwareness` 0-3)
1. `0`: "He treats rent money like weather. It happens around him, not because of him."
2. `1`: "He gets flashes that she's carrying this place, then slides back into convenience."
3. `2`: "He can name what she does now, but he still acts like naming it is the same as helping."
4. `3`: "He finally sees her labor as labor, not mood, and he changes behavior without being managed."

#### Sydney Realization (`sydneyRealization` 0-3)
1. `0`: "She thinks Oswaldo can't help. He's just not built for this."
2. `1`: "She's starting to see it's not 'can't.' It's 'won't.'"
3. `2`: "He helps other people. He rides his bike five miles for other people. So why not her?"
4. `3`: "He helps everyone except her. On purpose. That's not neglect. That's a choice."

#### Trina Tension (`trinaTension` 0-3)
1. `0`: "Trina's just furniture. Annoying furniture, but furniture."
2. `1`: "The snack cake wrappers are piling up. The entitlement is starting to show. She wakes up every hour on the hour to eat a snack cake and throws the wrapper on the floor."
3. `2`: "Trina's taking and taking and doesn't even see it as taking. She catfishes a guy on Facebook Dating for forty dollars, buys smokes, orders DoorDash for herself, and calls that survival."
4. `3`: "Something has to happen with Trina. The math doesn't work anymore. Sydney gives her the referral link and fronts her ten bucks to get started. Trina hits six hundred at the casino, vanishes without a thank-you, then comes back broke two days later."

#### Boundaries (`boundariesSet`)
1. `no guests without asking`: "She told him the room is not a lobby."
2. `no lending money to dex`: "The bank of Sydney is closed for Dex. Out loud, on record."
3. `no eating saved food`: "She labeled her food. That sentence should not need to exist."
4. `wake up before noon`: "She set a wake-up line. He can be mad and vertical at the same time."
5. `no phone snooping`: "Her phone is not communal property. She said it plain."
6. `no bringing krystal around`: "Krystal is now a hard no. No nostalgia loopholes."

#### Logistics and Fact Translations
1. `moneyResolved=true`: "The room is paid. One less fire to put out."
2. `moneyResolved=false`: "The eighteen-dollar gap is still open, and the clock keeps moving like it gets paid to panic her."
3. `carMentioned=true`: "Once the car incident is named, the air changes. Nobody can pretend this is random bad luck."
4. `carMentioned=false`: "Nobody says the car thing out loud, but it sits in the room anyway."

#### General Boundary Count Narration
1. `0 boundaries`: "Anything goes means Sydney pays for everything, including everybody's bad habits."
2. `1 boundary`: "One line in the sand changes the room's weather, even if nobody likes it."
3. `2+ boundaries`: "With rules in place, chaos has to knock before it comes in."

#### Transition Bridge Lines
1. `oswaldoConflict 0->2`: "It goes from swallowed comments to open war after he calls her 'dramatic' while she's counting rent money."
2. `oswaldoConflict 2->1`: "He backs off only after she stops negotiating and starts enforcing."
3. `trinaTension 1->3`: "Wrappers on the floor turns into open disrespect when Sydney gives her the referral link, Trina scores six hundred, disappears, then reappears broke and entitled."
4. `exhaustionLevel 2->4`: "One missed hour of sleep and three fresh asks push her from tired to done pretending she's fine."
5. `exhaustionLevel 4->3`: "A paid room and one uninterrupted hour lowers the heat, but not the history."
6. `sydneyRealization 1->3`: "The pattern gets too clean to deny: he can show up for everybody else, just not for her."
7. `oswaldoAwareness 0->2`: "He overhears the referral hustle, the rent math, the cleanup, and finally has no excuse to claim he didn't know."
8. `moneyResolved false->true`: "She patches it with one ugly move, buys one day of air, and everyone else mistakes that for stability."

### B) Voice Ceiling and Dark Humor Anchors
Primary source: `src/lib/server/ai/narrative.ts:503`.

Voice ceiling lines:
1. "He will ride five miles for strangers and five inches for nobody in this room."
2. "The bill got paid, but respect is still in collections."

Dark humor examples in prompt:
1. "I help with the ENERGY around here"
2. "The hotel clerk doesn't accept 'he's going through it' as payment"
3. "They call her 'the mom' sarcastically - she's the only one who knows what month it is"

### C) Full Lesson Corpus (Quote + Insight + Unconventional Angle)
Primary source: `src/lib/narrative/lessonsCatalog.ts`.

1. `Lesson 1 | Load-Bearing Beams Get Leaned On`
Quote: "Load-bearing beams don't get applause. They get leaned on."
Insight: "When you're the structural support, you don't get applause. You get weight."
Unconventional Angle: "The competent person's curse - the better you are, the less credit you get"

2. `Lesson 2 | They Don't Understand the Concept`
Quote: "I don't mind not getting applause, but what I do mind is them not understanding the load-bearing concept."
Insight: "It's not the lack of applause that hurts. It's that they genuinely don't see the load."
Unconventional Angle: "They're not evil, they're just blind. Which might be worse."

3. `Lesson 3 | Resentment Toward the Load-Bearer`
Quote: "People often get resentful, even if and especially if you are load-bearing and looking out for them."
Insight: "People often get resentful of the person carrying them, especially when competence makes them feel inadequate."
Unconventional Angle: "Your competence is an accusation they didn't ask for"

4. `Lesson 4 | Your Energy Keeps It Alive`
Quote: "Your attention, energy, explanation, and patience are the thing keeping the dynamic alive. If you stopped supplying them, the thing would wither or die."
Insight: "Your attention, energy, explanation, and patience ARE the dynamic. Without you supplying them, it dies."
Unconventional Angle: "The relationship isn't dysfunctional - it's functioning exactly as designed, with you as the fuel"

5. `Lesson 5 | Output vs Presence`
Quote: "Be valued for output vs. be valued for presence."
Insight: "Are you valued because of what you produce, or because you exist?"
Unconventional Angle: "Some people are furniture. Some people are appliances. Know which one you are."

6. `Lesson 6 | Invisibility of Competence`
Quote: "The better you do your job, the less visible it is. Stability erases evidence of effort. Prevention never feels dramatic."
Insight: "The better you do your job, the less visible it is. Stability erases evidence of effort."
Unconventional Angle: "The only way to be seen is to let things break"

7. `Lesson 7 | This Isn't Hard`
Quote: "People unconsciously conclude: 'This isn't hard. If it were hard, I'd feel it. If it required effort, I'd see strain.'"
Insight: "If they don't see strain, they assume there isn't any."
Unconventional Angle: "Your poker face is your prison"

8. `Lesson 8 | Asking for Help Doesn't Work`
Quote: "When I ask for help, often people don't take me seriously because they think I can't actually be needing help."
Insight: "When you rarely need help, people don't take you seriously when you finally ask."
Unconventional Angle: "Your track record of solving things is now your cage"

9. `Lesson 9 | Discomfort Becomes Attacks`
Quote: "That discomfort often flips into: irritation, distancing, subtle rebellion, minimizing your role."
Insight: "When your competence makes others uncomfortable, it flips into irritation and rebellion."
Unconventional Angle: "Your light is making their darkness visible, and they hate you for it"

10. `Lesson 10 | What You Actually Want to Hear`
Quote: "You want someone to say: 'I see what would break if you weren't here.'"
Insight: "'I see what would break if you weren't here.'"
Unconventional Angle: "You don't want thanks. You want witnesses."

11. `Lesson 11 | See It AND Act Accordingly`
Quote: "It's more than that. I think we want people to see that and act accordingly. Like... if you know I'm breaking my back to make this money, don't loan your buddy $50 so he can buy drugs the day before rent is due."
Insight: "It's not enough to acknowledge the work. You have to change your behavior."
Unconventional Angle: "Understanding without action is just sophisticated dismissal"

12. `Lesson 12 | Making Effort Legible`
Quote: "The only durable fix is making some effort legible. That means: letting minor failures happen, allowing some friction to be felt, not preemptively smoothing everything. Not to punish. Not to teach lessons. But to reintroduce reality."
Insight: "The only fix is letting failures happen. Not to punish, but to reintroduce reality."
Unconventional Angle: "You're not causing problems. You're revealing them."

13. `Lesson 13 | Won't vs Can't`
Quote: "You are very good at turning 'won't' into 'can't' in your head. You do this by: imagining hidden stressors, over-crediting intent, downplaying repeated behavior."
Insight: "You turn 'won't' into 'can't' by imagining hidden stressors and over-crediting intent."
Unconventional Angle: "Your understanding of their trauma is being weaponized against you"

14. `Lesson 14 | The System Only Responds to Load Distribution`
Quote: "The system doesn't care about explanations. It only responds to load distribution."
Insight: "Explanations don't matter. Only who carries what."
Unconventional Angle: "The system is already telling you everything you need to know"

15. `Lesson 15 | Infrastructure Gets Blamed`
Quote: "When infrastructure works, it's invisible. When it fails, everyone notices."
Insight: "When you're infrastructure, you're blamed for failures but not credited for prevention."
Unconventional Angle: "Heroes save the day. Infrastructure prevents it from needing saving. Guess who gets the movie."

16. `Lesson 16 | Relationships Are About Risk Reduction`
Quote: "Relationships aren't about whether something costs you money, they're about whether it reduces someone else's risk."
Insight: "Relationships aren't about what it costs you-they're about whether your presence reduces their risk."
Unconventional Angle: "If your presence doesn't change their behavior, you're not a partner. You're a subsidy."

17. `Lesson 17 | What Am I to You?`
Quote: "If my presence doesn't change how you act, plan, or sacrifice, then what am I to you?"
Insight: "If my presence doesn't change how you act, plan, or sacrifice, then what am I to you?"
Unconventional Angle: "The question you're afraid to ask because you already know the answer"

## Flattening Analysis
Flattening means "same semantic intent, but with reduced specificity, texture, and pressure." It usually looks like:
1. Detailed behavior replaced with summary labels.
2. Concrete social dynamics replaced with abstract statements.
3. Rhythm softened (fewer sharp edges, less lived detail).

Observed examples (server prompt module compared to runtime-rich module):
1. `Trina tension`
   - Flatter: `src/lib/server/ai/narrative.ts:34`
   - Richer: `src/lib/game/narrativeContext.ts:28`
2. `Money unresolved`
   - Flatter: `src/lib/server/ai/narrative.ts:41`
   - Richer: `src/lib/game/narrativeContext.ts:35`
3. `Sydney realization` (`cannot`/`is not` phrasing)
   - Flatter: `src/lib/server/ai/narrative.ts:51`
   - Richer: `src/lib/game/narrativeContext.ts:45`
4. `Oswaldo awareness` (`still acts` rhythm)
   - Flatter: `src/lib/server/ai/narrative.ts:58`
   - Richer: `src/lib/game/narrativeContext.ts:52`
5. `Exhaustion collapse line` (`the room` vs `the whole room`)
   - Flatter: `src/lib/server/ai/narrative.ts:65`
   - Richer: `src/lib/game/narrativeContext.ts:59`

## Rewrite Candidates Using The Active Lens
Lens source: `docs/WRITING_STYLE_REFERENCE_MOTIVE_DRIVEN_ANTHROPOMORPHISM.md`

### Priority 1: High-impact translation lines (server prompt copy)
1. `src/lib/server/ai/narrative.ts:29`
   - Current: "Oswaldo hasn't been challenged. The resentment is still underground."
   - Why: state report, low behavior signal.
2. `src/lib/server/ai/narrative.ts:31`
   - Current: "Things with Oswaldo are actively hostile. He's in full deflection mode."
   - Why: abstract labels instead of social motion.
3. `src/lib/server/ai/narrative.ts:38`
   - Current: "Something has to happen with Trina. The math does not work anymore."
   - Why: generic pressure statement, weak motive.
4. `src/lib/server/ai/narrative.ts:42`
   - Current: "The room is paid. One less fire to put out."
   - Why: functional but not relational; room behavior can carry consequence.
5. `src/lib/server/ai/narrative.ts:43`
   - Current: "Still eighteen short. The clock does not care."
   - Why: strong core, but can carry more social motive/body language.
6. `src/lib/server/ai/narrative.ts:52`
   - Current: "She thinks Oswaldo cannot help. He's just not built for this."
   - Why: explanatory summary rather than observed behavior.
7. `src/lib/server/ai/narrative.ts:61`
   - Current: "He can name what she does now, but still acts like naming it is the same as helping."
   - Why: analytic framing; behavior could land harder.
8. `src/lib/server/ai/narrative.ts:70`
   - Current: "Sydney is running on fumes. Every interaction costs more than it should."
   - Why: generic exhaustion idiom.
9. `src/lib/server/ai/narrative.ts:109`
   - Current: "Wrappers on the floor turns into open disrespect, and the room finally says the quiet part out loud."
   - Why: summary voice; should show social behavior in motion.
10. `src/lib/server/ai/narrative.ts:116`
    - Current: "The pattern gets too clean to deny: he can show up for everybody else, just not for her."
    - Why: diagnostic language, low scene embodiment.

### Priority 2: Lesson lines that can flatten if used too literally
1. `src/lib/narrative/lessonsCatalog.ts:23`
   - "When you're the structural support, you don't get applause. You get weight."
2. `src/lib/narrative/lessonsCatalog.ts:60`
   - "People often get resentful of the person carrying them, especially when competence makes them feel inadequate."
3. `src/lib/narrative/lessonsCatalog.ts:115`
   - "The better you do your job, the less visible it is. Stability erases evidence of effort."
4. `src/lib/narrative/lessonsCatalog.ts:167`
   - "When your competence makes others uncomfortable, it flips into irritation and rebellion."
5. `src/lib/narrative/lessonsCatalog.ts:219`
   - "The only fix is letting failures happen. Not to punish, but to reintroduce reality."
6. `src/lib/narrative/lessonsCatalog.ts:254`
   - "Explanations don't matter. Only who carries what."
7. `src/lib/narrative/lessonsCatalog.ts:272`
   - "When you're infrastructure, you're blamed for failures but not credited for prevention."

These lesson lines are excellent thematic anchors. They become flat only when copied directly into scene narration without behavioral embodiment.

### Priority 3: Prompt instruction surfaces that should enforce the lens
1. `src/lib/server/ai/narrative.ts:503` (`SYSTEM_PROMPT`)
2. `src/lib/server/ai/narrative.ts:790` (`getContinuePromptFromContext`)
3. `src/lib/server/ai/narrative.ts:452` (`formatNarrativeContextSection`)

These should explicitly reinforce:
1. behave, do not explain
2. motive over trait
3. consequence felt in social dynamics

## Drift Discussion
Drift is not only about word choice. There are three distinct drift vectors:

### 1) Content Drift
Same conceptual maps exist in two files with different copy:
1. `src/lib/server/ai/narrative.ts`
2. `src/lib/game/narrativeContext.ts`

Result: different prose pressure depending on which module is used.

### 2) Behavioral Drift
Context budgeting differs between modules:
1. Runtime-rich module can trim recent prose to enforce true cap (`src/lib/game/narrativeContext.ts:206`, `src/lib/game/narrativeContext.ts:213`).
2. Server prompt module keeps recent prose intact and drops older summaries only (`src/lib/server/ai/narrative.ts:237`).

Result: memory shape and model conditioning can diverge over long runs.

### 3) Architectural Drift
Runtime and prompt construction split:
1. Runtime context generation path: `src/lib/game/gameRuntime.ts:260`
2. Provider prompt path: `src/lib/server/ai/providers/grok.ts:198`

Result: changes made in one path do not automatically update the other.

## Reconstruction Buckets (Current Evidence-Based View)

### Can Reconstruct
1. Rich `Trina tension` variants.
2. Rich `money unresolved` line.
3. `Exhaustion level 5` with "whole room."
4. Contraction-heavy `Sydney realization` lines.
5. Contraction-heavy `Oswaldo awareness` lines.
6. Full lesson quote/insight/angle corpus (canonical in `src/lib/narrative/lessonsCatalog.ts`).

### Cannot Reconstruct (exact) from current repo evidence
1. Any stronger pre-repo or off-repo draft variants not committed to git.
2. Exact historical alternatives for lines where no alternate committed text exists.

### Unsure
1. How much perceived "neutering" is caused by string drift vs model behavior under current safety/retry flow.
2. Whether remaining output flattening is mostly prompt text, context format, or sanity gate side effects.

## Practical Bottom Line
If the goal is to stop recurring flattening:
1. Declare one canonical text source for translation layers.
2. Import/re-export from that single source instead of duplicating strings.
3. Keep this document as baseline snapshot and diff against it in future audits.

