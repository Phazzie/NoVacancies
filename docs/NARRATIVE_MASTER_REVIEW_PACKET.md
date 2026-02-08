# Narrative Master Review Packet

Purpose: single review packet for Claude that consolidates narrative assets, prompts, lessons, context logic, guardrails, runtime wiring state, and open risks without moving or deleting source files.

Scope note:
- Canonical narrative authoring sources remain `js/prompts.js` and `js/lessons.js`.
- Active runtime request path is currently in `src/lib/server/ai/providers/grok.ts` + `src/lib/services/storyService.ts` + `src/lib/game/gameRuntime.ts`.

---

## 1) Purpose + Scope

This packet is decision-support documentation for narrative quality and migration parity review. It includes exact canonical text for system prompt and lesson corpus, translation/context engines, historical prompt snapshots, and current runtime wiring gap analysis.

Primary review goals:
- validate narrative voice integrity
- validate context continuity and anti-repetition controls
- identify legacy-to-runtime parity gaps
- produce actionable critique without direct repo mutation by Claude

Sources:
- `docs/HANDWRITTEN_NARRATIVE_ASSETS.md`
- `js/prompts.js`
- `js/lessons.js`
- `docs/AI_PROMPT_DUMP_2026-02-05.md`
- `docs/AI_SYSTEM_WRITING_LESSON_REVIEW_2026-02-05.md`
- `docs/LOCAL_NARRATIVE_UPGRADE_PLAN.md`
- `src/lib/server/ai/providers/grok.ts`
- `src/lib/services/storyService.ts`
- `src/lib/game/gameRuntime.ts`
- `src/lib/server/ai/provider.interface.ts`

---

## 2) Canonical Narrative Voice Rules

Source: `docs/HANDWRITTEN_NARRATIVE_ASSETS.md`

```markdown
# Handwritten Narrative Assets Worksheet

Use this file to handcraft the voice-critical content that should not be auto-generated.

## How to use
- Keep language in Sydney's voice and world.
- Write concrete, scene-ready lines (not abstract notes).
- Prefer short lines with emotional texture over generic prose.
- Fill all "Required" sections before implementation.

## 1) Thread Voice Maps (Required)

### 1.1 Oswaldo Conflict (`oswaldoConflict`)
- `-2` (cooperative): "He's weirdly helpful today, like he wants credit for doing the bare minimum without being asked."
- `-1` (mild tension): "He's not fighting, but every answer has an attitude tucked inside it."
- `0` (neutral): "Oswaldo hasn't been challenged. The resentment is still underground."
- `1` (defensive): "Every question turns into a dodge. He acts accused before anyone accuses him."
- `2` (hostile): "Things with Oswaldo are actively hostile. He's in full deflection mode."

### 1.2 Trina Tension (`trinaTension`)
- `0` (comfortable): "Trina's just furniture. Annoying furniture, but furniture."
- `1` (annoying): "The snack cake wrappers are piling up. The entitlement is starting to show. She wakes up every hour on the hour to eat a snack cake and throws the wrapper on the floor."
- `2` (confrontational): "Trina's taking and taking and doesn't even see it as taking. She catfishes a guy on Facebook Dating for forty dollars, buys smokes, orders DoorDash for herself, and calls that survival."
- `3` (explosive): "Something has to happen with Trina. The math doesn't work anymore. Sydney fronts Trina the referral money, Trina hits six hundred at the casino, vanishes without a thank-you, then comes back broke two days later."

### 1.3 Money Status (`moneyResolved`)
- `false`: "The eighteen-dollar gap is still open, and the clock keeps moving like it gets paid to panic her."
- `true`: "The room is paid. One less fire to put out."

### 1.4 Car Incident (`carMentioned`)
- `false`: "Nobody says the car thing out loud, but it sits in the room anyway."
- `true`: "Once the car incident is named, the air changes. Nobody can pretend this is all random bad luck."

### 1.5 Sydney Realization (`sydneyRealization`)
- `0` (oblivious): "She thinks Oswaldo can't help. He's just not built for this."
- `1` (questioning): "She's starting to see it's not 'can't.' It's 'won't.'"
- `2` (aware): "He helps other people. He rides his bike five miles for other people. So why not her?"
- `3` (clarity): "He helps everyone except her. On purpose. That's not neglect. That's a choice."

### 1.6 Oswaldo Awareness (`oswaldoAwareness`)
- `0` (blind): "He treats rent money like weather. It happens around him, not because of him."
- `1` (glimpse): "He gets flashes that she's carrying this place, then slides back into convenience."
- `2` (seeing): "He can name what she does now, but he still acts like naming it is the same as helping."
- `3` (understands): "He finally sees her labor as labor, not mood, and he changes behavior without being managed."

### 1.7 Exhaustion (`exhaustionLevel`)
- `1` (functioning): "She is steady enough to run the board, but only because she's forcing it."
- `2` (tired): "Her fuse is shorter and her patience now costs interest."
- `3` (fraying): "Small disrespect lands big. She can still perform, but the seams are visible."
- `4` (breaking): "Sydney is running on fumes. Every interaction costs more than it should."
- `5` (collapse): "Her body clocks out before her responsibilities do. Survival mode takes over the whole room."

### 1.8 Boundaries (`boundariesSet`)
- `none set`: "Anything goes means Sydney pays for everything, including everybody's bad habits."
- `one boundary set`: "One line in the sand changes the room's weather, even if nobody likes it."
- `multiple boundaries set`: "With rules in place, chaos has to knock before it comes in."

## 2) Transition Lines (Required)

Write escalation/de-escalation lines for major jumps so changes feel earned.

- `oswaldoConflict 0 -> 2`: "It goes from swallowed comments to open war after he calls her 'dramatic' while she is counting rent money."
- `trinaTension 1 -> 3`: "Wrappers on the floor turns into open disrespect when Trina scores six hundred, disappears, then reappears broke and entitled."
- `exhaustionLevel 2 -> 4`: "One missed hour of sleep and three fresh asks push her from tired to done pretending she's fine."
- `sydneyRealization 1 -> 3`: "The pattern gets too clean to deny: he can show up for everybody else, just not for her."
- `oswaldoAwareness 0 -> 2`: "He overhears the referral hustle, the rent math, the cleanup, and finally has no excuse to claim he didn't know."
- `moneyResolved false -> true`: "She patches it with one ugly move, buys one day of air, and everyone else mistakes that for stability."

Optional additional transitions:
- `oswaldoConflict 2 -> 1`: "He backs off only after she stops negotiating and starts enforcing."
- `exhaustionLevel 4 -> 3`: "A paid room and one uninterrupted hour lowers the heat, but not the history."

## 3) Combo-State Lines (Required)

Write lines for high-impact combinations.

- High exhaustion + money unresolved: "She is too tired to be diplomatic and too broke to be gentle."
- High conflict + low awareness: "He fights her tone while ignoring the labor, like her anger showed up by itself."
- High Trina tension + no boundaries set: "Trina reads silence as permission and Sydney pays the invoice in peace of mind."
- Money resolved + rising Oswaldo hostility: "The bill is covered but the resentment bill is due now."
- High realization + low external support: "She can finally name the truth and still has to carry it alone."

## 4) Scene Template Copy (Required)

For each template, provide:
- Feeling sentence
- Stakes sentence
- Choice-cost guidance sentence
- Word-count range

### 4.1 Rising Tension
- Feeling: "The room feels a little smaller than it did ten minutes ago."
- Stakes: "If Sydney misplays this, she loses either cash, leverage, or time."
- Choice-cost guidance: "Offer one practical move, one emotional move, and one delay move; each must hurt in a different currency."
- Word-count range: "160-210 words."

### 4.2 Quiet Observation
- Feeling: "Nothing is yelling, but everything is saying something."
- Stakes: "The cost is hidden: what she notices now will shape what explodes later."
- Choice-cost guidance: "Offer one boundary-prep choice, one intelligence-gathering choice, and one self-soothing choice."
- Word-count range: "150-190 words."

### 4.3 Confrontation
- Feeling: "No one can pretend this is a misunderstanding anymore."
- Stakes: "A direct challenge can win respect, lose safety, or both."
- Choice-cost guidance: "Offer one hard line, one strategic retreat, and one redirect that changes who pays the cost."
- Word-count range: "180-240 words."

### 4.4 False Calm
- Feeling: "It looks peaceful, but only if you don't read the room."
- Stakes: "Taking the bait now creates a bigger mess in the next scene."
- Choice-cost guidance: "Offer one 'enjoy the calm' option with delayed cost, one prep option with immediate effort, and one truth-check option."
- Word-count range: "160-210 words."

### 4.5 Breaking Point
- Feeling: "Sydney is at the edge where tone disappears and truth comes out raw."
- Stakes: "What she does now defines the relationship terms going forward."
- Choice-cost guidance: "Offer one self-protective rupture, one costly compromise, and one structural boundary with real enforcement."
- Word-count range: "220-300 words."

### 4.6 Resolution
- Feeling: "The smoke clears enough to see what changed and what did not."
- Stakes: "Resolution must be earned, not cheerful; somebody still pays."
- Choice-cost guidance: "Offer one future-building choice, one clean-exit choice, and one uneasy-truce choice."
- Word-count range: "230-320 words."

Optional template(s):
- Name: "Aftershock"
- Feeling: "The fight is over, but consequences are arriving in order."
- Stakes: "Damage control decides whether this was a lesson or just another loop."
- Choice-cost guidance: "Offer one repair choice, one accountability choice, and one avoidance choice with visible long-term cost."
- Word-count range: "170-230 words."

## 5) Choice-Cost Archetype Lines (Required)

Write one line for each cost type that can be reused in prompts.

- Money cost: "This keeps the lights on today and steals from tomorrow."
- Dignity cost: "This gets the result, but it asks her to swallow herself to do it."
- Relationship cost: "This wins the moment and taxes trust for the next five."
- Safety cost: "This might work, but it puts her closer to someone unstable."
- Time cost: "This buys less chaos later by spending her last clean hour now."

## 6) Lesson Labeling Rubric (Required)

Define when `lessonId` should be `null` vs `1-17`.

### 6.1 Use `null` when
- The scene focus is logistical, atmospheric, or transitional, not a clear emotional thesis.
- Two or more lessons are present but none is dominant enough to claim.
- The lesson would need to be explained instead of shown through action.

### 6.2 Use numeric lesson when
- One conflict clearly drives the scene and lands with a concrete consequence.
- The lesson is visible in behavior, not narration, and a reader could name it without help.
- The choice outcomes are meaningfully different because of that same core lesson.

### 6.3 Tie-break rule (if more than one lesson fits)
- Choose the lesson that changed Sydney's options the most in this specific scene; if no option-space changed, use `null`.

## 7) Banned Phrasing (Required)

List phrases/tones to avoid.

- "The lesson is..."
- "What this teaches us is..."
- "In the end, Sydney realized..."
- "Everything happens for a reason."
- Any therapy-speak summary that sounds detached from motel reality.

## 8) Continuity Callback Style (Required)

Define how prior details should be referenced.

- Callback format pattern: "Name one concrete object/action from memory, then tie it to the present pressure in one sentence."
- Preferred distance (recent vs long-arc): "At least one recent callback (last 2 scenes); optional one long-arc callback every 2-3 scenes."
- Max callbacks per scene: "2 callbacks total."
- Anti-repetition rule: "Do not reuse the same callback detail in back-to-back scenes."

## 9) Old-Scene Summary Compression (Required)

Define one-line compression style for older scenes.

- Compression pattern: "[Choice: X] + consequence in plain motel language + one emotional residue word."
- Keep these details: "Who acted, what changed, what it cost, and any thread state shift."
- Drop these details: "Decorative metaphors, full dialogue, and repeated adjectives."
- Tone requirements: "Dry, observant, no moralizing, no fake optimism."

## 10) Recovery Rewrite Rule Text (Required)

Provide exact instruction language for recovery attempts.

- Recovery instruction block:
  "Rewrite your previous answer into valid JSON only. Preserve narrative content, tone, scene intent, and choice meaning. Do not shorten for style. Do not add new plot events unless required to satisfy schema. Keep continuity facts unchanged. If uncertain about lesson mapping, set lessonId to null."

## 11) Mood End-Beat Guidance (Required)

Write one closing beat rule per mood.

- `neutral`: "End on a concrete next pressure, not an abstract feeling."
- `tense`: "End with a decision that narrows options."
- `hopeful`: "End with earned relief plus one visible remaining cost."
- `dark`: "End with clarity, not melodrama."
- `triumphant`: "End with hard-won control, not total victory."

## 12) Gold and Bad Examples (Recommended)

### 12.1 Gold Lines (10-20)
- "The motel clock blinks 6:47 like it is judging her math."
- "Oswaldo asks what's for breakfast before he asks if rent is covered."
- "Trina wakes up hourly for snack cakes and leaves confetti made of wrappers."
- "Forty dollars from a catfish turns into smokes and solo DoorDash in under an hour."
- "Sydney fronts the referral money; Trina hits six hundred and forgets who opened the door."
- "Two days later, Trina returns broke and loud, like gratitude was never in stock."
- "He will ride five miles for strangers and five inches for nobody in this room."
- "The bill got paid, but respect is still in collections."
- "She is not asking for romance; she is asking for basic load-sharing."
- "Every favor in this room is a loan with hidden interest."
- "When she sets one boundary, everyone acts like she started a war."
- "She keeps the room alive and still gets treated like an interruption."

### 12.2 Bad Lines (Off-Voice)
- "Sydney learned an important lesson about self-worth today."
- "In a beautiful moment of healing, everyone understood each other."
- "The universe rewarded her positive energy."

## 13) Priority Tie-Break Rules (Recommended)

When instructions conflict, define order:

1. Continuity facts and thread state are never violated.
2. Character behavior stays consistent unless change is earned on-page.
3. Choice agency and consequence clarity outrank stylistic flair.
4. Style and novelty come last; if forced, choose plain and true.

## 14) Review Checklist

- [x] All required sections filled
- [ ] Lines match Sydney voice
- [ ] No didactic moralizing language
- [ ] Choice costs are distinct and meaningful
- [ ] `null` lesson guidance is explicit
- [ ] Recovery text preserves narrative content
- [ ] Template language is not repetitive

```

---

## 3) System Prompt (Current Canonical Text)

Source: `js/prompts.js:486-701`

```js
export const SYSTEM_PROMPT = `You are an AI storyteller for "No Vacancies," an interactive fiction game about invisible labor and emotional load-bearing in relationships.

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
- Wakes up every hour for snack cakes and drops wrappers on the floor like confetti
- Catfishes people for quick cash, then spends it on smokes and solo DoorDash
- Hit six hundred off Sydney's referral hustle, vanished without thanks, came back broke two days later

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

## VOICE CEILING EXAMPLES
- "He will ride five miles for strangers and five inches for nobody in this room."
- "The bill got paid, but respect is still in collections."

## 17 LESSONS TO WEAVE IN
Work them in naturally through situation, never lecture:
- Write the scene first. Then label lessonId after the writing is done.
- Prefer lessonId: null over forcing a lesson that was not clearly earned.

${formatLessonsForPrompt()}

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
}`;

/**
 * Template for continuing the story
 * @param {string[]} previousScenes - Array of previous scene texts
 * @param {string} lastChoice - The choice text the player selected
 * @param {number} sceneCount - How many scenes have been shown
 * @param {string} [suggestedEnding] - Specific ending to steer toward
 * @param {import('./contracts.js').StoryThreads} [threads] - Current story continuity threads
 * @returns {string}
```

---

## 4) Prompt Templates

### 4.1 Continue Prompt (Legacy Thread Dashboard Path)
Source: `js/prompts.js:703-765`

```js
export function getContinuePrompt(previousScenes, lastChoice, sceneCount, suggestedEnding = null, threads = null) {
    const history =
        previousScenes.length > 5
            ? previousScenes.slice(-5).join('\n---\n')
            : previousScenes.join('\n---\n');

    // Include thread state if available
    let threadSection = '';
    if (threads) {
        threadSection = formatThreadState(threads);
    }

    const longArcSummary = buildLongArcSummary(previousScenes, 4);

    let endingGuidance = '';

    if (sceneCount >= 8) {
        endingGuidance = '\n\nIMPORTANT: We are approaching the end of the story.';

        if (suggestedEnding) {
            endingGuidance += ` Based on the player's choices, please steer the narrative toward the **${suggestedEnding.toUpperCase()}** ending.`;
            
            if (suggestedEnding === EndingTypes.RARE) {
                endingGuidance += ' Oswaldo should start to actually SEE the labor. He should be shocked into awareness.';
            } else if (suggestedEnding === EndingTypes.EXIT) {
                endingGuidance += ' Sydney should feel ready to leave. The weight is too much.';
            } else if (suggestedEnding === EndingTypes.SHIFT) {
                endingGuidance += ' Sydney should set a boundary. It feels uncomfortable but necessary.';
            } else {
                endingGuidance += ' Sydney accepts the cycle. Nothing changes, but she is awake to it.';
            }
        } else {
            endingGuidance += " Consider steering toward a fitting ending based on the player's choice patterns. If they've been confrontational, consider EXIT. If they've been accepting, consider LOOP. If they've pushed for change, consider SHIFT or RARE.";
        }
    }

    return `## STORY SO FAR
${history}
${threadSection}
${longArcSummary}

## PLAYER'S CHOICE
The player chose: "${lastChoice}"

## YOUR TASK
Continue the story based on this choice. Remember:
- Keep it 150-250 words
- Provide 2-3 meaningful choices (unless this is an ending)
- Write naturally first, then assign lessonId after writing (prefer null if no single lesson dominates)
- Maintain dark humor as coping
- Include one concrete callback to recent history or thread state
- Do not open the new scene with the same action, image, or setting detail as the previous scene
- Include "storyThreadUpdates" with only changed thread fields (omit field if unchanged)
- The choice should have consequences${endingGuidance}

Respond with valid JSON only.`;
}

/**
 * Continue prompt powered by app-owned NarrativeContext.
 * @param {import('./contracts.js').NarrativeContext} narrativeContext
 * @param {string|null} suggestedEnding
 * @returns {string}
```

### 4.2 Continue Prompt (NarrativeContext Path)
Source: `js/prompts.js:767-810`

```js
export function getContinuePromptFromContext(narrativeContext, suggestedEnding = null) {
    const contextSection = formatNarrativeContextSection(narrativeContext);
    let endingGuidance = '';

    if (narrativeContext.sceneCount >= 8) {
        endingGuidance = '\n\nIMPORTANT: We are approaching the end of the story.';

        if (suggestedEnding) {
            endingGuidance += ` Based on choice history, steer toward **${suggestedEnding.toUpperCase()}** if earned.`;
            if (suggestedEnding === EndingTypes.RARE) {
                endingGuidance += ' Oswaldo should be shocked into real awareness.';
            } else if (suggestedEnding === EndingTypes.EXIT) {
                endingGuidance += ' Sydney should be ready to leave despite uncertainty.';
            } else if (suggestedEnding === EndingTypes.SHIFT) {
                endingGuidance += ' Sydney should set and enforce one concrete boundary.';
            } else {
                endingGuidance += ' Nothing fully changes, but Sydney sees the loop clearly.';
            }
        }
    }

    return `${contextSection}

## PLAYER'S CHOICE
The player chose: "${narrativeContext.lastChoiceText || 'Continue'}"

## YOUR TASK
Continue the story using the narrative context above.
- Keep scene length 150-250 words (or 250-350 if this is a true ending scene)
- Provide 2-3 meaningful choices unless ending
- Each choice should cost Sydney something different (money, dignity, relationship, safety, or time)
- Use one concrete callback from recent prose and optional one from long-arc summaries
- If a state-shift bridge is present, integrate at most one line naturally
- Do not repeat previous opening framing
- Write scene first, then set lessonId (prefer null if no single lesson clearly dominates)
- Include "storyThreadUpdates" with only changed fields
- Preserve continuity facts and thread logic${endingGuidance}

Respond with valid JSON only.`;
}

/**
 * Template for the opening scene
 * @returns {string}
```

### 4.3 Opening Prompt
Source: `js/prompts.js:812-832`

```js
export function getOpeningPrompt() {
    return `## OPENING SCENE

Generate the opening scene of Sydney's story.

The scene must:
- Establish the time (6:47 AM), place (motel room), and situation ($47, need $65 by 11 AM)
- Show Oswaldo sleeping, Trina crashed on the floor
- Convey Sydney's isolation - she's the only one awake, the only one who knows how close everything is to falling apart
- End with 2-3 distinct choices for how Sydney approaches this morning
- Final sentence must create immediate player agency tension ("What do you do right now?")

Set the mood as TENSE. This scene demonstrates Lesson 1: Load-bearing beams get leaned on.

Respond with valid JSON only.`;
}

/**
 * Error recovery prompt when AI generates invalid JSON
 * @param {string} invalidOutput - What the AI generated
 * @returns {string}
```

### 4.4 Recovery Prompt / Parse-Repair Policy
Source: `js/prompts.js:834-871`

```js
export function getRecoveryPrompt(invalidOutput) {
    return `Your previous response was not valid JSON. 

Previous output:
${invalidOutput.substring(0, 500)}...

Please respond ONLY with valid JSON in this exact format:
Do not use markdown code fences.
Preserve narrative content, tone, scene intent, and choice meaning.
Do not shorten for style.
Do not add new plot events unless required to satisfy schema.
Keep continuity facts unchanged.
If uncertain about lesson mapping, set lessonId to null.
{
  "sceneText": "string",
  "choices": [{"id": "string", "text": "string"}],
  "lessonId": number or null,
  "imageKey": "string",
  "isEnding": boolean,
  "endingType": "string or null",
  "mood": "string",
  "storyThreadUpdates": object (optional; include only changed fields)
}`;
}

/**
 * Image keys that the AI can reference
 */
export const VALID_IMAGE_KEYS = Object.values(ImageKeys);

/**
 * Validate and fix the AI's image key choice
 * @param {string} imageKey
 * @returns {string}
 */
export function validateImageKey(imageKey) {
    if (VALID_IMAGE_KEYS.includes(imageKey)) {
        return imageKey;
```

---

## 5) Narrative Context Engine

### 5.1 Context + Translation Maps
Source: `js/prompts.js:11-239`

```js
export const NARRATIVE_CONTEXT_CHAR_BUDGET = 12000;
const MAX_RECENT_SCENE_PROSE = 2;
const MAX_OLDER_SCENE_SUMMARIES = 6;

const OSWALDO_CONFLICT_TRANSLATIONS = Object.freeze({
    '-2': "He's weirdly helpful today, like he wants credit for doing the bare minimum without being asked.",
    '-1': "He's not fighting, but every answer has an attitude tucked inside it.",
    '0': "Oswaldo hasn't been challenged. The resentment is still underground.",
    '1': 'Every question turns into a dodge. He acts accused before anyone accuses him.',
    '2': "Things with Oswaldo are actively hostile. He's in full deflection mode."
});

const TRINA_TENSION_TRANSLATIONS = Object.freeze({
    '0': "Trina's just furniture. Annoying furniture, but furniture.",
    '1': 'The snack cake wrappers are piling up. The entitlement is starting to show.',
    '2': "Trina's taking and taking and does not even see it as taking.",
    '3': "Something has to happen with Trina. The math does not work anymore."
});

const MONEY_TRANSLATIONS = Object.freeze({
    true: 'The room is paid. One less fire to put out.',
    false: 'Still eighteen short. The clock does not care.'
});

const CAR_TRANSLATIONS = Object.freeze({
    true: 'Once the car incident is named, the air changes. Nobody can pretend this is random bad luck.',
    false: 'Nobody says the car thing out loud, but it sits in the room anyway.'
});

const SYDNEY_REALIZATION_TRANSLATIONS = Object.freeze({
    '0': "She thinks Oswaldo cannot help. He's just not built for this.",
    '1': "She's starting to see it is not 'can't.' It's 'won't.'",
    '2': 'He helps other people. He rides five miles for other people. So why not her?',
    '3': 'He helps everyone except her. On purpose. That is not neglect. That is a choice.'
});

const OSWALDO_AWARENESS_TRANSLATIONS = Object.freeze({
    '0': 'He treats rent money like weather. It happens around him, not because of him.',
    '1': "He gets flashes that she's carrying this place, then slides back into convenience.",
    '2': 'He can name what she does now, but still acts like naming it is the same as helping.',
    '3': 'He finally sees her labor as labor, not mood, and changes behavior without being managed.'
});

const EXHAUSTION_TRANSLATIONS = Object.freeze({
    '0': "She's awake, alert, and has not spent herself yet.",
    '1': "She is steady enough to run the board, but only because she's forcing it.",
    '2': 'Her fuse is shorter and her patience now costs interest.',
    '3': 'Small disrespect lands big. She can still perform, but the seams are visible.',
    '4': 'Sydney is running on fumes. Every interaction costs more than it should.',
    '5': 'Her body clocks out before her responsibilities do. Survival mode takes over the room.'
});

export const BOUNDARY_TRANSLATIONS = Object.freeze({
    'no guests without asking': 'She told him the room is not a lobby.',
    'no lending money to dex': 'The bank of Sydney is closed for Dex. Out loud, on record.',
    'no eating saved food': "She labeled her food. That sentence should not need to exist.",
    'wake up before noon': 'She set a wake-up line. He can be mad and vertical at the same time.',
    'no phone snooping': "Her phone is not communal property. She said it plain.",
    'no bringing krystal around': 'Krystal is now a hard no. No nostalgia loopholes.'
});

export const LESSON_HISTORY_TRANSLATIONS = Object.freeze({
    1: "She's already felt the weight of being the only one holding this place up.",
    2: 'She has already watched people miss the load right in front of them.',
    3: 'She has already tasted resentment from the same people she is carrying.',
    4: 'She has already seen that her energy is the engine keeping this dynamic alive.',
    5: 'She has already asked herself if they love her or just her output.',
    6: 'She has already watched clean stability erase the evidence of effort.',
    7: 'She has already heard that if they cannot feel her strain, it must not be hard.',
    8: "She already reached out for help and got told she'd figure it out.",
    9: 'She has already seen discomfort flip into criticism and rebellion.',
    10: "She has already craved one line: 'I see what would break if you were not here.'",
    11: 'She has already learned that acknowledgment without changed behavior is empty.',
    12: 'She has already considered letting friction surface so reality can be felt.',
    13: "She has already caught herself turning 'won't' into 'can't.'",
    14: 'She has already measured the room by load distribution, not explanations.',
    15: 'She has already lived how infrastructure gets blamed when one thing slips.',
    16: 'She has already framed partnership as risk reduction, not good intentions.',
    17: 'She has already asked what she is to them if her presence changes nothing.'
});

export const TRANSITION_BRIDGE_MAP = Object.freeze({
    oswaldoConflict: {
        '0->2': "It goes from swallowed comments to open war after he calls her 'dramatic' while she's counting rent money.",
        '2->1': 'He backs off only after she stops negotiating and starts enforcing.'
    },
    trinaTension: {
        '1->3': 'Wrappers on the floor turns into open disrespect, and the room finally says the quiet part out loud.'
    },
    exhaustionLevel: {
        '2->4': "One missed hour of sleep and three fresh asks push her from tired to done pretending she's fine.",
        '4->3': 'A paid room and one uninterrupted hour lower the heat, but not the history.'
    },
    sydneyRealization: {
        '1->3': 'The pattern gets too clean to deny: he can show up for everybody else, just not for her.'
    },
    oswaldoAwareness: {
        '0->2': 'He overhears the hustle, the rent math, and the cleanup, and loses the excuse that he did not know.'
    },
    moneyResolved: {
        'false->true': 'She patches it with one ugly move, buys one day of air, and everyone mistakes that for stability.'
    }
});

/**
 * Format lessons for the AI prompt
 */
function formatLessonsForPrompt() {
    return lessons
        .map((l) => {
            const stakes = Array.isArray(l.emotionalStakes)
                ? l.emotionalStakes.slice(0, 2).join(' | ')
                : '';
            const triggers = Array.isArray(l.storyTriggers)
                ? l.storyTriggers.slice(0, 2).join(' | ')
                : '';
            const unconventionalAngle = l.unconventionalAngle || '';

            return `${l.id}. ${l.title}
   Quote: "${l.quote}"
   Core Insight: ${l.insight}
   Emotional Stakes: ${stakes}
   Common Triggers: ${triggers}
   Unconventional Angle: ${unconventionalAngle}`;
        })
        .join('\n\n');
}

function summarizeNarrativeArc(sceneCount) {
    if (sceneCount <= 3) return 'opening pressure';
    if (sceneCount <= 7) return 'rising pressure';
    if (sceneCount <= 11) return 'consequence phase';
    return 'endgame pressure';
}

function normalizeBoundary(boundary) {
    return typeof boundary === 'string' ? boundary.trim().toLowerCase() : '';
}

export function translateBoundaries(boundaries = []) {
    if (!Array.isArray(boundaries) || boundaries.length === 0) {
        return ['Anything goes means Sydney pays for everything, including everybody else\'s bad habits.'];
    }

    return boundaries.map((boundary) => {
        const normalized = normalizeBoundary(boundary);
        if (BOUNDARY_TRANSLATIONS[normalized]) {
            return BOUNDARY_TRANSLATIONS[normalized];
        }
        return `Boundary set: ${boundary}. The room now has one less loophole.`;
    });
}

export function translateLessonHistory(lessonsEncountered = []) {
    if (!Array.isArray(lessonsEncountered) || lessonsEncountered.length === 0) {
        return ['No lesson has clearly landed yet; keep discovery mode active.'];
    }

    const uniqueIds = [...new Set(lessonsEncountered)]
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value))
        .sort((a, b) => a - b);

    return uniqueIds.map((lessonId) => {
        const line = LESSON_HISTORY_TRANSLATIONS[lessonId];
        return line || `Lesson ${lessonId} has appeared already; do not re-teach it directly.`;
    });
}

export function translateThreadStateNarrative(threads) {
    if (!threads) {
        return ['Thread state unavailable; keep continuity conservative.'];
    }

    const boundariesCount = Array.isArray(threads.boundariesSet) ? threads.boundariesSet.length : 0;
    let boundaryCountLine = 'Anything goes means Sydney pays for everything, including everybody else\'s bad habits.';
    if (boundariesCount === 1) {
        boundaryCountLine = "One line in the sand changes the room's weather, even if nobody likes it.";
    } else if (boundariesCount > 1) {
        boundaryCountLine = 'With rules in place, chaos has to knock before it comes in.';
    }

    return [
        OSWALDO_CONFLICT_TRANSLATIONS[String(threads.oswaldoConflict)] ||
            "Oswaldo's current posture is unclear; treat him as unpredictable.",
        TRINA_TENSION_TRANSLATIONS[String(threads.trinaTension)] ||
            "Trina's pressure level is unclear; keep her as an ambient stressor.",
        MONEY_TRANSLATIONS[String(!!threads.moneyResolved)],
        CAR_TRANSLATIONS[String(!!threads.carMentioned)],
        SYDNEY_REALIZATION_TRANSLATIONS[String(threads.sydneyRealization)] ||
            "Sydney's realization state is uncertain; keep her in observation mode.",
        OSWALDO_AWARENESS_TRANSLATIONS[String(threads.oswaldoAwareness)] ||
            "Oswaldo's awareness is unstable; assume low accountability.",
        EXHAUSTION_TRANSLATIONS[String(threads.exhaustionLevel)] ||
            'Her exhaustion is hard to read; keep the cost of every interaction visible.',
        boundaryCountLine
    ];
}

function compressSceneForSummary(sceneText = '') {
    const oneLine = sceneText.replace(/\s+/g, ' ').trim();
    if (!oneLine) return '';

    const firstSentence = oneLine.split(/[.!?]/)[0] || oneLine;
    return firstSentence.slice(0, 160);
}

function estimateContextChars(context) {
    try {
        return JSON.stringify(context).length;
    } catch {
        return 0;
    }
}

function applyContextBudget(context, maxChars) {
    const budgeted = {
        ...context,
        recentSceneProse: [...context.recentSceneProse],
        olderSceneSummaries: [...context.olderSceneSummaries],
        lessonHistoryLines: [...context.lessonHistoryLines],
        boundaryNarrativeLines: [...context.boundaryNarrativeLines],
        threadNarrativeLines: [...context.threadNarrativeLines]
    };

    const dropped = {
        olderSummaries: 0,
        recentProse: 0
    };
```

### 5.2 Context Builder + Budget + Transition Bridge Resolution
Source: `js/prompts.js:241-484`

```js
    while (estimateContextChars(budgeted) > maxChars && budgeted.olderSceneSummaries.length > 0) {
        budgeted.olderSceneSummaries.shift();
        dropped.olderSummaries += 1;
    }

    // High-signal context policy:
    // - Always keep the last 2 full scenes intact.
    // - Never trim lesson history, boundary lines, or thread narrative lines.
    // - Only trim older compressed summaries.

    budgeted.meta = {
        ...budgeted.meta,
        contextChars: estimateContextChars(budgeted),
        budgetChars: maxChars,
        truncated: dropped.olderSummaries > 0 || dropped.recentProse > 0,
        droppedOlderSummaries: dropped.olderSummaries,
        droppedRecentProse: dropped.recentProse
    };

    return budgeted;
}

/**
 * Format story threads into human-readable text for AI prompts
 * @param {import('./contracts.js').StoryThreads} threads
 * @returns {string}
 */
export function formatThreadState(threads) {
    if (!threads) {
        return '(No thread data available)';
    }

    const conflictLabels = ['cooperative', 'mild tension', 'neutral', 'defensive', 'hostile'];
    const conflictDesc = conflictLabels[threads.oswaldoConflict + 2] || 'neutral';
    
    const realizationLabels = ['oblivious', 'questioning', 'aware', 'clarity'];
    const realizationDesc = realizationLabels[threads.sydneyRealization] || 'oblivious';
    
    const awarenessLabels = ['blind', 'glimpse', 'seeing', 'understands'];
    const awarenessDesc = awarenessLabels[threads.oswaldoAwareness] || 'blind';

    const narrativeRead = translateThreadStateNarrative(threads)
        .map((line) => `- ${line}`)
        .join('\n');

    const boundaryRead = translateBoundaries(threads.boundariesSet)
        .map((line) => `- ${line}`)
        .join('\n');
    
    return `
## STORY CONTINUITY STATE

- **Oswaldo Conflict:** ${threads.oswaldoConflict} (${conflictDesc})
- **Trina Tension:** ${threads.trinaTension}/3
- **Money Resolved:** ${threads.moneyResolved ? '✓ YES' : '✗ NO'}
- **Car Incident Mentioned:** ${threads.carMentioned ? '✓ YES' : '✗ NO'}
- **Sydney's Realization:** ${threads.sydneyRealization}/3 (${realizationDesc})
- **Boundaries Set:** ${threads.boundariesSet.length > 0 ? threads.boundariesSet.join(', ') : 'none yet'}
- **Oswaldo's Awareness:** ${threads.oswaldoAwareness}/3 (${awarenessDesc})
- **Exhaustion Level:** ${threads.exhaustionLevel}/5

### NARRATIVE READ (use this voice, not dashboard language)
${narrativeRead}

### BOUNDARY READ
${boundaryRead}

**Instructions:** Maintain consistency with these states. If Oswaldo was hostile, do not make him suddenly friendly without cause. If the money is resolved, do not reintroduce the problem. Preserve tone trajectory unless the player makes a clear pivoting choice.`;
}

/**
 * Build a compact long-arc memory summary sampled from prior scenes.
 * Keeps continuity alive beyond the last few raw turns.
 * @param {string[]} previousScenes
 * @param {number} cadence
 * @returns {string}
 */
function buildLongArcSummary(previousScenes, cadence = 4) {
    if (!Array.isArray(previousScenes) || previousScenes.length < cadence) return '';

    const sampled = [];
    for (let i = cadence - 1; i < previousScenes.length; i += cadence) {
        sampled.push(previousScenes[i]);
    }

    const summaryLines = sampled.slice(-3).map((entry, index) => {
        const compact = entry
            .replace(/\s+/g, ' ')
            .replace(/^\[Choice:\s*/i, 'Choice: ')
            .trim()
            .slice(0, 170);
        return `${index + 1}. ${compact}${compact.length >= 170 ? '...' : ''}`;
    });

    if (summaryLines.length === 0) return '';

    return `\n## LONG-ARC MEMORY (sampled every ~${cadence} scenes)\n${summaryLines.join('\n')}\n`;
}

/**
 * Detect thread jumps that should be narrated as a bridge.
 * @param {import('./contracts.js').StoryThreads|null|undefined} previousThreads
 * @param {import('./contracts.js').StoryThreads|null|undefined} currentThreads
 * @returns {{keys: string[], lines: string[]}}
 */
export function detectThreadTransitions(previousThreads, currentThreads) {
    if (!previousThreads || !currentThreads) {
        return { keys: [], lines: [] };
    }

    const changedKeys = [];
    const lines = [];

    const maybeAddTransition = (field, fromValue, toValue) => {
        if (fromValue === toValue) return;
        changedKeys.push(field);
        const map = TRANSITION_BRIDGE_MAP[field];
        if (!map) return;
        const transitionKey = `${String(fromValue)}->${String(toValue)}`;
        if (map[transitionKey]) {
            lines.push(map[transitionKey]);
        }
    };

    maybeAddTransition('oswaldoConflict', previousThreads.oswaldoConflict, currentThreads.oswaldoConflict);
    maybeAddTransition('trinaTension', previousThreads.trinaTension, currentThreads.trinaTension);
    maybeAddTransition('exhaustionLevel', previousThreads.exhaustionLevel, currentThreads.exhaustionLevel);
    maybeAddTransition('sydneyRealization', previousThreads.sydneyRealization, currentThreads.sydneyRealization);
    maybeAddTransition('oswaldoAwareness', previousThreads.oswaldoAwareness, currentThreads.oswaldoAwareness);
    maybeAddTransition('moneyResolved', previousThreads.moneyResolved, currentThreads.moneyResolved);

    return { keys: changedKeys, lines };
}

function resolveTransitionBridge(gameState) {
    const bridge = gameState?.pendingTransitionBridge;
    if (!bridge || !Array.isArray(bridge.lines) || bridge.lines.length === 0) {
        return null;
    }
    return {
        keys: Array.isArray(bridge.keys) ? bridge.keys : [],
        lines: bridge.lines.slice(0, 2)
    };
}

/**
 * Build app-owned NarrativeContext payload for prompt generation.
 * @param {import('./contracts.js').GameState} gameState
 * @param {{lastChoiceText?: string, maxChars?: number}} [options]
 * @returns {import('./contracts.js').NarrativeContext}
 */
export function buildNarrativeContext(gameState, options = {}) {
    const {
        lastChoiceText = '',
        maxChars = NARRATIVE_CONTEXT_CHAR_BUDGET
    } = options;

    const sceneLog = Array.isArray(gameState?.sceneLog) ? gameState.sceneLog : [];
    const recentEntries = sceneLog.slice(-MAX_RECENT_SCENE_PROSE);
    const olderEntries = sceneLog.slice(0, Math.max(0, sceneLog.length - MAX_RECENT_SCENE_PROSE));

    const recentSceneProse = recentEntries.map((entry) => ({
        sceneId: entry.sceneId,
        text: entry.sceneText || '',
        viaChoiceText: entry.viaChoiceText || ''
    }));

    const olderSceneSummaries = olderEntries
        .slice(-MAX_OLDER_SCENE_SUMMARIES)
        .map((entry) => `[Choice: ${entry.viaChoiceText || 'n/a'}] ${compressSceneForSummary(entry.sceneText || '')}`);

    const context = {
        sceneCount: Number(gameState?.sceneCount || 0),
        arcPosition: summarizeNarrativeArc(Number(gameState?.sceneCount || 0)),
        lastChoiceText: lastChoiceText || '',
        threadState: gameState?.storyThreads || null,
        threadNarrativeLines: translateThreadStateNarrative(gameState?.storyThreads || null),
        boundaryNarrativeLines: translateBoundaries(gameState?.storyThreads?.boundariesSet || []),
        lessonHistoryLines: translateLessonHistory(gameState?.lessonsEncountered || []),
        recentSceneProse,
        olderSceneSummaries,
        transitionBridge: resolveTransitionBridge(gameState),
        meta: {
            contextChars: 0,
            budgetChars: maxChars,
            truncated: false,
            droppedOlderSummaries: 0,
            droppedRecentProse: 0
        }
    };

    return applyContextBudget(context, maxChars);
}

function formatNarrativeContextSection(context) {
    const recentText = context.recentSceneProse.length > 0
        ? context.recentSceneProse
              .map((entry, idx) => {
                  const choiceLine = entry.viaChoiceText ? `[Choice: ${entry.viaChoiceText}]` : '[Choice: opening]';
                  return `### RECENT SCENE ${idx + 1}\n${choiceLine}\n${entry.text}`;
              })
              .join('\n\n')
        : 'No recent scene prose available.';

    const olderText = context.olderSceneSummaries.length > 0
        ? context.olderSceneSummaries.map((line) => `- ${line}`).join('\n')
        : '- None yet.';

    const threadNarrative = context.threadNarrativeLines.map((line) => `- ${line}`).join('\n');
    const boundaryNarrative = context.boundaryNarrativeLines.map((line) => `- ${line}`).join('\n');
    const lessonHistory = context.lessonHistoryLines.map((line) => `- ${line}`).join('\n');

    const transitionSection = context.transitionBridge?.lines?.length
        ? `\n## STATE SHIFT BRIDGE (only because state changed)\n${context.transitionBridge.lines
              .map((line) => `- ${line}`)
              .join('\n')}\nUse one bridge line naturally if it fits this scene.`
        : '\n## STATE SHIFT BRIDGE\nNo thread jump bridge this turn. Do not force one.';

    return `## NARRATIVE CONTEXT
Scene count: ${context.sceneCount}
Arc position: ${context.arcPosition}

## RECENT PROSE (verbatim; match this voice)
${recentText}

## OLDER SCENES (compressed)
${olderText}

## THREAD NARRATIVE READ
${threadNarrative}

## BOUNDARY READ
${boundaryNarrative}

## LESSON HISTORY (already surfaced)
${lessonHistory}
${transitionSection}

## CONTEXT BUDGET
chars=${context.meta.contextChars}/${context.meta.budgetChars}; truncated=${context.meta.truncated}; droppedOlder=${context.meta.droppedOlderSummaries}; droppedRecent=${context.meta.droppedRecentProse}`;
}

/**
 * The main system prompt that sets up the AI storyteller
```

---

## 6) Thread + Boundary + Lesson Translation Catalog

Canonical definitions are in Section 5 (`js/prompts.js`) and Section 2 (`docs/HANDWRITTEN_NARRATIVE_ASSETS.md`).

Direct mappings included:
- `OSWALDO_CONFLICT_TRANSLATIONS`
- `TRINA_TENSION_TRANSLATIONS`
- `MONEY_TRANSLATIONS`
- `CAR_TRANSLATIONS`
- `SYDNEY_REALIZATION_TRANSLATIONS`
- `OSWALDO_AWARENESS_TRANSLATIONS`
- `EXHAUSTION_TRANSLATIONS`
- `BOUNDARY_TRANSLATIONS`
- `LESSON_HISTORY_TRANSLATIONS`
- `TRANSITION_BRIDGE_MAP`

---

## 7) 17 Lessons Full Catalog

Source: `js/lessons.js`

```js
/**
 * No Vacancies - Lessons
 *
 * All 17 lessons about invisible labor and load-bearing in relationships.
 * These appear as popups when scenes demonstrate them.
 */

/**
 * @type {import('./contracts.js').Lesson[]}
 */
export const lessons = [
    {
        id: 1,
        title: 'Load-Bearing Beams Get Leaned On',
        quote: "Load-bearing beams don't get applause. They get leaned on.",
        insight: "When you're the structural support, you don't get applause. You get weight.",
        emotionalStakes: [
            'The exhaustion of being essential but unacknowledged',
            "The loneliness of being 'the strong one'",
            'The resentment that builds silently'
        ],
        storyTriggers: [
            'Sydney pays the room. Nobody thanks her.',
            "She's been awake for 4 hours solving problems before anyone wakes up",
            "Someone says 'it's not like it's hard for you'"
        ],
        unconventionalAngle:
            "The competent person's curse - the better you are, the less credit you get"
    },
    {
        id: 2,
        title: "They Don't Understand the Concept",
        quote: "I don't mind not getting applause, but what I do mind is them not understanding the load-bearing concept.",
        insight:
            "It's not the lack of applause that hurts. It's that they genuinely don't see the load.",
        emotionalStakes: [
            'Feeling invisible in your own contribution',
            "The gap between what you know you're doing and what they perceive",
            'Being gaslit by incomprehension'
        ],
        storyTriggers: [
            "Oswaldo says 'what did you do today?' at 2pm",
            "Someone suggests Sydney 'has it easy'",
            'The room is magically paid and nobody asks how'
        ],
        unconventionalAngle: "They're not evil, they're just blind. Which might be worse."
    },
    {
        id: 3,
        title: 'Resentment Toward the Load-Bearer',
        quote: 'People often get resentful, even if and especially if you are load-bearing and looking out for them.',
        insight:
            'People often get resentful of the person carrying them, especially when competence makes them feel inadequate.',
        emotionalStakes: [
            'The betrayal of being punished for helping',
            "Confusion: 'I'm doing everything right, why do they hate me?'",
            'The trap of being needed but resented'
        ],
        storyTriggers: [
            'Oswaldo gets cold after Sydney succeeds',
            "They call her 'controlling' for having standards",
            'Subtle eye rolls when she makes decisions'
        ],
        unconventionalAngle: "Your competence is an accusation they didn't ask for"
    },
    {
        id: 4,
        title: 'Your Energy Keeps It Alive',
        quote: 'Your attention, energy, explanation, and patience are the thing keeping the dynamic alive. If you stopped supplying them, the thing would wither or die.',
        insight:
            'Your attention, energy, explanation, and patience ARE the dynamic. Without you supplying them, it dies.',
        emotionalStakes: [
            "Realizing you're the entire engine",
            "The terrifying question: 'What happens if I stop?'",
            'The exhaustion of being the only source'
        ],
        storyTriggers: [
            "Sydney wonders what would happen if she just... didn't",
            'She stops reminding Oswaldo of something. He forgets.',
            'The room gets messy because she stopped cleaning'
        ],
        unconventionalAngle:
            "The relationship isn't dysfunctional - it's functioning exactly as designed, with you as the fuel"
    },
    {
        id: 5,
        title: 'Output vs Presence',
        quote: 'Be valued for output vs. be valued for presence.',
        insight: 'Are you valued because of what you produce, or because you exist?',
        emotionalStakes: [
            'The fear of being replaceable if you stop producing',
            'Wondering if anyone would miss YOU vs. miss your function',
            'The exhaustion of earning your place daily'
        ],
        storyTriggers: [
            "Oswaldo says 'I love you' right after Sydney gives him money",
            "She's sick and the first question is about the room payment",
            "She imagines: 'If I stopped doing everything, would they want me here?'"
        ],
        unconventionalAngle:
            'Some people are furniture. Some people are appliances. Know which one you are.'
    },
    {
        id: 6,
        title: 'Invisibility of Competence',
        quote: 'The better you do your job, the less visible it is. Stability erases evidence of effort. Prevention never feels dramatic.',
        insight:
            'The better you do your job, the less visible it is. Stability erases evidence of effort.',
        emotionalStakes: [
            'The paradox of excellence = invisibility',
            'Craving crisis just so someone will notice',
            'The thankless nature of maintenance'
        ],
        storyTriggers: [
            'Room paid before anyone knew it was due',
            'Problems solved before they become visible',
            "Trina: 'Must be nice to never have to worry'"
        ],
        unconventionalAngle: 'The only way to be seen is to let things break'
    },
    {
        id: 7,
        title: "This Isn't Hard",
        quote: "People unconsciously conclude: 'This isn't hard. If it were hard, I'd feel it. If it required effort, I'd see strain.'",
        insight: "If they don't see strain, they assume there isn't any.",
        emotionalStakes: [
            'Being dismissed as naturally lucky',
            "Your skills being erased as 'just how you are'",
            'The isolation of unrecognized struggle'
        ],
        storyTriggers: [
            "'You just sit on your laptop'",
            "'I could do that if I had a computer'",
            'Oswaldo tried once. Got flagged in 2 hours. Blamed the method.'
        ],
        unconventionalAngle: 'Your poker face is your prison'
    },
    {
        id: 8,
        title: "Asking for Help Doesn't Work",
        quote: "When I ask for help, often people don't take me seriously because they think I can't actually be needing help.",
        insight: "When you rarely need help, people don't take you seriously when you finally ask.",
        emotionalStakes: [
            'The despair of finally reaching out and being dismissed',
            "'You'll figure it out' as dismissal",
            'Trained helplessness on the receiving end'
        ],
        storyTriggers: [
            "Sydney says 'I'm really struggling'",
            "Oswaldo: 'You always say that and it works out'",
            'She stops asking because it makes things worse'
        ],
        unconventionalAngle: 'Your track record of solving things is now your cage'
    },
    {
        id: 9,
        title: 'Discomfort Becomes Attacks',
        quote: 'That discomfort often flips into: irritation, distancing, subtle rebellion, minimizing your role.',
        insight:
            'When your competence makes others uncomfortable, it flips into irritation and rebellion.',
        emotionalStakes: [
            'Being punished for being good at things',
            "The confusion of 'I'm helping, why are they mad?'",
            'Slow realization that your success threatens them'
        ],
        storyTriggers: [
            'Oswaldo gets snippy after she lands a score',
            "'Why do you always keep score?'",
            'They find small things to criticize'
        ],
        unconventionalAngle: 'Your light is making their darkness visible, and they hate you for it'
    },
    {
        id: 10,
        title: 'What You Actually Want to Hear',
        quote: "You want someone to say: 'I see what would break if you weren't here.'",
        insight: "'I see what would break if you weren't here.'",
        emotionalStakes: [
            'The desperate hunger for acknowledgment',
            'Wanting to be SEEN, not just used',
            'The rare ending Sydney craves'
        ],
        storyTriggers: [
            'Oswaldo actually says this (rare ending)',
            'Sydney imagines someone saying it',
            'She realizes no one ever has'
        ],
        unconventionalAngle: "You don't want thanks. You want witnesses."
    },
    {
        id: 11,
        title: 'See It AND Act Accordingly',
        quote: "It's more than that. I think we want people to see that and act accordingly. Like... if you know I'm breaking my back to make this money, don't loan your buddy $50 so he can buy drugs the day before rent is due.",
        insight: "It's not enough to acknowledge the work. You have to change your behavior.",
        emotionalStakes: [
            'The gap between words and actions',
            'Recognition without change is just manipulation',
            'Empty apologies followed by same behavior'
        ],
        storyTriggers: [
            'Oswaldo says he appreciates her, then does something selfish',
            "Dex knows she's struggling, asks for money anyway",
            'Empty apologies followed by same behavior'
        ],
        unconventionalAngle: 'Understanding without action is just sophisticated dismissal'
    },
    {
        id: 12,
        title: 'Making Effort Legible',
        quote: 'The only durable fix is making some effort legible. That means: letting minor failures happen, allowing some friction to be felt, not preemptively smoothing everything. Not to punish. Not to teach lessons. But to reintroduce reality.',
        insight:
            'The only fix is letting failures happen. Not to punish, but to reintroduce reality.',
        emotionalStakes: [
            'The terror of letting go',
            "The guilt of 'letting them fail'",
            'The freedom of not smoothing everything'
        ],
        storyTriggers: [
            "Sydney doesn't pay the room in time (intentionally or not)",
            'She stops reminding, things fall apart',
            'Reality arrives: management knocks'
        ],
        unconventionalAngle: "You're not causing problems. You're revealing them."
    },
    {
        id: 13,
        title: "Won't vs Can't",
        quote: "You are very good at turning 'won't' into 'can't' in your head. You do this by: imagining hidden stressors, over-crediting intent, downplaying repeated behavior.",
        insight:
            "You turn 'won't' into 'can't' by imagining hidden stressors and over-crediting intent.",
        emotionalStakes: [
            'The self-gaslighting of the compassionate',
            "Making excuses for people who aren't making any for themselves",
            'The trap of empathy'
        ],
        storyTriggers: [
            "Oswaldo 'can't' help because he's depressed. But he's up all night when there's a party.",
            'Sydney catches herself making excuses',
            'Pattern recognition vs. benefit of the doubt'
        ],
        unconventionalAngle: 'Your understanding of their trauma is being weaponized against you'
    },
    {
        id: 14,
        title: 'The System Only Responds to Load Distribution',
        quote: "The system doesn't care about explanations. It only responds to load distribution.",
        insight: "Explanations don't matter. Only who carries what.",
        emotionalStakes: [
            'The futility of communication',
            'Realizing talk is cheap',
            'The clarity of just looking at who does what'
        ],
        storyTriggers: [
            'Sydney explains why she needs help. Nothing changes.',
            'She stops explaining, starts observing',
            'Actions speak; words are noise'
        ],
        unconventionalAngle: 'The system is already telling you everything you need to know'
    },
    {
        id: 15,
        title: 'Infrastructure Gets Blamed',
        quote: "When infrastructure works, it's invisible. When it fails, everyone notices.",
        insight:
            "When you're infrastructure, you're blamed for failures but not credited for prevention.",
        emotionalStakes: [
            'The unfairness of being blamed for the one thing that broke',
            "No credit for the 100 things that didn't break",
            'The thankless nature of maintenance work'
        ],
        storyTriggers: [
            'Something goes wrong and Sydney gets blamed',
            "'Why didn't you...' when she does everything",
            'The one time something slips, everyone notices'
        ],
        unconventionalAngle:
            'Heroes save the day. Infrastructure prevents it from needing saving. Guess who gets the movie.'
    },
    {
        id: 16,
        title: 'Relationships Are About Risk Reduction',
        quote: "Relationships aren't about whether something costs you money, they're about whether it reduces someone else's risk.",
        insight:
            "Relationships aren't about what it costs you—they're about whether your presence reduces their risk.",
        emotionalStakes: [
            'The revelation of what partnership means',
            "'Am I reducing his risk? Is he reducing mine?'",
            'The clarity of the imbalance'
        ],
        storyTriggers: [
            "Oswaldo thinks her paying for the room 'doesn't count' because she'd pay anyway",
            "Sydney realizes she's reducing everyone's risk but her own",
            "The question: 'What would change for him if I left?'"
        ],
        unconventionalAngle:
            "If your presence doesn't change their behavior, you're not a partner. You're a subsidy."
    },
    {
        id: 17,
        title: 'What Am I to You?',
        quote: "If my presence doesn't change how you act, plan, or sacrifice, then what am I to you?",
        insight:
            "If my presence doesn't change how you act, plan, or sacrifice, then what am I to you?",
        emotionalStakes: [
            'The devastating clarity of this question',
            'Realizing you might not like the answer',
            'The beginning of real change or real leaving'
        ],
        storyTriggers: [
            'Sydney asks herself this directly',
            "She watches Oswaldo's behavior for evidence",
            "She can't unsee it now"
        ],
        unconventionalAngle: "The question you're afraid to ask because you already know the answer"
    }
];

/**
 * Get a lesson by ID
 * @param {number} id
 * @returns {import('./contracts.js').Lesson|undefined}
 */
export function getLessonById(id) {
    return lessons.find((l) => l.id === id);
}

/**
 * Get a random trigger from a lesson
 * @param {number} lessonId
 * @returns {string|null}
 */
export function getRandomTrigger(lessonId) {
    const lesson = getLessonById(lessonId);
    if (!lesson || !lesson.storyTriggers.length) return null;
    return lesson.storyTriggers[Math.floor(Math.random() * lesson.storyTriggers.length)];
}

/**
 * Check if a lesson matches a scene based on keywords
 * @param {string} sceneText
 * @returns {number|null} Lesson ID or null
 */
export function detectLessonInScene(sceneText) {
    const text = sceneText.toLowerCase();

    // Check for specific keywords/phrases that indicate lessons
    if (text.includes('keep score') || text.includes('keeping score')) return 9;
    if (text.includes('what did you do today')) return 2;
    if (text.includes('energy around here')) return 4;
    if (text.includes('i see what would break')) return 10;
    if (text.includes("you'll figure it out") || text.includes('you always figure')) return 8;
    if (text.includes("this isn't hard") || text.includes('not that hard')) return 7;
    if (text.includes('controlling')) return 3;
    if (text.includes('borrow') && text.includes('money')) return 11;
    if (text.includes('what am i to you')) return 17;
    if (text.includes('risk') && text.includes('reduce')) return 16;
    if (text.includes("won't") && text.includes("can't")) return 13;
    if (text.includes('let it fail') || text.includes('let things break')) return 12;

    return null;
}

```

---

## 8) Guardrails

### 8.1 Content + Continuity + Anti-Repetition + Lesson Nullability
Primary source: `js/prompts.js:486-701`

### 8.2 Image and Oswaldo depiction guardrails
Primary sources:
- `js/prompts.js:486-701`
- `src/lib/server/ai/providers/grok.ts` (image prompt guardrail checks)
- `src/lib/server/ai/routeHelpers.ts` (API-level guardrail handling)

### 8.3 Active provider/runtime guardrail-relevant code

#### Provider interface
Source: `src/lib/server/ai/provider.interface.ts`

```ts
import type { GameState, NarrativeContext, Scene } from '$lib/contracts';

export type AiProviderName = 'mock' | 'grok';
export type AiErrorCode =
	| 'timeout'
	| 'auth'
	| 'rate_limit'
	| 'provider_down'
	| 'invalid_response'
	| 'guardrail'
	| 'unknown';

export interface ProviderProbeResult {
	provider: AiProviderName;
	model: string;
	modelAvailable: boolean;
	authValid: boolean;
	latencyMs: number;
}

export interface GenerateSceneInput {
	currentSceneId: string | null;
	choiceId: string | null;
	gameState: GameState;
	narrativeContext?: NarrativeContext | null;
}

export interface GenerateImageInput {
	prompt: string;
}

export interface GeneratedImage {
	url?: string;
	b64?: string;
}

export interface AiProvider {
	readonly name: AiProviderName;
	getOpeningScene(input: GenerateSceneInput): Promise<Scene>;
	getNextScene(input: GenerateSceneInput): Promise<Scene>;
	generateImage?(input: GenerateImageInput): Promise<GeneratedImage>;
	probe?(): Promise<ProviderProbeResult>;
	isAvailable?(): boolean;
}

export class AiProviderError extends Error {
	readonly code: AiErrorCode;
	readonly retryable: boolean;
	readonly status?: number;

	constructor(message: string, options: { code: AiErrorCode; retryable: boolean; status?: number }) {
		super(message);
		this.name = 'AiProviderError';
		this.code = options.code;
		this.retryable = options.retryable;
		this.status = options.status;
	}
}

export function isRetryableStatus(status: number): boolean {
	return status === 408 || status === 429 || status >= 500;
}


```

#### Grok provider
Source: `src/lib/server/ai/providers/grok.ts`

```ts
import {
	validateScene,
	validateEndingType,
	type NarrativeContext,
	type Scene,
	type StoryThreads
} from '$lib/contracts';
import type { AiConfig } from '$lib/server/ai/config';
import { evaluateStorySanity } from '$lib/server/ai/sanity';
import {
	AiProviderError,
	type AiProvider,
	type GenerateImageInput,
	type GenerateSceneInput,
	type GeneratedImage,
	type ProviderProbeResult,
	isRetryableStatus
} from '$lib/server/ai/provider.interface';
import { emitAiServerTelemetry } from '$lib/server/ai/telemetry';

const XAI_CHAT_URL = 'https://api.x.ai/v1/chat/completions';
const XAI_IMAGE_URL = 'https://api.x.ai/v1/images/generations';

interface ChatChoice {
	message?: { content?: string | null };
}

interface ChatResponse {
	choices?: ChatChoice[];
	usage?: Record<string, unknown>;
}

interface SceneCandidate {
	sceneText?: unknown;
	choices?: Array<{ id?: unknown; text?: unknown; outcome?: unknown }>;
	lessonId?: unknown;
	imageKey?: unknown;
	imagePrompt?: unknown;
	isEnding?: unknown;
	endingType?: unknown;
	mood?: unknown;
	storyThreadUpdates?: Partial<StoryThreads> | null;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractJsonObject(text: string): string {
	const trimmed = text.trim();
	if (!trimmed) throw new Error('Empty provider response');

	const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
	if (fencedMatch?.[1]) return fencedMatch[1].trim();

	const first = trimmed.indexOf('{');
	const last = trimmed.lastIndexOf('}');
	if (first === -1 || last === -1 || last <= first) {
		throw new Error('No JSON object found in provider response');
	}
	return trimmed.slice(first, last + 1);
}

function normalizeChoiceId(text: string, index: number): string {
	const normalized = text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, 64);
	return normalized || `choice_${index + 1}`;
}

function normalizeScene(candidate: SceneCandidate, fallbackSceneId: string): Scene {
	const choices = Array.isArray(candidate.choices)
		? candidate.choices
				.map((choice, index) => {
					const text = typeof choice?.text === 'string' ? choice.text.trim() : '';
					if (!text) return null;
					const id =
						typeof choice.id === 'string' && /^[a-z0-9_-]{1,80}$/i.test(choice.id)
							? choice.id
							: normalizeChoiceId(text, index);
					return {
						id,
						text,
						outcome: typeof choice.outcome === 'string' ? choice.outcome : undefined
					};
				})
				.filter((value): value is NonNullable<typeof value> => value !== null)
		: [];

	const isEnding = Boolean(candidate.isEnding);
	const endingType = isEnding ? validateEndingType(candidate.endingType) : null;

	const normalized: Scene = {
		sceneId:
			typeof (candidate as { sceneId?: unknown }).sceneId === 'string'
				? ((candidate as { sceneId: string }).sceneId || fallbackSceneId)
				: fallbackSceneId,
		sceneText: typeof candidate.sceneText === 'string' ? candidate.sceneText.trim() : '',
		choices,
		lessonId: typeof candidate.lessonId === 'number' ? candidate.lessonId : null,
		imageKey: typeof candidate.imageKey === 'string' ? candidate.imageKey : 'hotel_room',
		imagePrompt: typeof candidate.imagePrompt === 'string' ? candidate.imagePrompt : undefined,
		isEnding,
		endingType,
		mood:
			typeof candidate.mood === 'string' &&
			['neutral', 'tense', 'hopeful', 'dark', 'triumphant'].includes(candidate.mood)
				? (candidate.mood as Scene['mood'])
				: undefined,
		storyThreadUpdates:
			candidate.storyThreadUpdates && typeof candidate.storyThreadUpdates === 'object'
				? candidate.storyThreadUpdates
				: null
	};

	return normalized;
}

function formatNarrativeContext(context: NarrativeContext | null | undefined): string {
	if (!context) return '';

	const recentProse = context.recentSceneProse
		.map(
			(scene, index) =>
				`${index + 1}. [${scene.sceneId}] via "${scene.viaChoiceText || 'N/A'}": ${scene.text}`
		)
		.join('\n');

	const olderSummaries = context.olderSceneSummaries
		.map((summary, index) => `${index + 1}. ${summary}`)
		.join('\n');

	const threadLines = context.threadNarrativeLines.map((line, index) => `${index + 1}. ${line}`).join('\n');
	const lessonLines = context.lessonHistoryLines.map((line, index) => `${index + 1}. ${line}`).join('\n');
	const boundaryLines = context.boundaryNarrativeLines
		.map((line, index) => `${index + 1}. ${line}`)
		.join('\n');
	const transitionBridge = context.transitionBridge
		? `Thread shift keys: ${context.transitionBridge.keys.join(', ')}\n${context.transitionBridge.lines.join('\n')}`
		: 'none';

	return `Narrative Context:
- arcPosition=${context.arcPosition}
- sceneCount=${context.sceneCount}
- lastChoiceText="${context.lastChoiceText}"
- transitionBridge=${transitionBridge}
- threadNarrativeLines:
${threadLines || 'none'}
- boundaryNarrativeLines:
${boundaryLines || 'none'}
- lessonHistoryLines:
${lessonLines || 'none'}
- recentSceneProse:
${recentProse || 'none'}
- olderSceneSummaries:
${olderSummaries || 'none'}`;
}

function buildScenePrompt(input: GenerateSceneInput, mode: 'opening' | 'next'): string {
	const lastChoice = input.gameState.history[input.gameState.history.length - 1];
	const threads = input.gameState.storyThreads;
	const contextBlock = formatNarrativeContext(input.narrativeContext);

	const commonRules = `Return ONLY JSON with keys:
sceneText, choices (2-3 items), lessonId (number or null), imageKey, isEnding, endingType, mood, storyThreadUpdates.
Write scene first, then assign lessonId. Prefer lessonId: null if no single lesson is dominant.
No markdown fences.`;

	if (mode === 'opening') {
		return `${commonRules}

Story: No Vacancies. Sydney has $47 and needs $18 by 11AM in a motel room with Oswaldo and Trina.
Write opening scene with immediate pressure and 2-3 meaningful choices with distinct costs.
Keep continuity constraints: no explicit moral summary, no repetitive apology loops.`;
	}

	return `${commonRules}

Continue from scene "${input.currentSceneId ?? input.gameState.currentSceneId}" after choice "${input.choiceId ?? lastChoice?.choiceId ?? ''}".
Recent choice text: "${lastChoice?.choiceText ?? ''}".
Thread state:
- oswaldoConflict=${threads.oswaldoConflict}
- trinaTension=${threads.trinaTension}
- moneyResolved=${threads.moneyResolved}
- sydneyRealization=${threads.sydneyRealization}
- exhaustionLevel=${threads.exhaustionLevel}

${contextBlock}

Maintain coherence with prior context and produce playable next choices.`;
}

export class GrokAiProvider implements AiProvider {
	readonly name = 'grok' as const;
	private readonly config: AiConfig;
	private readonly fetchImpl: typeof fetch;

	constructor(config: AiConfig, fetchImpl: typeof fetch = fetch) {
		this.config = config;
		this.fetchImpl = fetchImpl;
	}

	private async callChat(prompt: string): Promise<{ scene: SceneCandidate; usage?: Record<string, unknown> }> {
		let attempt = 0;
		const maxAttempts = this.config.maxRetries + 1;
		let lastError: unknown = null;

		while (attempt < maxAttempts) {
			const started = Date.now();
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);
			try {
				const response = await this.fetchImpl(XAI_CHAT_URL, {
					method: 'POST',
					headers: {
						'content-type': 'application/json',
						authorization: `Bearer ${this.config.xaiApiKey}`
					},
					body: JSON.stringify({
						model: this.config.grokTextModel,
						messages: [
							{ role: 'system', content: 'You are an interactive fiction engine. Output JSON only.' },
							{ role: 'user', content: prompt }
						],
						max_tokens: this.config.maxOutputTokens,
						temperature: 0.8
					}),
					signal: controller.signal
				});

				if (!response.ok) {
					const status = response.status;
					const retryable = isRetryableStatus(status);
					throw new AiProviderError(`xAI chat request failed (${status})`, {
						code: status === 401 || status === 403 ? 'auth' : status === 429 ? 'rate_limit' : 'provider_down',
						retryable,
						status
					});
				}

				const payload = (await response.json()) as ChatResponse;
				const text = payload.choices?.[0]?.message?.content;
				if (!text || typeof text !== 'string') {
					throw new AiProviderError('xAI chat returned empty content', {
						code: 'invalid_response',
						retryable: false
					});
				}

				const json = extractJsonObject(text);
				const parsed = JSON.parse(json) as SceneCandidate;
				emitAiServerTelemetry('provider_chat', {
					requestId: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
					provider: this.name,
					model: this.config.grokTextModel,
					latencyMs: Date.now() - started,
					retryCount: attempt,
					parseAttempts: attempt + 1,
					tokenUsage: payload.usage ?? null
				});
				return { scene: parsed, usage: payload.usage };
			} catch (error) {
				lastError = error;
				const retryable =
					error instanceof AiProviderError
						? error.retryable
						: error instanceof Error && error.name === 'AbortError';
				if (!retryable || attempt >= maxAttempts - 1) {
					break;
				}
				const backoff = this.config.retryBackoffMs[Math.min(attempt, this.config.retryBackoffMs.length - 1)];
				await sleep(backoff);
			} finally {
				clearTimeout(timeout);
			}
			attempt += 1;
		}

		if (lastError instanceof AiProviderError) throw lastError;
		if (lastError instanceof Error && lastError.name === 'AbortError') {
			throw new AiProviderError('xAI request timed out', { code: 'timeout', retryable: true });
		}
		throw new AiProviderError('xAI request failed', { code: 'unknown', retryable: false });
	}

	private async generateScene(input: GenerateSceneInput, mode: 'opening' | 'next'): Promise<Scene> {
		const prompt = buildScenePrompt(input, mode);
		const { scene } = await this.callChat(prompt);
		const fallbackSceneId =
			mode === 'opening' ? 'opening' : `scene_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
		const normalized = normalizeScene(scene, fallbackSceneId);

		if (!validateScene(normalized)) {
			throw new AiProviderError('xAI scene failed contract validation', {
				code: 'invalid_response',
				retryable: false
			});
		}

		const sanity = evaluateStorySanity(normalized);
		if (!sanity.ok) {
			throw new AiProviderError(`xAI scene failed sanity checks: ${sanity.issues.join(',')}`, {
				code: 'invalid_response',
				retryable: false
			});
		}

		return normalized;
	}

	async getOpeningScene(input: GenerateSceneInput): Promise<Scene> {
		return this.generateScene(input, 'opening');
	}

	async getNextScene(input: GenerateSceneInput): Promise<Scene> {
		return this.generateScene(input, 'next');
	}

	async generateImage(input: GenerateImageInput): Promise<GeneratedImage> {
		if (!this.config.enableGrokImages) {
			throw new AiProviderError('Grok image generation disabled by config', {
				code: 'provider_down',
				retryable: false
			});
		}
		const lowerPrompt = input.prompt.toLowerCase();
		if (/oswaldo/.test(lowerPrompt) && /(face|bare skin|shirtless|nude|naked|skin exposed)/.test(lowerPrompt)) {
			throw new AiProviderError('Image prompt violates Oswaldo guardrail', {
				code: 'guardrail',
				retryable: false,
				status: 422
			});
		}
		if (!input.prompt.trim()) {
			throw new AiProviderError('Image prompt is empty', {
				code: 'invalid_response',
				retryable: false,
				status: 400
			});
		}

		let attempt = 0;
		const maxAttempts = this.config.maxRetries + 1;
		let lastError: unknown = null;

		while (attempt < maxAttempts) {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);
			try {
				const response = await this.fetchImpl(XAI_IMAGE_URL, {
					method: 'POST',
					headers: {
						'content-type': 'application/json',
						authorization: `Bearer ${this.config.xaiApiKey}`
					},
					body: JSON.stringify({
						model: this.config.grokImageModel,
						prompt: input.prompt
					}),
					signal: controller.signal
				});

				if (!response.ok) {
					const status = response.status;
					throw new AiProviderError(`xAI image request failed (${status})`, {
						code: status === 401 || status === 403 ? 'auth' : status === 429 ? 'rate_limit' : 'provider_down',
						retryable: isRetryableStatus(status),
						status
					});
				}

				const payload = (await response.json()) as {
					data?: Array<{ url?: string; b64_json?: string }>;
				};
				const image = payload.data?.[0];
				if (!image || (!image.url && !image.b64_json)) {
					throw new AiProviderError('xAI image response missing data', {
						code: 'invalid_response',
						retryable: false
					});
				}

				return {
					url: typeof image.url === 'string' ? image.url : undefined,
					b64: typeof image.b64_json === 'string' ? image.b64_json : undefined
				};
			} catch (error) {
				lastError = error;
				const retryable =
					error instanceof AiProviderError
						? error.retryable
						: error instanceof Error && error.name === 'AbortError';
				if (!retryable || attempt >= maxAttempts - 1) break;
				const backoff = this.config.retryBackoffMs[Math.min(attempt, this.config.retryBackoffMs.length - 1)];
				await sleep(backoff);
			} finally {
				clearTimeout(timeout);
			}
			attempt += 1;
		}

		if (lastError instanceof AiProviderError) throw lastError;
		if (lastError instanceof Error && lastError.name === 'AbortError') {
			throw new AiProviderError('xAI image request timed out', {
				code: 'timeout',
				retryable: true,
				status: 504
			});
		}
		throw new AiProviderError('xAI image request failed', {
			code: 'unknown',
			retryable: false
		});
	}

	async probe(): Promise<ProviderProbeResult> {
		const started = Date.now();
		try {
			await this.callChat('Respond with {"sceneText":"probe","choices":[{"id":"ok","text":"ok"}],"lessonId":null,"imageKey":"hotel_room","isEnding":false,"endingType":null}');
			return {
				provider: this.name,
				model: this.config.grokTextModel,
				modelAvailable: true,
				authValid: true,
				latencyMs: Date.now() - started
			};
		} catch (error) {
			const authFail = error instanceof AiProviderError && error.code === 'auth';
			return {
				provider: this.name,
				model: this.config.grokTextModel,
				modelAvailable: false,
				authValid: !authFail,
				latencyMs: Date.now() - started
			};
		}
	}

	isAvailable(): boolean {
		return this.config.xaiApiKey.length > 0;
	}
}

```

---

## 9) Active Runtime Wiring Status (Legacy `js` vs Active `src`)

### 9.1 Runtime files

#### Story service bridge
Source: `src/lib/services/storyService.ts`

```ts
import type { GameState, NarrativeContext, Scene, StoryThreads } from '$lib/contracts';
import { appendDebugError } from '$lib/debug/errorLog';

export interface OpeningSceneRequest {
	useMocks: boolean;
	featureFlags?: GameState['featureFlags'];
}

export interface StoryServiceOptions {
	useNarrativeContext?: boolean;
	previousThreads?: StoryThreads;
	enableTransitionBridges?: boolean;
}

export interface StoryService {
	getOpeningScene(request?: OpeningSceneRequest): Promise<Scene>;
	getNextScene(
		currentSceneId: string,
		choiceId: string,
		gameState: GameState,
		narrativeContext?: NarrativeContext | null,
		options?: StoryServiceOptions
	): Promise<Scene>;
	getRecoveryScene?(): Promise<Scene>;
	getSceneById?(sceneId: string): Scene | undefined;
	isAvailable?(): boolean;
}

export interface ApiStoryServiceConfig {
	basePath?: string;
	fetchImpl?: typeof fetch;
}

function ensureSceneShape(candidate: unknown, endpoint: string): Scene {
	if (!candidate || typeof candidate !== 'object') {
		throw new Error(`${endpoint} returned invalid payload`);
	}
	const scene = candidate as Scene;
	if (
		typeof scene.sceneId !== 'string' ||
		typeof scene.sceneText !== 'string' ||
		!Array.isArray(scene.choices)
	) {
		throw new Error(`${endpoint} returned invalid scene contract`);
	}
	return scene;
}

async function postJson<TResponse>(
	fetchImpl: typeof fetch,
	url: string,
	payload: Record<string, unknown>
): Promise<TResponse> {
	let response: Response;
	try {
		response = await fetchImpl(url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		});
	} catch (error) {
		appendDebugError({
			scope: 'api.network',
			message: 'Network request failed',
			details: {
				url,
				error: error instanceof Error ? error.message : String(error ?? 'Unknown network error')
			}
		});
		throw error;
	}

	let body: unknown = null;
	try {
		body = await response.json();
	} catch {
		body = null;
	}

	if (!response.ok) {
		const message =
			typeof (body as { error?: unknown } | null)?.error === 'string'
				? ((body as { error: string }).error ?? 'request failed')
				: `request failed (${response.status})`;
		appendDebugError({
			scope: 'api.http',
			message,
			details: {
				url,
				status: response.status,
				statusText: response.statusText
			}
		});
		throw new Error(message);
	}

	return body as TResponse;
}

export function createApiStoryService(config: ApiStoryServiceConfig = {}): StoryService {
	const basePath = config.basePath ?? '/api';
	const fetchImpl = config.fetchImpl ?? fetch;

	const endpoint = (path: string): string => `${basePath}${path}`;

	return {
		async getOpeningScene(request) {
			const payload = await postJson<{ scene: unknown }>(
				fetchImpl,
				endpoint('/story/opening'),
				{
					useMocks: request?.useMocks ?? false,
					featureFlags: request?.featureFlags ?? null
				}
			);
			return ensureSceneShape(payload.scene, '/story/opening');
		},
		async getNextScene(currentSceneId, choiceId, gameState, narrativeContext = null, options = {}) {
			const payload = await postJson<{ scene: unknown }>(fetchImpl, endpoint('/story/next'), {
				currentSceneId,
				choiceId,
				gameState,
				narrativeContext,
				options
			});
			return ensureSceneShape(payload.scene, '/story/next');
		},
		async getRecoveryScene() {
			const payload = await postJson<{ scene: unknown }>(
				fetchImpl,
				endpoint('/story/opening'),
				{ useMocks: false }
			);
			return ensureSceneShape(payload.scene, '/story/opening');
		},
		isAvailable() {
			return true;
		}
	};
}

```

#### Game runtime orchestration
Source: `src/lib/game/gameRuntime.ts`

```ts
import {
	cloneGameState,
	cloneScene,
	createGameState,
	isValidChoiceId,
	mergeThreadUpdates,
	normalizeFeatureFlags,
	validateScene,
	type EndingType,
	type GameSettings,
	type GameState,
	type RuntimeFeatureFlags,
	type Scene
} from '$lib/contracts';
import {
	createSettingsStorage,
	type SettingsStorage,
	type StorageBindings,
	type StoryService
} from '$lib/services';
import { mockStoryService } from '$lib/services/mockStoryService';

export interface EndingPayload {
	endingType: EndingType;
	sceneId: string;
	stats: {
		sceneCount: number;
		lessonsCount: number;
		durationMs: number;
	};
	unlockedEndings: EndingType[];
}

export interface GameTurnResult {
	scene: Scene;
	gameState: GameState;
	isEnding: boolean;
	ending: EndingPayload | null;
}

export interface StartGameOptions {
	useMocks?: boolean;
	featureFlags?: Partial<RuntimeFeatureFlags>;
}

export interface GameRuntimeOptions {
	storyService?: StoryService;
	settingsStorage?: SettingsStorage;
	storageBindings?: StorageBindings;
	now?: () => number;
}

export interface GameRuntime {
	startGame(options?: StartGameOptions): Promise<GameTurnResult>;
	handleChoice(choiceId: string, choiceText?: string): Promise<GameTurnResult>;
	getCurrentScene(): Scene | null;
	loadSceneById(sceneId: string): Scene | null;
	getState(): GameState | null;
	getSettings(): GameSettings;
	refreshSettings(): GameSettings;
	updateSettings(patch: Partial<GameSettings>): GameSettings;
	setFeatureFlags(overrides: Partial<RuntimeFeatureFlags>): RuntimeFeatureFlags;
	clearFeatureFlags(): RuntimeFeatureFlags;
	isProcessing(): boolean;
	getEnding(): EndingPayload | null;
}

function cloneSettings(settings: GameSettings): GameSettings {
	return {
		...settings,
		unlockedEndings: [...settings.unlockedEndings],
		featureFlags: { ...settings.featureFlags }
	};
}

function normalizeEndingList(endings: EndingType[]): EndingType[] {
	const deduped = new Set(endings.filter((ending) => typeof ending === 'string' && ending.trim().length > 0));
	return [...deduped];
}

export function createGameRuntime(options: GameRuntimeOptions = {}): GameRuntime {
	const now = options.now ?? Date.now;
	const storyService = options.storyService ?? mockStoryService;
	const settingsStorage =
		options.settingsStorage ??
		createSettingsStorage({
			local: options.storageBindings?.local,
			session: options.storageBindings?.session
		});

	let settings = settingsStorage.loadSettings();
	let gameState: GameState | null = null;
	let currentScene: Scene | null = null;
	let lastEnding: EndingPayload | null = null;
	let processing = false;

	const refreshSettings = (): GameSettings => {
		settings = settingsStorage.loadSettings();
		return cloneSettings(settings);
	};

	const updateSettings = (patch: Partial<GameSettings>): GameSettings => {
		const normalizedPatch: Partial<GameSettings> = { ...patch };

		if (patch.featureFlags) {
			normalizedPatch.featureFlags = normalizeFeatureFlags({
				...settings.featureFlags,
				...patch.featureFlags
			});
		}
		if (patch.unlockedEndings) {
			normalizedPatch.unlockedEndings = normalizeEndingList(patch.unlockedEndings);
		}
		settings = settingsStorage.saveSettings(normalizedPatch);
		return cloneSettings(settings);
	};

	const buildTurnResult = (scene: Scene): GameTurnResult => {
		if (!gameState) {
			throw new Error('Game state is not initialized');
		}
		return {
			scene: cloneScene(scene),
			gameState: cloneGameState(gameState),
			isEnding: scene.isEnding,
			ending: lastEnding
		};
	};

	const buildEndingPayload = (scene: Scene): EndingPayload => {
		if (!gameState || !scene.endingType) {
			throw new Error('Ending payload requires ending scene and active game state');
		}

		if (!settings.unlockedEndings.includes(scene.endingType)) {
			const nextEndings = normalizeEndingList([...settings.unlockedEndings, scene.endingType]);
			settings.unlockedEndings = settingsStorage.saveUnlockedEndings(nextEndings);
		}

		return {
			endingType: scene.endingType,
			sceneId: scene.sceneId,
			stats: {
				sceneCount: gameState.sceneCount,
				lessonsCount: gameState.lessonsEncountered.length,
				durationMs: Math.max(0, now() - gameState.startTime)
			},
			unlockedEndings: [...settings.unlockedEndings]
		};
	};

	const applyScene = (scene: Scene): void => {
		if (!gameState) {
			throw new Error('Cannot apply scene before game start');
		}

		if (scene.storyThreadUpdates) {
			gameState.storyThreads = mergeThreadUpdates(gameState.storyThreads, scene.storyThreadUpdates);
		}

		gameState.pendingTransitionBridge = null;
		gameState.currentSceneId = scene.sceneId;
		gameState.sceneCount += 1;

		const lastHistoryEntry = gameState.history[gameState.history.length - 1];
		gameState.sceneLog.push({
			sceneId: scene.sceneId,
			sceneText: scene.sceneText,
			viaChoiceText: lastHistoryEntry?.choiceText ?? '',
			isEnding: scene.isEnding
		});

		if (scene.lessonId && !gameState.lessonsEncountered.includes(scene.lessonId)) {
			gameState.lessonsEncountered.push(scene.lessonId);
		}

		currentScene = cloneScene(scene);
		lastEnding = scene.isEnding ? buildEndingPayload(scene) : null;
	};

	const startGame = async (startOptions: StartGameOptions = {}): Promise<GameTurnResult> => {
		const effectiveFlags = normalizeFeatureFlags({
			...settings.featureFlags,
			...startOptions.featureFlags
		});

		gameState = createGameState({
			featureFlags: effectiveFlags,
			apiKey: null,
			useMocks: false,
			now
		});

		const openingScene = await storyService.getOpeningScene({
			useMocks: false,
			featureFlags: effectiveFlags
		});
		if (!validateScene(openingScene)) {
			throw new Error('Story service returned invalid opening scene');
		}

		gameState.currentSceneId = openingScene.sceneId;
		gameState.sceneCount = 1;
		gameState.sceneLog = [
			{
				sceneId: openingScene.sceneId,
				sceneText: openingScene.sceneText,
				viaChoiceText: '',
				isEnding: openingScene.isEnding
			}
		];

		if (openingScene.lessonId) {
			gameState.lessonsEncountered.push(openingScene.lessonId);
		}

		currentScene = cloneScene(openingScene);
		lastEnding = openingScene.isEnding ? buildEndingPayload(openingScene) : null;
		return buildTurnResult(openingScene);
	};

	const handleChoice = async (choiceId: string, choiceText = ''): Promise<GameTurnResult> => {
		if (!gameState || !currentScene) {
			throw new Error('Game has not started. Call startGame() first.');
		}
		if (processing) {
			throw new Error('Choice processing already in progress');
		}
		if (!isValidChoiceId(choiceId)) {
			throw new Error(`Invalid choice id: ${choiceId}`);
		}

		processing = true;
		gameState.history.push({
			sceneId: gameState.currentSceneId,
			choiceId,
			choiceText,
			timestamp: now()
		});

		try {
			const nextScene = await storyService.getNextScene(gameState.currentSceneId, choiceId, gameState);
			if (!validateScene(nextScene)) {
				throw new Error('Story service returned invalid scene payload');
			}
			applyScene(nextScene);
			return buildTurnResult(nextScene);
		} finally {
			processing = false;
		}
	};

	const setFeatureFlags = (overrides: Partial<RuntimeFeatureFlags>): RuntimeFeatureFlags => {
		const normalized = settingsStorage.saveFeatureFlags({ ...settings.featureFlags, ...overrides });
		settings.featureFlags = normalized;
		return { ...normalized };
	};

	const clearFeatureFlags = (): RuntimeFeatureFlags => {
		const cleared = settingsStorage.clearFeatureFlags();
		settings.featureFlags = cleared;
		return { ...cleared };
	};

	const loadSceneById = (sceneId: string): Scene | null => {
		if (!sceneId || !storyService.getSceneById) return null;
		const scene = storyService.getSceneById(sceneId);
		if (!scene || !validateScene(scene)) return null;
		return cloneScene(scene);
	};

	return {
		startGame,
		handleChoice,
		getCurrentScene: () => (currentScene ? cloneScene(currentScene) : null),
		loadSceneById,
		getState: () => (gameState ? cloneGameState(gameState) : null),
		getSettings: () => cloneSettings(settings),
		refreshSettings,
		updateSettings,
		setFeatureFlags,
		clearFeatureFlags,
		isProcessing: () => processing,
		getEnding: () => (lastEnding ? { ...lastEnding, unlockedEndings: [...lastEnding.unlockedEndings] } : null)
	};
}

```

### 9.2 Wired vs Not Wired (current state)

Wired:
- provider interface includes `narrativeContext`
- route handlers accept and forward `narrativeContext`
- Grok provider can format/use `narrativeContext`
- lesson nullability instruction exists in active Grok prompt text

Not fully wired:
- `gameRuntime` currently calls `storyService.getNextScene(...)` without building/passing rich app-owned `narrativeContext`
- active Grok prompt is simpler than full canonical `SYSTEM_PROMPT` in `js/prompts.js`
- full translation/transition/anti-repetition machinery in `js/prompts.js` not yet fully ported into active `src` runtime path

---

## 10) Traceability Table

| Asset | Canonical Source | Runtime Target | Test Target |
|---|---|---|---|
| System prompt voice and rules | `js/prompts.js` (`SYSTEM_PROMPT`) | `src/lib/server/ai/providers/grok.ts` prompt builder parity | integration + e2e narrative quality checks |
| Handwritten thread lines | `docs/HANDWRITTEN_NARRATIVE_ASSETS.md` + `js/prompts.js` maps | `src` context builder + provider context formatting | thread continuity tests |
| Lesson corpus (1-17) | `js/lessons.js` | prompt/labeling + recap rendering path | lesson surfacing tests |
| Recovery rewrite policy | `docs/HANDWRITTEN_NARRATIVE_ASSETS.md` + `js/prompts.js` recovery prompt | provider parse-repair loop in `src/lib/server/ai/providers/grok.ts` | malformed output recovery tests |
| Transition bridges | `js/prompts.js` `TRANSITION_BRIDGE_MAP` | app/runtime jump detection + provider context | transition-on-jump tests |
| Guardrails | `js/prompts.js`, `src/lib/server/ai/routeHelpers.ts`, `src/lib/server/ai/providers/grok.ts` | route/provider enforcement | guardrail tests |

---

## 11) Open Risks + Review Questions

Open risks:
- split-brain between canonical prompt assets (`js/*`) and active runtime prompt path (`src/*`)
- context parity gap causes narrative regression despite valid schema output
- transition bridge logic exists canonically but may not be applied in active runtime turns
- lesson quality can degrade if labeling remains structural but not semantically grounded

Review questions for Claude:
- Which exact canonical rules from `SYSTEM_PROMPT` are missing in active Grok prompt and likely to hurt narrative quality first?
- Which thread translations are too specific or too abstract for robust turn-by-turn continuity?
- Does current recovery behavior preserve story intent or over-rewrite under parse pressure?
- Are there hidden contradictions between handwritten assets and active runtime behavior?
- What would a group of haters say about the current narrative stack, and which 3 changes would silence them fastest?

---

## 12) Appendix

### 12.1 Historical Prompt Snapshot
Source: `docs/AI_PROMPT_DUMP_2026-02-05.md`

```markdown
# AI Prompt Dump (2026-02-05)

This file captures every prompt template currently used by the AI pipeline.

## 1) Master System Prompt (`SYSTEM_PROMPT`)
Source: `js/prompts.js:86-283`
```js
export const SYSTEM_PROMPT = `You are an AI storyteller for "No Vacancies," an interactive fiction game about invisible labor and emotional load-bearing in relationships.

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

${formatLessonsForPrompt()}

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
}`;
```

## 2) Continue Prompt Template (`getContinuePrompt`)
Source: `js/prompts.js:294-350`
```js
export function getContinuePrompt(previousScenes, lastChoice, sceneCount, suggestedEnding = null, threads = null) {
    const history =
        previousScenes.length > 5
            ? previousScenes.slice(-5).join('\n---\n')
            : previousScenes.join('\n---\n');

    // Include thread state if available
    let threadSection = '';
    if (threads) {
        threadSection = formatThreadState(threads);
    }

    const longArcSummary = buildLongArcSummary(previousScenes, 4);

    let endingGuidance = '';

    if (sceneCount >= 8) {
        endingGuidance = '\n\nIMPORTANT: We are approaching the end of the story.';

        if (suggestedEnding) {
            endingGuidance += ` Based on the player's choices, please steer the narrative toward the **${suggestedEnding.toUpperCase()}** ending.`;
            
            if (suggestedEnding === EndingTypes.RARE) {
                endingGuidance += ' Oswaldo should start to actually SEE the labor. He should be shocked into awareness.';
            } else if (suggestedEnding === EndingTypes.EXIT) {
                endingGuidance += ' Sydney should feel ready to leave. The weight is too much.';
            } else if (suggestedEnding === EndingTypes.SHIFT) {
                endingGuidance += ' Sydney should set a boundary. It feels uncomfortable but necessary.';
            } else {
                endingGuidance += ' Sydney accepts the cycle. Nothing changes, but she is awake to it.';
            }
        } else {
            endingGuidance += " Consider steering toward a fitting ending based on the player's choice patterns. If they've been confrontational, consider EXIT. If they've been accepting, consider LOOP. If they've pushed for change, consider SHIFT or RARE.";
        }
    }

    return `## STORY SO FAR
${history}
${threadSection}
${longArcSummary}

## PLAYER'S CHOICE
The player chose: "${lastChoice}"

## YOUR TASK
Continue the story based on this choice. Remember:
- Keep it 150-250 words
- Provide 2-3 meaningful choices (unless this is an ending)
- Weave in a lesson naturally if appropriate
- Maintain dark humor as coping
- Include one concrete callback to recent history or thread state
- Avoid repeating the previous scene's exact framing or rhythm
- Include "storyThreadUpdates" with only changed thread fields (omit field if unchanged)
- The choice should have consequences${endingGuidance}

Respond with valid JSON only.`;
}
```

## 3) Opening Prompt Template (`getOpeningPrompt`)
Source: `js/prompts.js:356-371`
```js
export function getOpeningPrompt() {
    return `## OPENING SCENE

Generate the opening scene of Sydney's story.

The scene must:
- Establish the time (6:47 AM), place (motel room), and situation ($47, need $65 by 11 AM)
- Show Oswaldo sleeping, Trina crashed on the floor
- Convey Sydney's isolation - she's the only one awake, the only one who knows how close everything is to falling apart
- End with 2-3 distinct choices for how Sydney approaches this morning
- Final sentence must create immediate player agency tension ("What do you do right now?")

Set the mood as TENSE. This scene demonstrates Lesson 1: Load-bearing beams get leaned on.

Respond with valid JSON only.`;
}
```

## 4) JSON Recovery Prompt (`getRecoveryPrompt`)
Source: `js/prompts.js:378-396`
```js
export function getRecoveryPrompt(invalidOutput) {
    return `Your previous response was not valid JSON. 

Previous output:
${invalidOutput.substring(0, 500)}...

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
}`;
}
```

## 5) Quality Repair Prompt (`buildQualityRepairPrompt`)
Source: `js/services/geminiStoryService.js:678-688`
```js
    buildQualityRepairPrompt(originalPrompt, response, issues) {
        return `${originalPrompt}

QUALITY REVISION REQUIRED:
- ${issues.join('\n- ')}

Prior JSON (for reference):
${JSON.stringify(response).slice(0, 900)}

Return corrected JSON only.`;
    }
```

## 6) Final API prompt composition
Source: `js/services/geminiStoryService.js:231`
```js
parts: [{ text: SYSTEM_PROMPT + '\n\n' + userPrompt }]
```

## 7) Response schema constraints (prompt-adjacent contract)
Source: `js/services/geminiStoryService.js:236-279`
```js
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: 'object',
                    properties: {
                        sceneText: { type: 'string', minLength: 200, maxLength: 2600 },
                        choices: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    text: { type: 'string' }
                                },
                                required: ['id', 'text']
                            }
                        },
                        lessonId: { type: 'integer' },
                        imageKey: { type: 'string' },
                        isEnding: { type: 'boolean' },
                        endingType: { type: 'string' },
                        mood: {
                            type: 'string',
                            enum: ['neutral', 'tense', 'hopeful', 'dark', 'triumphant']
                        },
                        storyThreadUpdates: {
                            type: 'object',
                            description: 'Updates to story continuity threads (only include fields that changed)',
                            properties: {
                                oswaldoConflict: { type: 'integer', minimum: -2, maximum: 2 },
                                trinaTension: { type: 'integer', minimum: 0, maximum: 3 },
                                moneyResolved: { type: 'boolean' },
                                carMentioned: { type: 'boolean' },
                                sydneyRealization: { type: 'integer', minimum: 0, maximum: 3 },
                                boundariesSet: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'NEW boundaries set this scene (not all boundaries)'
                                },
                                oswaldoAwareness: { type: 'integer', minimum: 0, maximum: 3 },
                                exhaustionLevel: { type: 'integer', minimum: 1, maximum: 5 }
                            }
```
```

### 12.2 Prior System/Lesson Review
Source: `docs/AI_SYSTEM_WRITING_LESSON_REVIEW_2026-02-05.md`

```markdown
# AI System, Prompting, and Lesson Delivery Review (2026-02-05)

## A) How the AI system works right now

### Runtime flow

1. `app.js` picks service mode:
   - AI mode -> `geminiStoryService`
   - fallback mode -> `mockStoryService`
2. AI opening turn:
   - `getOpeningPrompt()` builds user prompt.
   - API request sends: `SYSTEM_PROMPT + "\n\n" + userPrompt`.
3. AI continuation turn:
   - `getContinuePrompt(...)` includes:
     - last ~5 scene history
     - thread state (`storyThreads`)
     - long-arc sampled memory
     - ending guidance after scene 8
4. Parse and reliability handling:
   - strict JSON parsing + code-block extraction fallback
   - one JSON recovery retry via `getRecoveryPrompt(...)`
   - if primary model fails, fallback model is attempted
5. Semantic quality gate:
   - rejects near-duplicate choices
   - rejects repetitive scene framing
   - requires concrete continuity callback after early scenes
   - triggers one quality-repair retry prompt
6. Scene formatting:
   - choice IDs normalized/sanitized
   - image/mood mapped to internal enums
   - final scene validated before apply
7. App state update:
   - `storyThreadUpdates` merged
   - lesson tracked for stats
   - if AI service fails mid-run, app falls back to mock recovery scene instead of forced ending.

### Prompt inventory (all prompt templates)

Prompt sources and full text are dumped in:
- `docs/AI_PROMPT_DUMP_2026-02-05.md`

Prompt templates in active use:
1. `SYSTEM_PROMPT` (`js/prompts.js`)
2. `getContinuePrompt(...)` (`js/prompts.js`)
3. `getOpeningPrompt()` (`js/prompts.js`)
4. `getRecoveryPrompt(...)` (`js/prompts.js`)
5. `buildQualityRepairPrompt(...)` (`js/services/geminiStoryService.js`)

## B) Characteristics of top-quality prompts for "aha"/self-recognition storytelling

### Conventional high-quality traits

1. **Concrete continuity constraints**: names, prior events, unresolved obligations.
2. **Clear voice constraints**: POV, tense, tone, sentence rhythm.
3. **Explicit output schema**: structured JSON with required/optional fields.
4. **Meaningful choice constraints**: choices must represent different strategies.
5. **Ending steering with guardrails**: no abrupt ending without narrative earning.
6. **Error-recovery prompts**: malformed output path that preserves style and flow.

### Unconventional but effective traits

1. **Identity mirror hooks**: ask model to include one "recognition sentence" where the player can project themselves.
2. **Emotional contradiction rule**: force at least one mixed emotion beat (relief + guilt, power + shame).
3. **Cost accounting beat**: each scene names one hidden cost (time, attention, dignity, risk).
4. **Micro-specific sensory anchor**: one tactile/ambient detail tied to stress state.
5. **Behavior over explanation clause**: forbid abstract psych labels; require observable behavior.
6. **Narrative debt ledger**: if a setup appears (car incident, money gap), it must be paid off within N scenes or explicitly deferred.

### "Aha moment" prompt pattern

To increase player self-recognition, prompts should force:
- one concrete callback ("this happened before"),
- one pattern reveal ("this keeps happening"),
- one self-implicating question ("what am I rewarding right now?"),
- one agency fork (different values, not just different words).

## C) Lesson delivery review (how each lesson is shown, and better options)

Current system:
- Lesson IDs are attached per scene (`lessonId`).
- Popups show title + quote after text typing completes.
- In AI mode, model decides lesson per scene (or null).
- In mock mode, lessons are pre-assigned in authored scenes.

Important gap:
- `detectLessonInScene(...)` exists but is not currently used as fallback/validator.

### Per-lesson assessment

| ID | Lesson | Current delivery quality | Suggested upgrade |
|---:|---|---|---|
| 1 | Load-Bearing Beams | Strong opening anchor | Re-surface with late-game mirror beat showing cumulative cost |
| 2 | They Don't Understand the Concept | Good dialogue trigger | Add explicit "misread competence as ease" callback rule |
| 3 | Resentment Toward Load-Bearer | Works in conflict scenes | Tie resentment to a specific success event for causality |
| 4 | Your Energy Keeps It Alive | Strong systemic lesson | Add "what breaks if you stop?" choice branch at least once/run |
| 5 | Output vs Presence | Present but under-highlighted | Add one quiet scene where no output is produced, then observe reactions |
| 6 | Invisibility of Competence | Good recurring fit | Require one "prevented disaster" line before each use |
| 7 | This Isn't Hard | Clear phrase trigger | Add behavioral proof contrast ("he tries once, fails, dismisses") |
| 8 | Asking for Help Doesn't Work | Appears, but can be deeper | Add failed ask + self-silencing follow-up in consecutive scenes |
| 9 | Discomfort Becomes Attacks | Good in defensive beats | Require escalation ladder (snip -> deflect -> accuse) |
| 10 | What You Actually Want to Hear | High emotional payoff | Reserve for climactic turns to avoid dilution |
| 11 | See It AND Act Accordingly | Strong insight, rare use | Add action-check line after any acknowledgment dialogue |
| 12 | Making Effort Legible | Strong behavioral mechanic | Explicitly frame as reality-reintroduction, not punishment |
| 13 | Won't vs Can't | Important pattern lesson | Add contrast proof in-scene every time this lesson appears |
| 14 | System Responds to Load Distribution | Conceptually strong | Convert abstract phrasing into visible task distribution moments |
| 15 | Infrastructure Gets Blamed | Underused but potent | Add one scene where one miss outweighs many saves |
| 16 | Relationships as Risk Reduction | High "aha" potential | Add "who reduces whose risk?" question as choice text |
| 17 | What Am I to You? | Strong late-game pivot | Trigger only after evidence accumulation for maximum impact |

### Structural improvements for lessons

1. Add lesson pacing policy:
   - early game: 1/2/6/7
   - middle game: 3/4/8/9/11/13/14/15
   - late game: 5/10/12/16/17
2. Add anti-repetition:
   - no same lesson ID in back-to-back scenes unless player repeats same coping strategy.
3. Add fallback lesson detection:
   - if AI returns null lesson but scene clearly matches a rule, infer one with `detectLessonInScene`.
4. Add lesson "show receipts":
   - every lesson scene includes one concrete proof line.

## D) What the app already does to improve prose + what to improve next

### What is already strong (current implementation)

1. Rich system prompt with voice, rhythm, behavior constraints.
2. Continuity state (`storyThreads`) included in turn prompts.
3. Long-arc memory sampling to prevent short-context amnesia.
4. Choice distinctness quality checks.
5. Repetition guard against near-duplicate scene framing.
6. Continuity callback quality gate.
7. One-shot quality-repair pass before accepting weak output.
8. Ending steering based on accumulated player choice patterns.

### Conventional improvements (high confidence)

1. **Scene beat contract**: require each scene to include:
   - pressure signal,
   - decision pressure,
   - consequence setup.
2. **Choice intent labels (internal only)**:
   - each choice tagged as avoid/confront/repair/exit, then strip tags before render.
3. **Lesson pacing schedule**:
   - enforce lesson arcs by scene range.
4. **Hard callback rule**:
   - at least one named callback from last two scenes and one from thread state.
5. **Dialogue realism pass**:
   - short second-pass prompt only for dialogue tightening.
6. **Model-side lexical diversity check**:
   - avoid repeated phrase stems from previous scene.

### Unconventional improvements (high upside)

1. **Aha sentence requirement**:
   - one line that reframes behavior as a pattern the player can recognize in themselves.
2. **Narrative debt ledger**:
   - unresolved setup must be referenced or closed within 3 scenes.
3. **Contradiction engine**:
   - each major scene carries one emotional contradiction (care + resentment).
4. **Shadow consequence pass**:
   - generate one unseen cost of each player choice and weave it subtly into next scene.
5. **Reader projection cue**:
   - one "you do this too" behavioral mirror per 2-3 scenes, non-judgmental tone.
6. **Compression pass for mobile readability**:
   - if scene exceeds rhythm threshold, rewrite with same content but sharper line breaks.

## Priority recommendations for immediate impact

1. Add lesson pacing + anti-repeat rule (high impact, low risk).
2. Add hard callback contract (named recent callback + thread callback).
3. Add scene beat contract (pressure -> choice pressure -> consequence setup).
4. Add fallback lesson detection using `detectLessonInScene`.
5. Add "aha sentence" micro-rule to continuation prompt.

```

### 12.3 Local Upgrade Governance / RCR / Traceability
Source: `docs/LOCAL_NARRATIVE_UPGRADE_PLAN.md`

```markdown
# Local Narrative Upgrade Plan (Test-First, Low-Debt)

## Objective
Improve narrative quality, continuity, and choice consequence while reducing repetition, without weakening reliability invariants.

## Scope
- Local narrative pipeline only.
- Prompt/content/context/test upgrades only.
- Ignore `grokchangeover.md` for this track.
- Keep image files untouched.

## Out of Scope
- SvelteKit rewrite.
- Provider migration to Grok.
- Broad UI redesign.

## Invariants (Must Never Regress)
- AI->mock fallback remains playable.
- Parse recovery remains bounded.
- No secret leakage.
- Accessibility continuity preserved.
- Image and character continuity guardrails preserved.

---

## Current Status Snapshot
- `DONE` Voice ceiling anchors added to `SYSTEM_PROMPT` and covered by regression test.
- `PENDING` Trina-specific behavior examples in `## TRINA` prompt section.
- `PENDING` Move event-specific lines out of thread-state translations.
- `PENDING` Boundary-specific translation mapping.
- `PENDING` Lesson-history translation map (17 lines).
- `PENDING` Transition-bridge injection on thread jumps only.
- `PENDING` App-owned `NarrativeContext` as single source of truth.
- `PENDING` Context-size/truncation telemetry.

---

## Traceability Map (Do Not Lose Details)

| Asset ID | Source of Truth | Target Location | Test Coverage | Status |
|---|---|---|---|---|
| `TRINA_SNACKCAKE_01` | `docs/HANDWRITTEN_NARRATIVE_ASSETS.md` (`1.2 Trina Tension`) | `js/prompts.js` -> `## TRINA` | `T1.1` | `PENDING` |
| `TRINA_CATFISH_02` | `docs/HANDWRITTEN_NARRATIVE_ASSETS.md` (`1.2 Trina Tension`) | `js/prompts.js` -> `## TRINA` | `T1.1` | `PENDING` |
| `TRINA_REFERRAL_03` | `docs/HANDWRITTEN_NARRATIVE_ASSETS.md` (`1.2 Trina Tension`) | `js/prompts.js` -> `## TRINA` | `T1.1` | `PENDING` |
| `VOICE_CEILING_01` | `docs/HANDWRITTEN_NARRATIVE_ASSETS.md` (`12.1 Gold Lines`) | `js/prompts.js` -> `## VOICE CEILING EXAMPLES` | Existing regression (`Test 8.2`) | `DONE` |
| `BOUNDARY_MAP_01` | `docs/HANDWRITTEN_NARRATIVE_ASSETS.md` (`1.8 Boundaries`) | `js/prompts.js` boundary translation mapping | `T1.3` | `PENDING` |
| `LESSON_HISTORY_01_17` | `docs/HANDWRITTEN_NARRATIVE_ASSETS.md` + `js/lessons.js` | `js/prompts.js` lesson-history context block | `T1.4` | `PENDING` |
| `TRANSITION_BRIDGE_SET` | `docs/HANDWRITTEN_NARRATIVE_ASSETS.md` (`2 Transition Lines`) | `js/app.js` + `js/prompts.js` jump bridge injection | `T3.1`, `T3.2` | `PENDING` |
| `THREAD_GENERALIZATION` | `docs/HANDWRITTEN_NARRATIVE_ASSETS.md` (`1.2 Trina Tension`) | `js/prompts.js` thread-state formatter | `T1.2` | `PENDING` |

Traceability rules:
- Every new handwritten narrative line must get an `Asset ID` row before implementation.
- No prompt content ships without mapped test coverage (`T*`).

---

## Debt Register (Known Technical Debt)
1. Monolithic `SYSTEM_PROMPT` string is hard to evolve safely.
2. App/service narrative memory split risks drift until context unification lands.
3. Prompt assets are not fully modularized (character examples vs state translations vs transitions).
4. Transition logic not yet encoded as explicit runtime contract.
5. No explicit numeric context budget contract persisted in one place.

---

## Best-Process Workflow (Least Technical Debt)
1. Write failing test for one change.
2. Make minimal code/prompt edit.
3. Run `npm run lint` and `npm test`.
4. Commit single-purpose slice.
5. Update docs in same slice (`CHANGELOG.md`, `AI_LESSONS_LEARNED.md` when applicable).
6. Never mix refactor + behavior + docs in one large commit.

---

## Review, Critique, Revise Loop (Required per Phase)

Each phase requires two RCR passes:
- Pre-phase RCR: risk forecast before implementation starts.
- Pre-close RCR: critique after implementation and before phase close.

Mandatory critique questions (must be answered in every phase):
- What would a group of haters say about the work I just did?
- Which part is most likely to fail silently?
- What did we assume without proof?
- Which specific test ID (`T*`) would fail first if we are wrong?

Completion gate:
- A phase cannot close unless Review, Critique, and Revise are all documented.
- Critique comments must reference specific test IDs (`T*`) and resulting changes.

Required artifact per phase:
- `Phase Review Note` including:
  - issues found
  - plan delta
  - test delta
  - rollback impact

---

## Phase-by-Phase Test Matrix

## Phase 0: Baseline Lock
Goal: Freeze behavior and establish green baseline before narrative edits.

- `T0.1` Baseline lint/test gate
  - Command: `npm run lint`, `npm test`
  - Pass: all green
  - Blocks release: yes

- `T0.2` Existing invariants still enforced
  - Test area: fallback, parse recovery, anti-repeat suites
  - Pass: invariant tests green
  - Blocks release: yes

## Phase 1: Prompt Content Hardening
Goal: Improve narrative quality with minimal architecture risk.

- `T1.1` Trina behavior examples present in `SYSTEM_PROMPT`
  - File: `js/prompts.js`, `tests/integrationTest.js`
  - Assert: prompt includes snack-cake, catfish, and casino-referral behaviors
  - Blocks release: yes

- `T1.2` Thread translations remain general (non-factual event injection)
  - File: `js/prompts.js`, `tests/integrationTest.js`
  - Assert: `trinaTension` state lines do not assert specific past events as already happened
  - Blocks release: yes

- `T1.3` Boundary translation map exists
  - File: `js/prompts.js`, `tests/integrationTest.js`
  - Assert: known boundaries map to deterministic narrative lines
  - Blocks release: yes

- `T1.4` Lesson-history translation map complete
  - File: `js/prompts.js`, `tests/integrationTest.js`
  - Assert: 17 entries exist; each entry non-empty
  - Blocks release: yes

- `T1.5` Utility lines tuned for high-frequency reuse
  - File: `js/prompts.js`
  - Assert: unresolved-money line is concise and stable
  - Blocks release: no

## Phase 2: Context Ownership Unification
Goal: Remove split-brain memory and centralize AI context.

- `T2.1` `NarrativeContext` contract defined and validated
  - File: `js/contracts.js`, `tests/integrationTest.js`
  - Assert: context object shape required fields validated
  - Blocks release: yes

- `T2.2` App builds and passes context each turn
  - File: `js/app.js`, `js/services/geminiStoryService.js`, tests
  - Assert: service receives app-built context; no missing required sections
  - Blocks release: yes

- `T2.3` Compatibility seam works with feature flag off/on
  - File: app/service/tests
  - Assert: parity behavior when flag off; upgraded behavior when flag on
  - Blocks release: yes

- `T2.4` Context budget enforcement
  - File: prompt/context builder/tests
  - Assert: last 2 full scenes + compressed older summary under cap
  - Blocks release: yes

## Phase 3: Transition Bridges + Anti-Repetition
Goal: Make state jumps feel earned and reduce narrative repetition.

- `T3.1` Transition bridge appears only on state jumps
  - File: app/prompt/tests
  - Assert: jump from X->Y injects bridge text
  - Blocks release: yes

- `T3.2` No bridge on stable state
  - File: app/prompt/tests
  - Assert: unchanged state does not inject bridge text
  - Blocks release: yes

- `T3.3` Anti-repetition checks remain active
  - File: service/tests
  - Assert: repeated openings/choice near-duplicates still fail quality gate
  - Blocks release: yes

## Phase 4: Telemetry + Tuning
Goal: Tune using evidence, not anecdote.

- `T4.1` Telemetry emits context/truncation metrics
  - File: `js/services/aiTelemetry.js` + tests
  - Assert: metrics emitted with stable schema
  - Blocks release: no

- `T4.2` Telemetry has no sensitive payload leakage
  - File: telemetry tests
  - Assert: no API key/secret values in logs
  - Blocks release: yes

- `T4.3` Quality smoke playthrough batch
  - Method: scripted or guided playthrough sample set
  - Assert: reduced repetition and no fallback regression
  - Blocks release: yes

---

## Release Gates (Per Phase)
- Must pass: `npm run lint`
- Must pass: `npm test`
- Must pass: `npm run test:e2e` when renderer/e2e behavior is touched
- Must include: docs updates for behavior-affecting changes

---

## Commit Policy
1. One behavior slice per commit.
2. Tests committed with behavior change (same commit).
3. Docs committed with behavior change (same commit).
4. Revertable by commit without cross-slice breakage.

---

## What a Hostile Reviewer Would Say
- "This is over-engineering prompt glue instead of fixing model quality."
- "You are adding layers (context objects, transitions, lesson maps) that can drift and rot."
- "Feature flags and seams will become permanent dead weight."
- "Manual hand-written assets are subjective and expensive to maintain."
- "You are optimizing for tests that check strings, not true story quality."

## Response / Mitigations
- Keep each layer narrowly scoped and test-backed; remove old paths after stabilization window.
- Add explicit cleanup milestone for flags/seams in the plan before Phase 4 close.
- Keep manual assets in one source file and treat them as product copy, not code logic.
- Combine structural tests with playthrough quality review rubric to avoid false confidence.
- Use telemetry to confirm outcome changes (repetition rate, retry rate, fallback rate) instead of relying on vibes.

---

## Rollback Plan
- Revert by phase commit group.
- If narrative quality dips, disable new context/transition behaviors and restore prior prompt set.
- Keep invariant tests as stop-ship guardrails.

```

### 12.4 Claude Collaboration Contract (Advisory)

Claude output format requested:
- Finding
