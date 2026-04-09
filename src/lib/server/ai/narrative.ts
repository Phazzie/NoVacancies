import { ImageKeys, type NarrativeContext } from '$lib/contracts';
import { selectStoryPrompts } from '$lib/stories/selectors';

export const NARRATIVE_CARTRIDGE = {
    id: 'no-vacancies',
    title: 'No Vacancies',
    version: '2026.02.16'
} as const;

export {
	NARRATIVE_CONTEXT_CHAR_BUDGET,
	buildNarrativeContext,
	detectThreadTransitions,
	translateBoundaries,
	translateLessonHistory,
	translateThreadStateNarrative
} from '$lib/game/narrativeContext';
export { formatLessonsForPrompt, formatNarrativeContextSection } from '$lib/narrative/promptFormatting';

export const VALID_IMAGE_KEYS: string[] = Object.values(ImageKeys);
const storyPrompts = selectStoryPrompts();

export const SYSTEM_PROMPT = storyPrompts.systemPrompt;

export function getOpeningPrompt(): string {
	return storyPrompts.getOpeningPrompt();
}

export function getContinuePromptFromContext(
	narrativeContext: NarrativeContext,
	suggestedEnding: string | null = null
): string {
	return storyPrompts.getContinuePromptFromContext(narrativeContext, suggestedEnding);
}

export function getRecoveryPrompt(invalidOutput: string): string {
	return storyPrompts.getRecoveryPrompt(invalidOutput);
}

export function validateImageKey(imageKey: string): string {
	if (VALID_IMAGE_KEYS.includes(imageKey)) {
		return imageKey;
	}
	return ImageKeys.HOTEL_ROOM;
}
