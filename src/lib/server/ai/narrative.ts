import { ImageKeys, type NarrativeContext } from '$lib/contracts';
import { selectStoryPrompts } from '$lib/stories/selectors';
import type { StoryPromptDefinition } from '$lib/stories/types';

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

let storyPrompts: StoryPromptDefinition | null = null;
try {
	storyPrompts = selectStoryPrompts();
} catch {
	// Keep narrative facade import-safe when PUBLIC_STORY_ID is invalid; per-request calls will throw.
	storyPrompts = null;
}

export const SYSTEM_PROMPT = storyPrompts?.systemPrompt ?? '';
function getStoryPrompts(): StoryPromptDefinition {
	if (storyPrompts) return storyPrompts;
	const resolved = selectStoryPrompts();
	storyPrompts = resolved;
	return resolved;
}

export function getOpeningPrompt(): string {
	return getStoryPrompts().getOpeningPrompt();
}

export function getContinuePromptFromContext(
	narrativeContext: NarrativeContext,
	suggestedEnding: string | null = null
): string {
	return getStoryPrompts().getContinuePromptFromContext(narrativeContext, suggestedEnding);
}

export function getRecoveryPrompt(invalidOutput: string): string {
	return getStoryPrompts().getRecoveryPrompt(invalidOutput);
}

export function validateImageKey(imageKey: string): string {
	if (VALID_IMAGE_KEYS.includes(imageKey)) {
		return imageKey;
	}
	return ImageKeys.HOTEL_ROOM;
}
