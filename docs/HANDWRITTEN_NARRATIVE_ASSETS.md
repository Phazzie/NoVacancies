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
