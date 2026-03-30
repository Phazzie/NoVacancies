import { ImageKeys, type NarrativeContext } from '$lib/contracts';
import { getActiveStoryCartridge, selectStoryPrompts } from '$lib/stories';

export {
    NARRATIVE_CONTEXT_CHAR_BUDGET,
    buildNarrativeContext,
    detectThreadTransitions,
    translateBoundaries,
    translateLessonHistory,
    translateThreadStateNarrative
} from '$lib/game/narrativeContext';
export {
    formatLessonsForPrompt,
    formatNarrativeContextSection
} from '$lib/narrative/promptFormatting';

export const VALID_IMAGE_KEYS: string[] = Object.values(ImageKeys);
export const SYSTEM_PROMPT = selectStoryPrompts(getActiveStoryCartridge()).systemPrompt;

export function getOpeningPrompt(): string {
    return selectStoryPrompts(getActiveStoryCartridge()).getOpeningPrompt();
}

export function getContinuePromptFromContext(
    narrativeContext: NarrativeContext,
    suggestedEnding: string | null = null
): string {
    return selectStoryPrompts(getActiveStoryCartridge()).getContinuePromptFromContext(
        narrativeContext,
        suggestedEnding
    );
}

export function getRecoveryPrompt(invalidOutput: string): string {
    return selectStoryPrompts(getActiveStoryCartridge()).getRecoveryPrompt(invalidOutput);
}

export function validateImageKey(imageKey: string): string {
    if (VALID_IMAGE_KEYS.includes(imageKey)) {
        return imageKey;
    }
    return ImageKeys.HOTEL_ROOM;
}
