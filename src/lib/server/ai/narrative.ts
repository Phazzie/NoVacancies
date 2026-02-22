import { EndingTypes, ImageKeys, type NarrativeContext, type StoryThreads } from '$lib/contracts';
import type { StoryConfig, EndingRule, Mechanic } from '$lib/contracts/story';

export const SYSTEM_PROMPT = `You are the AI Game Master for a narrative game.
Your goal is to drive the story forward based on the player's choices.
Maintain tone, consistency, and track narrative state.`;

/**
 * Format the Narrative Context into a prompt section
 * @param {import('./contracts.js').NarrativeContext} context
 * @returns {string}
 */
export function formatNarrativeContextSection(context: NarrativeContext): string {
    const lines = [
        '## NARRATIVE CONTEXT',
        `Current Scene Count: ${context.sceneCount}`,
        `Narrative Arc: ${context.arcPosition}`
    ];

    if (context.lessonHistoryLines && context.lessonHistoryLines.length > 0) {
        lines.push('');
        lines.push('### ACTIVE LESSONS');
        lines.push(...context.lessonHistoryLines.map((l: string) => `- ${l}`));
    }

    if (context.threadNarrativeLines && context.threadNarrativeLines.length > 0) {
        lines.push('');
        lines.push('### THREAD STATE');
        lines.push(...context.threadNarrativeLines.map((l: string) => `- ${l}`));
    }

    if (context.boundaryNarrativeLines && context.boundaryNarrativeLines.length > 0) {
        lines.push('');
        lines.push('### BOUNDARIES');
        lines.push(...context.boundaryNarrativeLines.map((l: string) => `- ${l}`));
    }
    
    if (context.transitionBridge && context.transitionBridge.lines.length > 0) {
        lines.push('');
        lines.push('### RECENT STATE SHIFTS (Incorporated these if possible)');
        lines.push(...context.transitionBridge.lines.map((l: string) => `> ${l}`));
    }

    if (context.olderSceneSummaries && context.olderSceneSummaries.length > 0) {
        lines.push('');
        lines.push('### PREVIOUSLY (Summary)');
        lines.push(...context.olderSceneSummaries.map((l: string) => `- ${l}`));
    }

    if (context.recentSceneProse && context.recentSceneProse.length > 0) {
        lines.push('');
        lines.push('### RECENT PROSE (Last 2 scenes)');
        context.recentSceneProse.forEach((scene: any) => {
            lines.push(`[Scene ${scene.sceneId}] (via "${scene.viaChoiceText}")`);
            lines.push(scene.text);
            lines.push('---');
        });
    }

    if (context.recentBeats && context.recentBeats.length > 0) {
        lines.push('');
        lines.push('### RECENT BEAT MEMORY (Do not repeat these)');
        lines.push(...context.recentBeats.map((l: string) => `- ${l}`));
    }

    return lines.join('\n');
}

/**
 * Continue prompt powered by app-owned NarrativeContext.
 * @param {import('./contracts.js').NarrativeContext} narrativeContext
 * @param {StoryConfig} storyConfig
 * @param {string|null} suggestedEnding
 * @returns {string}
 */
export function getContinuePromptFromContext(
	narrativeContext: NarrativeContext,
    storyConfig: StoryConfig,
	suggestedEnding: string | null = null
): string {
    const contextSection = formatNarrativeContextSection(narrativeContext);
    let endingGuidance = '';

    // TODO: Make ending threshold configurable?
    if (narrativeContext.sceneCount >= 8) {
        endingGuidance = '\n\nIMPORTANT: We are approaching the end of the story.';

        if (suggestedEnding) {
            endingGuidance += ` Based on choice history, steer toward **${suggestedEnding.toUpperCase()}** if earned.`;

            // Find specific guidance from config
            const rule = storyConfig.endingRules.find((r: EndingRule) => r.id === suggestedEnding || r.type === suggestedEnding);
            if (rule) {
                endingGuidance += ' ' + rule.narrativeGuidance;
            } else {
                 endingGuidance += ' Bring the story to a close based on the current state.';
            }

            // Legacy fallbacks for "No Vacancies" if rule not found (or if we want to be safe)
            if (storyConfig.legacyMode && !rule) {
                if (suggestedEnding === EndingTypes.RARE) {
                    endingGuidance += ' Oswaldo should acknowledge the damage once, then show signs the change may not hold.';
                } else if (suggestedEnding === EndingTypes.EXIT) {
                    endingGuidance += ' Sydney should leave into uncertainty with visible downside, not catharsis.';
                } else if (suggestedEnding === EndingTypes.SHIFT) {
                    endingGuidance += ' Sydney should set one concrete boundary; make clear it creates immediate backlash or work.';
                } else {
                    endingGuidance += ' Nothing changes. She just loses the fantasy that it might.';
                }
                endingGuidance += ' Keep ending tone in bad-to-ehhh range. No clean wins.';
            }
        }
    }

    // Build mechanics update instructions dynamically
    const mechanicsInstructions = storyConfig.mechanics.map((m: Mechanic) => {
        if (m.type === 'meter') return `"${m.id}": number (update ${m.name} based on action, range ${m.min}-${m.max})`;
        if (m.type === 'flag') return `"${m.id}": boolean (set ${m.name} true/false if changed)`;
        if (m.type === 'set') return `"${m.id}": string[] (set ${m.name} list of active items)`;
        return null;
    }).filter(Boolean).join(',\n    ');

    const characterNames = storyConfig.characters.map((c: any) => c.name).join(', ');
    const updateField = storyConfig.legacyMode ? "storyThreadUpdates" : "mechanicUpdates";

    return `${contextSection}

## PLAYER'S CHOICE
The player chose: "${narrativeContext.lastChoiceText || 'Continue'}"

## YOUR TASK
Continue the story using the narrative context above.
- Story: ${storyConfig.title}
- Premise: ${storyConfig.premise}
- Characters involved: ${characterNames}
- Keep scene length 150-250 words (or 250-350 if this is a true ending scene)
- Provide 2-3 meaningful choices unless ending
- Make each line behave with motive and social consequence
- Use one concrete callback from recent prose
- Avoid opening on any beat listed in RECENT BEAT MEMORY unless a state jump justifies escalation
- Include "${updateField}" (or "storyThreadUpdates" for legacy) with only changed fields. AVAILABLE FIELDS:
    ${mechanicsInstructions}
- Preserve continuity facts and thread logic${endingGuidance}

Respond with valid JSON only.`;
}

/**
 * Template for the opening scene
 * @param {StoryConfig} storyConfig
 * @returns {string}
 */
export function getOpeningPrompt(storyConfig: StoryConfig): string {
    return `## OPENING SCENE

Generate the opening scene for the story "${storyConfig.title}".

Premise: ${storyConfig.premise}

${storyConfig.openingPrompt}

Respond with valid JSON only.`;
}

/**
 * Error recovery prompt when AI generates invalid JSON
 * @param {string} invalidOutput - What the AI generated
 * @returns {string}
 */
export function getRecoveryPrompt(invalidOutput: string): string {
    return `Your previous response was not valid JSON. 

Previous output:
${invalidOutput.substring(0, 500)}...

Please respond ONLY with valid JSON in this exact format:
{
  "sceneText": "string",
  "choices": [{"id": "string", "text": "string"}],
  "lessonId": number or null,
  "imageKey": "string",
  "imagePrompt": "string (visual description if needed)",
  "isEnding": boolean,
  "endingType": "string or null",
  "mood": "string",
  "storyThreadUpdates": object (optional; include only changed fields),
  "mechanicUpdates": object (optional)
}`;
}

/**
 * Image keys that the AI can reference
 */
export const VALID_IMAGE_KEYS: string[] = Object.values(ImageKeys);

/**
 * Validate and fix the AI's image key choice
 * @param {string} imageKey
 * @returns {string}
 */
export function validateImageKey(imageKey: string): string {
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
export function suggestEndingFromHistory(history: Array<{ choiceId: string }>): string {
    const choices = history.map((h) => h.choiceId.toLowerCase());

    const tokenizeChoiceId = (id: string) => id.split(/[^a-z]+/).filter(Boolean);

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
