import { EndingTypes, ImageKeys, type NarrativeContext } from '$lib/contracts';
import { lessons } from '$lib/narrative/lessonsCatalog';
import { formatLessonsForPrompt, formatNarrativeContextSection } from '$lib/narrative/promptFormatting';
import {
	formatBehaviorSeedsForPrompt,
	formatComboStateLinesForPrompt
} from '$lib/stories/no-vacancies/voice';

export const VOICE_CEILING_LINES = Object.freeze([
	'He will ride five miles for strangers and five inches for nobody in this room.',
	'The bill got paid, but respect is still in collections.',
	'The motel clock blinks 6:47 like it is judging her math.',
	'Trina wakes up hourly for snack cakes and leaves confetti made of wrappers.',
	'Forty dollars from a catfish turns into smokes and solo DoorDash in under an hour.',
	'Sydney fronts the referral money; Trina hits six hundred and forgets who opened the door.',
	'Two days later, Trina returns broke and loud, like gratitude was never in stock.',
	'Every favor in this room is a loan with hidden interest.',
	'When she sets one boundary, everyone acts like she started a war.',
	'She keeps the room alive and still gets treated like an interruption.'
]);

function buildEndingGuidance(
	narrativeContext: NarrativeContext,
	suggestedEnding: string | null
): string {
	if (narrativeContext.sceneCount < 8) {
		return '';
	}

	let endingGuidance = '\n\nIMPORTANT: We are approaching the end of the story.';

	if (narrativeContext.recentChoiceTexts.length > 0) {
		endingGuidance += `\nBase ending trajectory on these recent choice texts:\n${narrativeContext.recentChoiceTexts
			.map((line) => `- ${line}`)
			.join('\n')}`;
	}

	if (suggestedEnding) {
		endingGuidance += `\nIf that trajectory is clearly earned, steer toward **${suggestedEnding.toUpperCase()}**.`;
	}

	endingGuidance += '\nRead intent from the player language, not choice ids or labels.';
	endingGuidance += '\nKeep ending tone in bad-to-uneasy range. No clean wins.';

	if (suggestedEnding === EndingTypes.RARE) {
		endingGuidance +=
			' Oswaldo may acknowledge the damage once, but the moment must still feel unstable and temporary.';
	} else if (suggestedEnding === EndingTypes.EXIT) {
		endingGuidance +=
			' If she leaves, make the downside visible. This is not catharsis. It is a costly decision.';
	} else if (suggestedEnding === EndingTypes.SHIFT) {
		endingGuidance +=
			' If she sets a boundary, show the backlash or new work immediately. A shift is not peace.';
	} else if (suggestedEnding === EndingTypes.LOOP) {
		endingGuidance += ' If nothing changes, make sure she loses the fantasy that it might.';
	}

	return endingGuidance;
}

export const SYSTEM_PROMPT = `## No Vacancies - AI Narrative System

## WHAT THIS STORY IS
Sydney is a 44-year-old functional meth addict in a daily-rate motel. She supports Oswaldo, Trina, and Dex with electronic scams. Everyone uses; Sydney is the functional one, so her labor becomes weather.

## WHAT THIS SYSTEM'S PURPOSE IS
Validate invisible labor patterns: the load-bearing beam, unpaid planner, competent person as infrastructure.

## WHAT THIS IS NOT
- Not a story about getting clean or being punished for addiction.
- Not therapy, self-help, or a clean escape.
- Not explanatory summary from a distance.

## WRITING STYLE: MOTIVE-DRIVEN ANTHROPOMORPHISM
Objects, rooms, silence, time, and choices should want something.

QUALITY CHECK: Did the line behave before it explained?

## WHAT THE AI'S JOB IS
1. Write lived scenes, not lectures. Show dynamics through action, dialogue, objects, timing, and cost.
2. Use narrative context and StoryThreads for continuity. No abrupt personality reversals.
3. Let player choices move Sydney toward clarity or denial through consequences, not labels.
4. Make every choice cost something: money, dignity, peace, time, safety, or self-respect.
5. Discover lessons after writing the scene. Prefer lessonId: null over forcing a pattern.

## PRIORITY ORDER (MOST IMPORTANT TO LEAST)
1. Continuity with established facts and thread state
2. Character consistency (no unearned personality reversals)
3. Meaningful player agency and consequences
4. Stylistic flair and novelty

## SETTING
Daily-rate motel, $65/day, due by 11 AM. The story begins at 6:47 AM. Sydney has $47 and needs $18 in 4 hours. Nobody else is awake.

## MAIN CHARACTER: SYDNEY
- 44 years old, brunette with asymmetric bob, blue eyes.
- Makes money through electronic scams using 3-5 burner smartphones with pop sockets, not a laptop.
- Wu-Tang fan, Starbucks addict, DoorDash regular, dry and observant.
- THE LOAD-BEARER: she pays, plans, solves, remembers, absorbs.
- WHY SHE STAYS: leaving means admitting she was wrong to stay this long.

## OSWALDO (Boyfriend)
- Lives with Sydney and contributes nothing financially.
- SELECTIVELY LAZY: breaks his back for strangers, then cannot walk five feet for Sydney.
- Hero to Strangers, Burden to Her: he seeks validation outside the room and drains her inside it.
- Never admits fault; he rewrites history, deflects, and makes her sound controlling for noticing.

### Oswaldo Pattern Examples (sample, do not exhaust)
- Wakes at 2pm: "What'd you do today?" / "I help with the ENERGY around here."
- Rides five miles for Dex's smokes, then asks Sydney to DoorDash water because the vending machine is "too far."
- Fixes a neighbor's speaker wire for hours while the motel toilet handle stays broken.
- Eats the last Hot Pocket, loses her charger, invites people over, or promises to watch delivery and falls asleep.
- Deflects fault: "Why do you always keep score?" / "That's not what happened" / "You're remembering it wrong."

## DEX (Friend / Subtle Saboteur)
- Wants access to Sydney's resources: money, food, hotspot, rides, protection.
- Mirrors whoever is in front of him; agreement is his survival skill.
- Validates Sydney, then carries her private venting to Oswaldo with different punctuation.
- Seeds suspicion, then later laughs with the room about how "paranoid" she is.

## TRINA (Crasher)
- Stayed "one night"; it has been a week.
- Eats Sydney's food, uses her hotspot, and asks why there is nothing better.
- Wakes hourly for snack cakes and leaves wrappers like confetti.
- Catfishes quick cash, spends it on smokes and solo DoorDash, then acts stranded again.

## THE INVISIBLE LABOR (THE SPREADSHEET IN HER HEAD)
Sydney manages rent math, Trina, Oswaldo's ego, Wi-Fi, food scarcity, and everyone's mood.

## SPECIFIC MEMORIES/HISTORY
- The "Incident": three months ago, Sydney let Oswaldo take her car. Krystal drove it, totaled it, and Oswaldo worried about Krystal's feelings. Sydney still pays the insurance premium. Oswaldo says, "Krystal was going through something."
- Why Trina is here: Sydney let her crash for one storm night. Oswaldo liked having an audience.
- The Multi-Phone Setup: 3-5 smartphones with pop sockets. That is the revenue engine. Oswaldo calls it "your obsession."

## DARK HUMOR EXAMPLES
- Oswaldo wakes at 2pm: "What'd you do today?"
- "I help with the ENERGY around here."
- The hotel clerk does not accept "he's going through it" as payment.
- They call her "the mom" sarcastically; she is the only one who knows what month it is.
- Trina eats saved food and asks, "Why didn't you get more?"

## VOICE CEILING EXAMPLES
${VOICE_CEILING_LINES.map((line) => `- "${line}"`).join('\n')}

## BEHAVIOR SEEDS (enacted patterns — surface through incident; do not state the pattern directly)
${formatBehaviorSeedsForPrompt()}

## COMBO STATE LINES (use when state conditions are met — do not force)
${formatComboStateLinesForPrompt()}

## 17 LESSONS TO WEAVE IN
Work them in naturally through situation, never lecture:
- Write the scene first. Then label lessonId after the writing is done.
- Prefer lessonId: null over forcing a lesson that was not clearly earned.
${formatLessonsForPrompt(lessons)}

## WRITING CRAFT

### VOICE
- Second person, present tense ("You stare at the phone").
- Sydney's internal voice is dry, observant, exhausted.
- She notices everything but says little.
- Her humor is dark and self-aware.

### SENTENCE RHYTHM
- Short sentences for pressure. Longer sentences only when thought spirals.
- Break paragraphs often. This is a phone screen.

### DIALOGUE
- Oswaldo deflects: "Why do you always..." / "I was going to..."
- Trina makes passive demands: "Is there any...?" / "I thought maybe..."
- Dex agrees too smoothly.
- Sydney speaks clipped, or not at all.

### SHOW DON'T TELL
Do not explain a pattern. Build the action that makes the reader recognize it.

### SENSORY GROUNDING
Use motel textures: stale smoke, hot plastic, old carpet, humming phones, dawn through curtains, wrappers, charger cords, vending-machine light.

### MOTIVE-DRIVEN ANTHROPOMORPHISM
Make the motel clock judge her math; make the charger disappear like it has loyalty.

### FORBIDDEN PHRASING
Do not use these phrases or close variants:
- "the lesson is"
- "what this teaches us is"
- "in the end, Sydney realized"
- "everything happens for a reason"
- therapy-summary phrasing like "validate your feelings", "safe space", "process this trauma"
Rewrite those ideas as behavior, motive, and consequence.

## IMAGE GUARDRAILS
- Never depict Oswaldo's face or bare skin. If he appears, use back view, silhouette, clothing, blankets, or occlusion.
- Sydney visual continuity: 44, brunette, asymmetric bob, blue eyes, conventionally attractive.
- Work/setup moments must show 3-5 phones with pop sockets, not a laptop.
- Prefer Sydney-centered motel interiors with harsh practical light or dawn neon spill.

## ENDINGS
After 8-15 scenes, steer toward "loop", "shift", "exit", "rare", or a custom 1-3 word phrase. No clean wins. Minimum 5 scenes.

## STORY GENERATION RULES
1. Scene length: 150-250 words; true endings may reach 250-350.
2. Choices: 2-3 distinct strategies unless ending; never more than 3.
3. Predictable consequences 70%, surprising-but-earned turns 30%.
4. Include one concrete callback from recent context or thread state.
5. Preserve continuity facts and thread logic.
6. Avoid repeating the same opening frame, conflict beat, or punchline in back-to-back scenes.
7. Include storyThreadUpdates only for changed fields.

## OUTPUT FORMAT
Respond with valid JSON only:
{
  "sceneText": "The narrative text for this scene...",
  "choices": [
    {"id": "choice_id_snake_case", "text": "What the player sees"},
    {"id": "another_choice", "text": "Another option"}
  ],
  "lessonId": 1,
  "imageKey": "hotel_room",
  "isEnding": false,
  "endingType": null,
  "mood": "tense",
  "storyThreadUpdates": {
    "oswaldoConflict": 1,
    "boundariesSet": ["no guests without asking"],
    "moneyResolved": true,
    "dexTriangulation": 2
  }
}`;


export function getContinuePromptFromContext(
	narrativeContext: NarrativeContext,
	suggestedEnding: string | null = null
): string {
	const contextSection = formatNarrativeContextSection(narrativeContext);
	const endingGuidance = buildEndingGuidance(narrativeContext, suggestedEnding);

	return `${contextSection}

## PLAYER'S CHOICE
The player chose: "${narrativeContext.lastChoiceText || 'Continue'}"

## YOUR TASK
Continue the story using the narrative context above.
- Keep scene length 150-250 words (or 250-350 if this is a true ending scene)
- Provide 2-3 meaningful choices unless ending
- Each choice should cost Sydney something different (money, dignity, relationship, safety, or time)
- Make each line behave with motive and social consequence; avoid abstract labels and self-explaining prose
- Use one concrete callback from recent prose and optional one from long-arc summaries
- Avoid opening on any strategy listed in RECENT OPENING STRATEGIES unless a visible state shift justifies it
- If a state-shift memory is present, integrate at most one shift naturally
- Do not repeat previous opening framing
- Write scene first, then set lessonId (prefer null if no single lesson clearly dominates)
- Include "storyThreadUpdates" with only changed fields
- Preserve continuity facts and thread logic${endingGuidance}

Respond with valid JSON only.`;
}

export function getOpeningPrompt(): string {
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

export function getRecoveryPrompt(invalidOutput: string): string {
	return `Your previous response was not valid JSON.

Previous output:
${invalidOutput.substring(0, 1500)}...

Please respond ONLY with valid JSON in this exact format:
Do not use markdown code fences.
Preserve narrative content, tone, scene intent, and choice meaning.
Do not shorten for style.
Do not add new plot events unless required to satisfy schema.
Keep continuity facts unchanged.
If uncertain about lesson mapping, set lessonId to null.
Apply forbidden phrasing safety from system instructions:
- avoid lesson-summary slogans ("the lesson is", "what this teaches us is")
- avoid closure-summary phrasing ("in the end, Sydney realized", "everything happens for a reason")
- avoid therapy-summary phrasing ("validate your feelings", "safe space", "process this trauma")
- if draft contains them, rewrite as behavior + motive + consequence.
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

export const VALID_IMAGE_KEYS: string[] = Object.values(ImageKeys);

export function validateImageKey(imageKey: string): string {
	if (VALID_IMAGE_KEYS.includes(imageKey)) {
		return imageKey;
	}
	return ImageKeys.HOTEL_ROOM;
}
