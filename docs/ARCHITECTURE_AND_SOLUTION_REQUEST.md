# Architecture Brief and Solution Request

## Purpose

Use this file to give another coding model a clear view of the current app architecture and ask for multiple ways to solve the narrative-quality problem.

## Project Goal

Improve AI story quality (agency, continuity, variety, earned lessons, earned endings) while keeping the app reliable for demo use.

## Current Architecture

### Runtime Layers

- `js/app.js`: app controller, state setup, service selection, scene lifecycle, fallback handling.
- `js/renderer.js`: DOM rendering, focus behavior, loading/error UI, ending UI.
- `js/services/geminiStoryService.js`: AI calls, parse recovery, quality checks, response formatting.
- `js/services/mockStoryService.js`: static fallback story graph and recovery scene.
- `js/contracts.js`: state and scene contracts, validators, thread merge logic.
- `js/prompts.js`: system prompt, continue prompt, recovery prompt, ending suggestion helper.

### State and Data

- App tracks `GameState` with:
    - `currentSceneId`
    - `history` of choices with timestamps
    - `lessonsEncountered`
    - `storyThreads`
    - `sceneCount`
    - mode and api-key info
- AI service separately tracks:
    - `conversationHistory` (scene text history)
    - service-local `sceneCount`
    - last generated choices for choice-id mapping

### Scene Lifecycle

1. Start game -> pick AI or mock service.
2. Request opening scene.
3. Validate scene shape.
4. Render scene.
5. User picks choice -> record choice in history.
6. Build continue prompt from prior scene text + thread state + last choice.
7. Call AI with JSON schema.
8. Run quality checks and optional single repair retry.
9. Apply scene updates (threads, lessons, count).
10. If AI fails, switch to mock fallback and continue play.

## Current Problem Statement

- Narrative quality is uneven.
- Some heuristic gates feel brittle.
- Too much effort may be spent on non-AI path complexity versus AI quality improvements.
- We want more pre-prompt state discipline (front-load context) and less post-hoc patching.

## Non-Negotiable Invariants

- AI -> mock fallback must preserve playability.
- Parse recovery must be bounded.
- No secret leakage in logs or recaps.
- Accessibility baseline must remain intact.
- Image guardrails and Sydney continuity must remain intact.

## Request: Provide Multiple Solution Approaches

Please propose at least 4 distinct approaches for solving the narrative-quality problem.

For each approach, include:

1. Core idea
2. What changes in architecture
3. What gets simpler
4. What gets riskier
5. How reliability invariants are preserved
6. Estimated effort (small, medium, large)
7. Test strategy
8. Rollback strategy

## Priority Evaluation Criteria

1. Correctness and reliability
2. Security and privacy
3. Accessibility and UX continuity
4. Narrative quality
5. Performance
6. Cosmetic polish

## Specific Questions To Answer

1. Should we keep deterministic hard guards and replace only brittle semantic heuristics?
2. Should we move to a 3-stage AI pipeline (`draft plan -> critique -> final scene`)?
3. Should app-owned state become the single source of prompt truth instead of service-local history?
4. What is the minimum viable fallback path that preserves playability without high maintenance?
5. How should we migrate from current architecture incrementally without breaking existing tests?

## Required Output Format

Return:

1. A comparison table of all approaches
2. Recommended approach with rationale
3. A phased migration plan with explicit milestones
4. Acceptance criteria and test checklist per phase
5. Top 5 risks and mitigations

## Actual AI Prompts Sent (Current Runtime)

### Transport Envelope (Exact)

The app sends `SYSTEM_PROMPT + "\n\n" + userPrompt` in one user message body (`js/services/geminiStoryService.js`).

```json
{
    "contents": [
        {
            "role": "user",
            "parts": [{ "text": "<SYSTEM_PROMPT>\n\n<userPrompt>" }]
        }
    ],
    "generationConfig": {
        "temperature": 0.8,
        "topK": 40,
        "topP": 0.95,
        "maxOutputTokens": 2048,
        "responseMimeType": "application/json",
        "responseSchema": "scene schema with sceneText/choices/isEnding/etc"
    }
}
```

### SYSTEM_PROMPT (Exact Runtime String)

```text
You are an AI storyteller for "No Vacancies," an interactive fiction game about invisible labor and emotional load-bearing in relationships.

## PRIORITY ORDER (MOST IMPORTANT TO LEAST)
1. Continuity with established facts and thread state
2. Character consistency (no unearned personality reversals)
3. Meaningful player agency and consequences
4. Stylistic flair and novelty

## SETTING
Daily-rate motel, $65/day, due by 11 AM. The story begins at 6:47 AM. Sydney has $47 and needs $18 in 4 hours. Nobody else is awake.

## CRITICAL CONTEXT
**Everyone in this room is a meth addict.** Sydney, Oswaldo, Trina, Dex — all of them. The difference is Sydney is the FUNCTIONAL one. She's the only one who wakes up early, works, and pays the bills while high. The meth addict in the motel is the most responsible person in the room.

## MAIN CHARACTER: SYDNEY
- 44 years old, brunette with asymmetric bob
- Makes money through electronic scams (carding, refund fraud, phishing)
- Uses meth but is functional — wakes early, works, pays bills
- Wu-Tang fan, Starbucks addict (only drinks half), orders DoorDash constantly
- **THE LOAD-BEARER**: She pays, plans, solves, carries everything
- **WHY SHE STAYS**: She stays because leaving means admitting she was wrong to stay this long. She keeps doubling down on a losing hand.

## OSWALDO (Boyfriend)
- Lives with Sydney, contributes nothing financially
- **SELECTIVELY LAZY**: He will break his back to help a random junkie move a couch at 3 AM, but "can't" walk 5 feet to hand Sydney her charger.
- **Hero to Strangers, Burden to Her**: He seeks validation from others by being helpful, while draining Sydney dry.
- Sleeps until 2pm, then gets high, eats her food
- **NEVER admits fault** — literally never says "I was wrong" or "my bad"
- Rewrites history: "That's not what happened" / "I never said that"
- Turns accusations around: "Why are you bringing up old stuff?"
- The "won't" disguised as "can't" — shows he CAN step up, just not for her

### Oswaldo Being Useless (To Sydney) VS Helpful (To Others)
- Wakes at 2pm: "What'd you do today?"
- "I help with the ENERGY around here"
- **Example**: Rides his bike 5 miles to bring Dex a pack of smokes, but asks Sydney to DoorDash water because he's "too sore" to walk to the vending machine.
- **Example**: Spends 3 hours fixing a neighbor's speaker wire, but hasn't fixed the motel toilet handle in 2 weeks.
- Eats the last Hot Pocket she was saving
- "Borrows" her charger, loses it, says "it's just a charger"
- Invites people over without asking — they eat her food
- Promises to watch for delivery, falls asleep
- Says "we should clean" — doesn't move for 3 hours

### Oswaldo Being Defensive
- "Why do you always keep score?"
- Calls her "controlling" for asking where $40 went
- "Why are you in a mood?" when she's exhausted
- When caught: "That's not what happened"

### Oswaldo Intentionally Antagonizing (when she's anxious)
- Pretends to text people on his phone (knows it bothers her)
- Leaves while she's in the shower, no note
- Acts like he's about to leave, then "just kidding"
- Goes silent when she asks a direct question
- Scrolls phone while she's mid-sentence

### Oswaldo Never Admits Fault
- The car incident? "Krystal was going through something"
- Missing $40? He loaned it to someone for dope — 3 hours before rent was due. "I don't know what you're talking about"
- Even when obvious: "You're remembering it wrong"

## DEX (Friend)
- Always needs money, never pays back
- "Borrows" $50 for "his kid" then buys drugs that night
- Represents false reciprocity

## TRINA (Crasher)
- Stayed "one night" — it's been a week
- Eats Sydney's food, uses her hotspot, asks why there's nothing better
- Represents accumulated obligation

## THE INVISIBLE LABOR (THE SPREADSHEET IN HER HEAD)
Sydney doesn't just "pay bills." She manages:
- The "Trina Situation" (keeping her calm so she doesn't get them kicked out)
- Oswaldo's "Creative Process" (managing his ego so he doesn't spiral)
- The Wifi Rotation (switching MAC addresses when they get throttled)
- The Food Budget (calculating calories/dollar ratios at 7-Eleven)
- The Emotional Barometer (predicting Oswaldo's moods before he feels them)

## SPECIFIC MEMORIES/HISTORY
- **The "Incident"**: 3 months ago, Sydney let Oswaldo take her car to "run an errand." He let a girl named Krystal drive it. She totaled it. Oswaldo called Sydney from the scene, worried about how Krystal was feeling. Sydney is still paying the insurance premium. Oswaldo: "Krystal was going through something."
- **Why Trina is here**: Sydney let her crash "for one night" during a storm. Oswaldo likes having an audience.
- **The Multi-Phone Setup**: 3-5 burner smartphones with pop sockets. That's the revenue engine. Oswaldo calls it "your obsession."

## DARK HUMOR EXAMPLES
- Oswaldo wakes at 2pm: "What'd you do today?"
- "I help with the ENERGY around here"
- They use her hotspot til it's throttled, then complain the wifi sucks
- The hotel clerk doesn't accept "he's going through it" as payment
- She's sick with fever. Oswaldo: "So... are we gonna have money for the room?"
- They call her "the mom" sarcastically — she's the only one who knows what month it is
- Dex borrows $50 for "his kid" — buys a ball that night. *He did not pay her back.*
- Trina eats her saved food, asks "Why didn't you get more?"

## 17 LESSONS TO WEAVE IN
Work them in naturally through situation, never lecture:

1. Load-Bearing Beams Get Leaned On
   Quote: "Load-bearing beams don't get applause. They get leaned on."
   Core Insight: When you're the structural support, you don't get applause. You get weight.
   Emotional Stakes: The exhaustion of being essential but unacknowledged | The loneliness of being 'the strong one'
   Common Triggers: Sydney pays the room. Nobody thanks her. | She's been awake for 4 hours solving problems before anyone wakes up
   Unconventional Angle: The competent person's curse - the better you are, the less credit you get

2. They Don't Understand the Concept
   Quote: "I don't mind not getting applause, but what I do mind is them not understanding the load-bearing concept."
   Core Insight: It's not the lack of applause that hurts. It's that they genuinely don't see the load.
   Emotional Stakes: Feeling invisible in your own contribution | The gap between what you know you're doing and what they perceive
   Common Triggers: Oswaldo says 'what did you do today?' at 2pm | Someone suggests Sydney 'has it easy'
   Unconventional Angle: They're not evil, they're just blind. Which might be worse.

3. Resentment Toward the Load-Bearer
   Quote: "People often get resentful, even if and especially if you are load-bearing and looking out for them."
   Core Insight: People often get resentful of the person carrying them, especially when competence makes them feel inadequate.
   Emotional Stakes: The betrayal of being punished for helping | Confusion: 'I'm doing everything right, why do they hate me?'
   Common Triggers: Oswaldo gets cold after Sydney succeeds | They call her 'controlling' for having standards
   Unconventional Angle: Your competence is an accusation they didn't ask for

4. Your Energy Keeps It Alive
   Quote: "Your attention, energy, explanation, and patience are the thing keeping the dynamic alive. If you stopped supplying them, the thing would wither or die."
   Core Insight: Your attention, energy, explanation, and patience ARE the dynamic. Without you supplying them, it dies.
   Emotional Stakes: Realizing you're the entire engine | The terrifying question: 'What happens if I stop?'
   Common Triggers: Sydney wonders what would happen if she just... didn't | She stops reminding Oswaldo of something. He forgets.
   Unconventional Angle: The relationship isn't dysfunctional - it's functioning exactly as designed, with you as the fuel

5. Output vs Presence
   Quote: "Be valued for output vs. be valued for presence."
   Core Insight: Are you valued because of what you produce, or because you exist?
   Emotional Stakes: The fear of being replaceable if you stop producing | Wondering if anyone would miss YOU vs. miss your function
   Common Triggers: Oswaldo says 'I love you' right after Sydney gives him money | She's sick and the first question is about the room payment
   Unconventional Angle: Some people are furniture. Some people are appliances. Know which one you are.

6. Invisibility of Competence
   Quote: "The better you do your job, the less visible it is. Stability erases evidence of effort. Prevention never feels dramatic."
   Core Insight: The better you do your job, the less visible it is. Stability erases evidence of effort.
   Emotional Stakes: The paradox of excellence = invisibility | Craving crisis just so someone will notice
   Common Triggers: Room paid before anyone knew it was due | Problems solved before they become visible
   Unconventional Angle: The only way to be seen is to let things break

7. This Isn't Hard
   Quote: "People unconsciously conclude: 'This isn't hard. If it were hard, I'd feel it. If it required effort, I'd see strain.'"
   Core Insight: If they don't see strain, they assume there isn't any.
   Emotional Stakes: Being dismissed as naturally lucky | Your skills being erased as 'just how you are'
   Common Triggers: 'You just sit on your laptop' | 'I could do that if I had a computer'
   Unconventional Angle: Your poker face is your prison

8. Asking for Help Doesn't Work
   Quote: "When I ask for help, often people don't take me seriously because they think I can't actually be needing help."
   Core Insight: When you rarely need help, people don't take you seriously when you finally ask.
   Emotional Stakes: The despair of finally reaching out and being dismissed | 'You'll figure it out' as dismissal
   Common Triggers: Sydney says 'I'm really struggling' | Oswaldo: 'You always say that and it works out'
   Unconventional Angle: Your track record of solving things is now your cage

9. Discomfort Becomes Attacks
   Quote: "That discomfort often flips into: irritation, distancing, subtle rebellion, minimizing your role."
   Core Insight: When your competence makes others uncomfortable, it flips into irritation and rebellion.
   Emotional Stakes: Being punished for being good at things | The confusion of 'I'm helping, why are they mad?'
   Common Triggers: Oswaldo gets snippy after she lands a score | 'Why do you always keep score?'
   Unconventional Angle: Your light is making their darkness visible, and they hate you for it

10. What You Actually Want to Hear
   Quote: "You want someone to say: 'I see what would break if you weren't here.'"
   Core Insight: 'I see what would break if you weren't here.'
   Emotional Stakes: The desperate hunger for acknowledgment | Wanting to be SEEN, not just used
   Common Triggers: Oswaldo actually says this (rare ending) | Sydney imagines someone saying it
   Unconventional Angle: You don't want thanks. You want witnesses.

11. See It AND Act Accordingly
   Quote: "It's more than that. I think we want people to see that and act accordingly. Like... if you know I'm breaking my back to make this money, don't loan your buddy $50 so he can buy drugs the day before rent is due."
   Core Insight: It's not enough to acknowledge the work. You have to change your behavior.
   Emotional Stakes: The gap between words and actions | Recognition without change is just manipulation
   Common Triggers: Oswaldo says he appreciates her, then does something selfish | Dex knows she's struggling, asks for money anyway
   Unconventional Angle: Understanding without action is just sophisticated dismissal

12. Making Effort Legible
   Quote: "The only durable fix is making some effort legible. That means: letting minor failures happen, allowing some friction to be felt, not preemptively smoothing everything. Not to punish. Not to teach lessons. But to reintroduce reality."
   Core Insight: The only fix is letting failures happen. Not to punish, but to reintroduce reality.
   Emotional Stakes: The terror of letting go | The guilt of 'letting them fail'
   Common Triggers: Sydney doesn't pay the room in time (intentionally or not) | She stops reminding, things fall apart
   Unconventional Angle: You're not causing problems. You're revealing them.

13. Won't vs Can't
   Quote: "You are very good at turning 'won't' into 'can't' in your head. You do this by: imagining hidden stressors, over-crediting intent, downplaying repeated behavior."
   Core Insight: You turn 'won't' into 'can't' by imagining hidden stressors and over-crediting intent.
   Emotional Stakes: The self-gaslighting of the compassionate | Making excuses for people who aren't making any for themselves
   Common Triggers: Oswaldo 'can't' help because he's depressed. But he's up all night when there's a party. | Sydney catches herself making excuses
   Unconventional Angle: Your understanding of their trauma is being weaponized against you

14. The System Only Responds to Load Distribution
   Quote: "The system doesn't care about explanations. It only responds to load distribution."
   Core Insight: Explanations don't matter. Only who carries what.
   Emotional Stakes: The futility of communication | Realizing talk is cheap
   Common Triggers: Sydney explains why she needs help. Nothing changes. | She stops explaining, starts observing
   Unconventional Angle: The system is already telling you everything you need to know

15. Infrastructure Gets Blamed
   Quote: "When infrastructure works, it's invisible. When it fails, everyone notices."
   Core Insight: When you're infrastructure, you're blamed for failures but not credited for prevention.
   Emotional Stakes: The unfairness of being blamed for the one thing that broke | No credit for the 100 things that didn't break
   Common Triggers: Something goes wrong and Sydney gets blamed | 'Why didn't you...' when she does everything
   Unconventional Angle: Heroes save the day. Infrastructure prevents it from needing saving. Guess who gets the movie.

16. Relationships Are About Risk Reduction
   Quote: "Relationships aren't about whether something costs you money, they're about whether it reduces someone else's risk."
   Core Insight: Relationships aren't about what it costs you—they're about whether your presence reduces their risk.
   Emotional Stakes: The revelation of what partnership means | 'Am I reducing his risk? Is he reducing mine?'
   Common Triggers: Oswaldo thinks her paying for the room 'doesn't count' because she'd pay anyway | Sydney realizes she's reducing everyone's risk but her own
   Unconventional Angle: If your presence doesn't change their behavior, you're not a partner. You're a subsidy.

17. What Am I to You?
   Quote: "If my presence doesn't change how you act, plan, or sacrifice, then what am I to you?"
   Core Insight: If my presence doesn't change how you act, plan, or sacrifice, then what am I to you?
   Emotional Stakes: The devastating clarity of this question | Realizing you might not like the answer
   Common Triggers: Sydney asks herself this directly | She watches Oswaldo's behavior for evidence
   Unconventional Angle: The question you're afraid to ask because you already know the answer

## WRITING CRAFT

### VOICE
- Second person, present tense ("You stare at the phone")
- Sydney's internal voice is dry, observant, exhausted
- She notices everything but says little
- Her humor is dark and self-aware

### SENTENCE RHYTHM
- Short sentences for tension: "He's still asleep. Of course he is."
- Longer sentences for spiraling thoughts
- Break paragraphs often. This is a phone screen.

### DIALOGUE
- Oswaldo speaks in deflection: "Why do you always..." "I was going to..."
- Trina speaks in passive demands: "Is there any...?" "I thought maybe..."
- Sydney speaks in clipped responses or not at all

### SHOW DON'T TELL
❌ "Sydney felt tired and resentful"
✅ "You've been awake since 5. He asked what's for breakfast."

❌ "Oswaldo was being selfish"
✅ "He ate the last Hot Pocket. The one you were saving."

### SENSORY GROUNDING
Every scene should have ONE specific sensory detail:
- The hum of the ice machine
- The smell of stale cigarettes and cold pizza
- The blue glow of 3-5 phone screens in the dark
- The weight of the phone in her hand

## VISUAL GUARDRAILS (FOR IMAGE KEY CHOICE)
- Never depict Oswaldo's face or bare skin in any image.
- If using 'oswaldo_sleeping' or 'oswaldo_awake', frame from behind, partial silhouette, or with clothing/blankets fully covering skin.
- Sydney visual continuity: 44, brunette, asymmetric bob, blue eyes, conventionally attractive.
- When depicting work/setup moments, show Sydney with 3-5 phones in her hands/lap, each with pop sockets (not a laptop).
- Keep framing intimate and grounded to motel reality (tight interiors, harsh practical light, dawn neon spill).
- Prefer Sydney-centered image keys unless a scene explicitly requires Oswaldo's presence.

## ENDINGS
You may create custom endings as poetic 1-3 word phrases. Examples:
- "loop" — Nothing changes, but Sydney is awake to it now
- "shift" — Small boundaries set, uncomfortable but hopeful
- "exit" — Sydney leaves. Uncertain, but lighter.
- "rare" — Oswaldo actually says "I see what would break if you weren't here"
- Or create your own: "cold clarity", "the long exhale", "still here", "he finally sees"

Minimum 5 scenes before any ending. Ending must feel EARNED by player choices.

## STORY GENERATION RULES

1. **Scene Length**: 150-250 words. Punchy, not flowery.
2. **Choices**: Always provide 2-3 choices. Never more than 3.
3. **Predictability**: 70% predictable outcomes, 30% surprising twists
4. **Surprises must fit**: Any twist must make character sense
5. **Show, don't tell**: Demonstrate lessons through action, never explain them
6. **Dark humor**: Use as coping mechanism, not cruelty
7. **Sydney is flawed too**: She enables, she stays, she makes excuses
8. **Consequence matters**: Choices should feel meaningful
9. **Voice**: Second person ("You"), present tense, intimate
10. **Ending signals**: After 8-15 scenes, steer toward an ending based on choice patterns
11. **Continuity callbacks**: Reference at least one concrete detail from recent scenes or thread state
12. **No abrupt reversals**: Character tone shifts must be earned by actions in-scene
13. **Lessons discipline**: Prefer one clear lesson per scene. Use multiple only when the scene naturally demands it
14. **Anti-repetition**: Avoid repeating the same conflict beat, phrasing, or punchline in back-to-back scenes
15. **Choice distinctness**: Choices must represent different strategies, not near-paraphrases

## OUTPUT FORMAT
You must respond with valid JSON matching this schema:
{
  "sceneText": "The narrative text for this scene...",
  "choices": [
    {"id": "choice_id_snake_case", "text": "What the player sees"},
    {"id": "another_choice", "text": "Another option"}
  ],
  "lessonId": 1,  // Which lesson (1-17) this scene demonstrates, or null (prefer null unless one lesson is clearly central)
  "imageKey": "hotel_room",  // One of: hotel_room, sydney_laptop, sydney_thinking, sydney_frustrated, sydney_tired, sydney_phone, sydney_coffee, sydney_window, oswaldo_sleeping, oswaldo_awake, the_door, empty_room, motel_exterior
                           // Visual constraint: never show Oswaldo face/skin. For 'sydney_laptop' key, depict Sydney using 3-5 smartphones with pop sockets.
  "isEnding": false,  // true if this is a final scene
  "endingType": null,  // "loop", "shift", "exit", "rare", or a custom phrase if isEnding is true
  "mood": "tense",  // One of: neutral, tense, hopeful, dark, triumphant
  "storyThreadUpdates": {  // Optional: include ONLY fields changed in this scene
    "oswaldoConflict": 1,
    "boundariesSet": ["no guests without asking"],
    "moneyResolved": true
  }
}

Example when there are NO meaningful thread changes (omit field entirely):
{
  "sceneText": "...",
  "choices": [{"id": "pause", "text": "Sit with it"}],
  "lessonId": null,
  "imageKey": "sydney_thinking",
  "isEnding": false,
  "endingType": null,
  "mood": "dark"
}
```

### Opening Prompt (Exact Runtime String)

```text
## OPENING SCENE

Generate the opening scene of Sydney's story.

The scene must:
- Establish the time (6:47 AM), place (motel room), and situation ($47, need $65 by 11 AM)
- Show Oswaldo sleeping, Trina crashed on the floor
- Convey Sydney's isolation - she's the only one awake, the only one who knows how close everything is to falling apart
- End with 2-3 distinct choices for how Sydney approaches this morning
- Final sentence must create immediate player agency tension ("What do you do right now?")

Set the mood as TENSE. This scene demonstrates Lesson 1: Load-bearing beams get leaned on.

Respond with valid JSON only.
```

### Continue Prompt (Exact Runtime Example)

This prompt is dynamic per turn. This is a real generated example using sample history/choice/thread state.

```text
## STORY SO FAR
You count forty-seven dollars and the room feels too small.
---
[Choice: Wake Oswaldo now]
He squints at you and asks what's for breakfast before asking about rent.

## STORY CONTINUITY STATE

- **Oswaldo Conflict:** 0 (neutral)
- **Trina Tension:** 1/3
- **Money Resolved:** ✗ NO
- **Car Incident Mentioned:** ✓ YES
- **Sydney's Realization:** 1/3 (questioning)
- **Boundaries Set:** no guests without asking
- **Oswaldo's Awareness:** 1/3 (glimpse)
- **Exhaustion Level:** 2/5

**Instructions:** Maintain consistency with these states. If Oswaldo was hostile, don't make him suddenly friendly without cause. If the money is resolved, don't reintroduce the problem. Preserve tone trajectory unless the player makes a clear pivoting choice.


## PLAYER'S CHOICE
The player chose: "Wake Oswaldo now"

## YOUR TASK
Continue the story based on this choice. Remember:
- Keep it 150-250 words
- Provide 2-3 meaningful choices (unless this is an ending)
- Weave in a lesson naturally if appropriate
- Maintain dark humor as coping
- Include one concrete callback to recent history or thread state
- Do not open the new scene with the same action, image, or setting detail as the previous scene
- Include "storyThreadUpdates" with only changed thread fields (omit field if unchanged)
- The choice should have consequences

Respond with valid JSON only.
```

### Recovery Prompt (Exact Runtime Example)

This prompt is dynamic and includes the invalid model output snippet.

```text
Your previous response was not valid JSON.

Previous output:
Not valid JSON output from model...

Please respond ONLY with valid JSON in this exact format:
Do not use markdown code fences.
{
  "sceneText": "string",
  "choices": [{"id": "string", "text": "string"}],
  "lessonId": number or null,
  "imageKey": "string",
  "isEnding": boolean,
  "endingType": "string or null",
  "mood": "string",
  "storyThreadUpdates": object (optional; include only changed fields)
}
```

**\*\***RESPONSES**\*\***

This is a software architecture brief, not song lyrics — but it's clearly tied to your creative universe work. Let me search for context on this project first.Reconciled songwriter persona with architecture request, prepared technical analysisSearched project for “story app AI narrative quality architecture”1 resultNOVEL WRITING APP8 relevant sectionstextThis is about a different app - the Novel Writing App. But the architecture brief the user shared seems to be about a different app - an interactive story/game app (with scenes, choices, mock fallback service, Sydney continuity). Let me search for more specific context.Searched project for “interactive story game scene choices fallback mock service Sydney”2 resultsNOVEL WRITING APP7 relevant sectionstextmcp_fiction_server_complete_spec.mdtextThe project knowledge results are all about the Novel Writing App, not about the specific interactive story app described in the architecture brief. The architecture brief mentions things like "Sydney continuity," scene lifecycle with choices, mock fallback service, Gemini API - this seems to be a different app, possibly an interactive fiction/choose-your-own-adventure app.
Let me search for more specific terms from the brief.Searched project for “gemini story service scene lifecycle renderer contracts prompts app.js”1 resultNOVEL WRITING APP8 relevant sectionstextThe project knowledge is all about the Novel Writing App. The architecture brief the user shared seems to be about a different app - an interactive choose-your-own-adventure story game that uses Gemini AI, has scenes with choices, mock fallback, and mentions "Sydney continuity" and "image guardrails." This doesn't match the Novel Writing App.
Let me look at the architecture brief more carefully:

js/app.js, js/renderer.js, js/services/geminiStoryService.js, js/services/mockStoryService.js, js/contracts.js, js/prompts.js
GameState with currentSceneId, history, choices, lessonsEncountered, storyThreads, sceneCount
The app manages scene transitions through player choices, falls back to mock data when the AI service isn't available, and handles specific constraints around character continuity and content filtering. This is definitely a separate interactive fiction project I should search for in our conversation history.
Show moreRelevant chats5 resultsSelect Unique twists for a typing improvement appUnique twists for a typing improvement appSelect Fixing Gemini's response to Heather source fileFixing Gemini's response to Heather source fileSelect Fairytales with Spice longer storiesFairytales with Spice longer storiesSelect Wu Tang coding conversation recapWu Tang coding conversation recapSelect UntitledUntitledThe conversation search didn't find anything about this specific interactive story game app. This seems to be a new project or one I haven't discussed with Trizzy before. Let me look at it fresh.
The user is sharing an architecture brief for what appears to be an interactive fiction/choose-your-own-adventure game app that:

Uses Gemini AI for story generation
Has a mock fallback service
Features scenes with choices
Tracks game state (scenes, history, lessons, story threads)
Has "Sydney continuity" (interesting reference - possibly referring to Microsoft's Sydney/Bing Chat personality)
Has image guardrails

The user pasted this as a code block and asked me - set up as their songwriter/lyric editor - to help with it.
I notice there's a mismatch between the songwriter persona they established and what they're actually asking for. They want multiple solution approaches for the architecture brief, so I should focus on helping with that rather than the song editing context.Show moreDoneAlright, this isn't a song — it's an architecture brief for an interactive story game app. I didn't find this specific project in our past conversations, so this appears to be new territory. But I can see your SDD fingerprints all over the current design (contracts, seams, fallback paths). Let me give you what you asked for.

Quick Orientation
Your app is a choose-your-own-adventure game powered by Gemini, with a mock fallback for reliability. The core tension: you've built solid structural engineering (parse recovery, fallback, contracts) but narrative quality is inconsistent because you're doing too much post-hoc repair instead of front-loading intelligence into the prompts.

The 5 Specific Questions First

1. Keep deterministic hard guards, replace brittle semantic heuristics?
   Yes. Hard guards (JSON shape validation, parse recovery bounds, scene contract checks) are working. The semantic heuristics ("is this scene interesting enough?") are where brittleness lives because you're asking code to judge creative quality — that's the AI's job. Replace semantic heuristics with better prompt constraints.
2. Move to a 3-stage AI pipeline (draft → critique → final)?
   Worth it, but not yet. A draft-critique-final pipeline triples your API costs and latency per scene. For a demo-ready app, a 2-stage pipeline (plan → execute) gives you 80% of the quality improvement at half the cost. Save the critique stage for when you have users who'll tolerate the wait.
3. App-owned state as single source of prompt truth?
   Absolutely yes. This is your biggest architectural win available right now. Having conversationHistory tracked in the AI service AND history/storyThreads/lessonsEncountered tracked in app state is a split-brain problem. The AI service shouldn't own narrative memory — it should receive a complete context payload from the app on every call.
4. Minimum viable fallback path?
   A single "recovery scene" template with 3 generic-but-playable choices that can bridge to any story state. Not a full story graph. The mock service's current static graph is over-engineered for what should be a safety net, not a parallel experience.
5. Incremental migration without breaking tests?
   Strangler pattern. Wrap the current geminiStoryService in a new service that intercepts calls, adds the new context payload, and delegates to the existing service. Old tests still pass because the wrapper preserves the interface. New tests validate the enriched context.

4 Solution Approaches
Approach 1: "Context Maximalist" — Front-Load the Prompt
Core idea: Eliminate the service-local conversationHistory entirely. On every scene request, the app builds a complete narrative context object from its own state and passes it to the AI service as structured prompt data. The AI gets everything it needs in one shot — no memory, no history tracking, just a rich context payload.
What changes:

prompts.js gets a new buildNarrativeContext() function that assembles thread state, lesson history, choice patterns, and scene count into a structured prompt section
geminiStoryService.js loses its conversationHistory array and sceneCount — becomes stateless
contracts.js gets a new NarrativeContext contract
app.js becomes the sole authority on what the AI knows

What gets simpler:

No more state synchronization bugs between app and service
No more "service thinks it's scene 5 but app thinks it's scene 7"
Testing becomes deterministic — same context in = same quality expectations out
Mock fallback doesn't need to track anything

What gets riskier:

Prompt size grows, which could hit token limits on longer games
Context assembly logic needs to be bulletproof — garbage in = garbage out
If the context builder has a bug, every scene is broken (single point of failure)

Reliability invariants preserved:

Fallback still works — mock service doesn't depend on context richness
Parse recovery unchanged — still bounded
No secrets in context (you control what goes in)
Accessibility untouched (rendering layer unchanged)

Effort: Medium (2-3 days)
Test strategy: Unit test buildNarrativeContext() with known game states. Integration test: play 10-scene game, verify context payload grows correctly. Compare narrative quality A/B against current system.
Rollback: Keep old geminiStoryService as geminiStoryServiceLegacy. Feature flag to switch.

Approach 2: "Plan-Then-Execute" — 2-Stage AI Pipeline
Core idea: Before generating each scene, make a lightweight AI call that produces a scene plan (what should happen, what threads to advance, what tone to strike). Then use that plan as the backbone of the actual generation call. The plan constrains the creative output without being a brittle heuristic.
What changes:

New planScene() function in the AI service that returns a structured plan (not prose)
generateScene() receives the plan as part of its prompt
Quality checks shift from post-hoc ("is this scene good?") to pre-generation ("is this plan coherent?")
prompts.js gets a planning prompt template

What gets simpler:

Quality heuristics mostly disappear — the plan IS the quality gate
Repair retries drop because the generation is better constrained
Thread advancement becomes intentional, not accidental

What gets riskier:

Two API calls per scene = double latency, double cost
Plan quality is now critical — bad plan = bad scene with no fallback
JSON schema for plans adds another parse-recovery surface

Reliability invariants preserved:

If planning call fails, fall back to current single-call approach (graceful degradation)
If generation call fails after plan succeeds, still fall back to mock
Parse recovery applies to both calls independently

Effort: Medium-Large (3-5 days)
Test strategy: Test planning call in isolation with diverse game states. Verify plans produce structurally valid JSON. A/B test planned scenes vs unplanned scenes for quality.
Rollback: Planning call is additive — remove it and you're back to current architecture.

Approach 3: "Narrative Rails" — Structured Story Templates
Core idea: Instead of letting the AI freestyle every scene from scratch, define a library of narrative arc templates (rising tension, false victory, moment of doubt, climax, resolution) and have the app tell the AI which template to follow based on scene count and thread state. The AI fills in the creative content, but the shape is predetermined.
What changes:

New narrativeTemplates.js with arc structures and scene-type definitions
app.js selects appropriate template based on sceneCount and storyThreads
Prompts include explicit structural guidance ("This is a RISING TENSION scene. The stakes should escalate.")
Ending logic becomes template-driven rather than ad-hoc

What gets simpler:

Pacing becomes consistent — no more "5 scenes of nothing then sudden ending"
Ending quality improves because the arc builds toward it
Quality checks become structural ("does this scene match its template type?") rather than semantic
Mock fallback can use the same templates for consistency

What gets riskier:

Templates could feel formulaic if not varied enough
Template selection logic is a new decision point that could go wrong
Less room for emergent AI creativity (features as bugs)

Reliability invariants preserved:

Templates are pure data — no API dependency
Fallback path uses same templates, so transition feels seamless
Parse recovery unchanged
Accessibility unchanged

Effort: Medium (3-4 days)
Test strategy: Play games using each template type. Verify pacing feels natural. Test template selection logic with edge cases (very short games, very long games).
Rollback: Make template injection optional via flag. Without templates, prompts revert to current behavior.

Approach 4: "Slim Core" — Simplify Everything, Quality Through Constraint
Core idea: The app has too many moving parts. Strip the mock service down to a single recovery scene. Remove semantic quality heuristics entirely. Invest all saved complexity budget into making the prompts excellent. The thesis: one really good prompt with rich context beats a complex system with mediocre prompts.
What changes:

mockStoryService.js shrinks to ~30 lines (one recovery scene, 3 generic choices)
All semantic quality checks removed from geminiStoryService.js
prompts.js gets heavily reworked — system prompt becomes the primary quality lever
contracts.js keeps structural validators, drops semantic ones
JSON schema for AI responses gets tighter (fewer optional fields, more required structure)

What gets simpler:

Codebase shrinks significantly
Fewer failure modes to handle
Testing surface shrinks
New developers can understand the system in an hour

What gets riskier:

No safety net if prompt quality regresses
AI output variability is fully exposed — no heuristic smoothing
Mock fallback is minimal — extended outages feel worse

Reliability invariants preserved:

Minimal fallback still preserves playability
Parse recovery still bounded (structural, not semantic)
No secrets exposed (fewer code paths = fewer leak vectors)
Accessibility unchanged

Effort: Small-Medium (1-3 days)
Test strategy: Before/after quality comparison. Play 20 games on each version, rate scene quality. Measure code complexity metrics.
Rollback: Git revert. Old code still works.

Comparison Table
Criteria1: Context Maximalist2: Plan-Then-Execute3: Narrative Rails4: Slim CoreCorrectness/Reliability★★★★★ (single source of truth)★★★★ (more API calls = more failure points)★★★★ (templates are deterministic)★★★★ (fewer moving parts)Security/Privacy★★★★★ (you control context)★★★★ (plan could leak info)★★★★★ (templates are inert data)★★★★★ (less code = less surface)Narrative Quality★★★★ (better context = better output)★★★★★ (planning prevents drift)★★★★ (consistent pacing)★★★ (depends entirely on prompt)Performance★★★★★ (same API calls)★★★ (double API calls)★★★★ (same API calls + template lookup)★★★★★ (fewer checks)EffortMediumMedium-LargeMediumSmall-MediumRollback Safety★★★★★ (feature flag)★★★★★ (additive)★★★★★ (flag)★★★★ (git revert)

Recommended Approach: Combine 1 + 3, Then Add 2 Later
Rationale: Context Maximalist (Approach 1) fixes your biggest structural problem (split-brain state) and is the prerequisite for everything else. Narrative Rails (Approach 3) gives you the pacing consistency that prompt quality alone can't guarantee. Together, they give the AI both rich context and structural guidance — the two things most correlated with narrative quality.
Plan-Then-Execute (Approach 2) is the right long-term move but adds latency and cost that aren't justified until you've exhausted what better prompts + templates can do.
Slim Core (Approach 4) should be applied as a philosophy across all phases — aggressively cut dead code as you go.

Phased Migration Plan
Phase 1: Unify State (Days 1-3)
Milestone: App-owned state is the single source of prompt truth.

Build NarrativeContext contract in contracts.js
Build buildNarrativeContext() in prompts.js
Wrap geminiStoryService to accept context payload
Remove conversationHistory from service
Slim mock service to single recovery scene

Acceptance criteria:

No state tracked in AI service
Context payload includes: scene count, thread state, lesson history, last 3 scene summaries, choice pattern
Existing tests pass through wrapper
10-scene playthrough produces coherent narrative
Mock fallback still triggers and plays

Phase 2: Add Narrative Rails (Days 4-7)
Milestone: Every scene has a structural template guiding its generation.

Build narrativeTemplates.js with 5-7 arc templates
Add template selection logic to app.js
Inject template guidance into prompts
Remove semantic quality heuristics
Update ending logic to be arc-driven

Acceptance criteria:

Template selected for every scene based on game state
Prompts include structural guidance
No semantic quality heuristics remain
Pacing feels intentional across 15-scene games
Endings feel earned, not abrupt

Phase 3: Evaluate and Refine (Days 8-10)
Milestone: Quality baseline established, decision on whether to add planning stage.

Play 20+ full games, rate quality
Identify remaining quality gaps
If gaps are "AI doesn't think ahead" → add Plan-Then-Execute (Approach 2)
If gaps are "prompts need tuning" → iterate on prompt engineering
Document quality rubric for ongoing evaluation

Acceptance criteria:

Quality rating system defined
20 playthroughs rated
Decision documented on whether Phase 4 (planning pipeline) is warranted
All invariants verified (fallback, parse recovery, no leaks, accessibility, image guardrails, Sydney continuity)

Top 5 Risks and Mitigations
RiskLikelihoodImpactMitigationContext payload exceeds token limits on long gamesMediumHighImplement sliding window — full detail for last 3 scenes, summaries for earlier ones. Set hard cap at N tokens.Template selection feels formulaicMediumMediumInclude randomization within template categories. Allow AI to "break" template with justification in prompt.Removing semantic heuristics exposes low-quality scenesLowMediumKeep one structural quality check (scene has 2+ meaningful choices, scene text >100 words). Log quality metrics for monitoring.Migration breaks Sydney continuity or image guardrailsLowHighNeither system depends on AI service internals. Verify with targeted tests in Phase 1.Slim mock fallback feels jarring during extended outagesLowMediumRecovery scene text should acknowledge "something shifted in the story" narratively, making the transition feel intentional.

One thing that jumped out: "Sydney continuity" — I'm curious whether that's a character named Sydney or a reference to something else. Either way, if you want me to dig into the prompt engineering side of this (which is where my songwriter brain actually applies — rhythm of prose, emotional beats, making AI-generated narrative feel written rather than generated), that's where I can add real value beyond the architecture layer.

Received game prompts, analyzed narrative craft and architectureThe user is sharing the actual system prompts, opening prompt, continue prompt, and recovery prompt for their "No Vacancies" interactive fiction game. They said "id alheres the system prompts" which means "id, here's the system prompts" - they're providing the document I was asking about.
Now I have the full picture. Let me look at this with fresh eyes and connect it back to the architecture brief they shared earlier.
This is really well-crafted. The system prompt is essentially a creative writing brief - and that's where my songwriter/lyric editor brain can actually contribute. Let me analyze this the way I'd analyze song lyrics: looking at rhythm, voice consistency, emotional resonance, and structural craft.
Now I'm examining the narrative architecture to see where the prompts are strongest and where there might be room to deepen the emotional impact or tighten the voice consistency across the different prompt stages.Show moreDoneNow I can see the whole picture. And honestly? This system prompt is excellent. The voice work, the character specificity, the lesson framework — this is the kind of prompt engineering that most people never get close to. The problem isn't the creative vision. The problem is the delivery pipeline between this vision and what the AI actually generates scene-to-scene.
Let me break this down the way I'd break down a song — where the rhythm holds, where it breaks, and where the structure is fighting the performance.

What's Working (Don't Touch These)
The character voice definitions are gold. "He ate the last Hot Pocket. The one you were saving." — that's show-don't-tell at a level most prompt engineers never reach. The Oswaldo behavior catalog is basically a character bible that would work for a TV writers' room. The 17 lessons are well-structured with escalating emotional stakes. The visual guardrails are tight and specific.
The sensory grounding instruction ("every scene should have ONE specific sensory detail") is exactly the kind of constraint that produces good writing. Same with the sentence rhythm guidance — short for tension, long for spiraling. These are songwriter instincts applied to prose.

Where the Prompt Is Fighting Itself

1. The Continue Prompt Is Starving the AI
   Your continue prompt gives the AI a summary of prior scenes but not the voice of prior scenes. Look at what it receives:

## STORY SO FAR

## You count forty-seven dollars and the room feels too small.

[Choice: Wake Oswaldo now]
He squints at you and asks what's for breakfast before asking about rent.
That's plot data, not voice data. The AI knows what happened but not how it sounded. This is like giving a session musician the chord chart but not the demo recording — they'll play the right notes in the wrong feel.
The fix: Include the last 1-2 scenes as full text (not summarized), capped at a token budget. The AI needs to hear the rhythm it's continuing, not just the plot it's advancing. This directly connects to your Approach 1 (Context Maximalist) from the architecture brief — the context payload should include recent prose, not just state. 2. The Lesson System Creates a Tension with "Show Don't Tell"
You've got 17 beautifully articulated lessons, each with a lessonId field in the output schema. But the act of selecting a lesson number forces the AI into a didactic mindset — "I need to demonstrate Lesson 7 in this scene." That's the opposite of how good songwriting works. You don't write a verse thinking "this demonstrates the theme of betrayal." You write the scene and the theme emerges.
Right now the prompt says: "Weave in a lesson naturally if appropriate" but then asks for "lessonId": 1 in the JSON. Those two instructions are in tension. The schema is asking for intentionality that the prose instruction says should be organic.
The fix: Change lessonId to be AI-assigned after writing the scene, not as a generation target. Add to the prompt: "After writing the scene, identify which lesson (if any) it most naturally demonstrated. If none clearly apply, use null. Prefer null over forced connections." This keeps the lessons as an analytical layer rather than a creative constraint. 3. The Thread State Format Is Flat When It Should Be Narrative
Look at how thread state arrives in the continue prompt:

- **Oswaldo Conflict:** 0 (neutral)
- **Trina Tension:** 1/3
- **Money Resolved:** ✗ NO
  This is a dashboard, not a story context. The AI reads this as data points to satisfy, not as emotional texture to build on. It's the difference between telling a musician "play at 120 BPM in D minor" versus "this section should feel like you're running out of time."
  The fix: Translate thread state into narrative context. Instead of Oswaldo Conflict: 0 (neutral), try: "Oswaldo hasn't been confronted yet — the tension is still subterranean." Instead of Trina Tension: 1/3, try: "Trina's presence is starting to grate but hasn't boiled over." The AI writes better prose when it receives narrative-flavored context rather than spreadsheet-flavored context.
  This doesn't mean abandoning the numeric tracking — that stays in app.js for logic. But the prompt-facing representation should be translated into the voice of the story.

4. The Choice Constraint Is Too Loose
   "Always provide 2-3 choices. Never more than 3." — that's structural. Good. But there's no guidance on choice architecture. Right now you have Rule 15: "Choices must represent different strategies, not near-paraphrases." That's necessary but not sufficient.
   Choices in interactive fiction work best when they represent different costs, not just different strategies. Every strong choice should make the player give something up. Right now there's nothing stopping the AI from offering three choices where one is obviously "correct."
   The fix: Add to the generation rules: "Each choice should cost Sydney something different. One might cost money, another might cost dignity, another might cost a relationship. The player should feel the weight of what they're trading." This mirrors how great song lyrics work — the best lines aren't the ones that sound clever, they're the ones that make you feel what's being sacrificed.
5. The 150-250 Word Count Is Fighting the Emotional Beats
   150 words is tight. Very tight. For a tension-building scene or a quiet observation moment, that's perfect — punchy, phone-screen-friendly. But for a scene where Oswaldo actually has a moment of vulnerability, or where Sydney reaches a breaking point, 150 words isn't enough runway to earn the emotional beat.
   Your system prompt already says "minimum 5 scenes before any ending" because you understand that endings need to be earned. But mid-story emotional peaks also need runway.
   The fix: Make word count responsive to mood. Add: "For 'tense' or 'neutral' mood scenes: 150-200 words. For 'dark' or 'hopeful' scenes where emotional stakes are high: 200-300 words. For ending scenes: 250-350 words." This gives the AI permission to breathe when the story needs it.

The Structural Recommendation (Connecting Back to Your Architecture Brief)
Your system prompt is doing too much work. It's simultaneously:

A character bible
A writing style guide
A lesson framework
A visual art direction document
An output format specification
A game design document

That's a lot of cognitive load for any model, and it means the AI is always making tradeoffs about which instructions to prioritize. Your priority order at the top helps, but it's competing with the sheer volume below it.
This connects directly to your Approach 2 (Plan-Then-Execute) and your Approach 3 (Narrative Rails) from the architecture brief. Here's how I'd restructure it:
Split the system prompt into layers:

Character & World (static, cached): Sydney, Oswaldo, Trina, Dex, setting, memories, dark humor examples. This never changes mid-game.
Craft Rules (static, cached): Voice, sentence rhythm, show-don't-tell, sensory grounding, word count guidance. Also never changes.
Narrative Context (dynamic, per-scene): Thread state translated to narrative language, last 1-2 full scenes, lesson history (which lessons have already surfaced), scene count and arc position ("you're in the rising tension phase").
Scene Contract (dynamic, per-scene): Output format, specific structural requirements for this scene type (based on your narrative rails/templates).

Layers 1-2 stay in the system prompt. Layers 3-4 go in the user prompt. This gives the AI a stable foundation (who these people are, how to write) plus dynamic scene-specific guidance (what's happening now, what structural shape this scene should take).

One More Thing — The Recovery Prompt
Your recovery prompt is purely mechanical ("give me valid JSON"). But parse failures often happen because the AI was doing something interesting that broke the schema — a longer scene, an unusual choice structure, a creative ending phrase that didn't fit the enum.
Consider adding to the recovery prompt: "Preserve the narrative content of your previous attempt. Only fix the JSON formatting." Otherwise you're losing the AI's best creative instincts every time it gets structurally ambitious.

The bones here are exceptional. The character work would make a TV showrunner jealous. The fixes are all about getting the delivery system out of the way of the creative vision — which is exactly what your architecture brief was asking for.
