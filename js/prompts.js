/**
 * No Vacancies - AI Prompts
 *
 * System prompts and templates for Gemini story generation.
 * Contains all the context needed for consistent, thematic storytelling.
 */

import { lessons } from './lessons.js';
import { EndingTypes, ImageKeys } from './contracts.js';

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
 */
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
 */
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
 */
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
 */
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
 */
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
    }
    // Default fallback
    return ImageKeys.HOTEL_ROOM;
}

/**
 * Determine ending type based on choice history
 * @param {Array<{choiceId: string}>} history
 * @returns {string}
 */
export function suggestEndingFromHistory(history) {
    const choices = history.map((h) => h.choiceId.toLowerCase());

    const tokenizeChoiceId = (id) => id.split(/[^a-z]+/).filter(Boolean);

    // Weighted pattern evidence
    const exitPatterns = ['leave', 'exit', 'walk', 'door', 'out'];
    const shiftPatterns = ['boundary', 'tell', 'confront', 'different', 'assert'];
    const rarePatterns = ['wait', 'silence', 'press', 'question', 'listen'];
    const loopSignals = ['stay', 'quiet', 'accept', 'nothing', 'sit', 'same'];

    let exitScore = 0;
    let shiftScore = 0;
    let rareScore = 0;

    choices.forEach((choiceId) => {
        const tokens = new Set(tokenizeChoiceId(choiceId));

        if (exitPatterns.some((p) => tokens.has(p))) exitScore += 2;
        if (shiftPatterns.some((p) => tokens.has(p))) shiftScore += 2;
        if (rarePatterns.some((p) => tokens.has(p))) rareScore += 2;

        // Negative evidence: loop-like choices dampen EXIT/SHIFT steering.
        if (loopSignals.some((p) => tokens.has(p))) {
            exitScore -= 1;
            shiftScore -= 1;
        }
    });

    if (rareScore >= 6) return EndingTypes.RARE;
    if (exitScore >= 4 && exitScore >= shiftScore + 1) return EndingTypes.EXIT;
    if (shiftScore >= 4 && shiftScore >= exitScore) return EndingTypes.SHIFT;
    return EndingTypes.LOOP;
}
