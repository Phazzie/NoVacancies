import { noVacanciesCartridge } from '$lib/stories/no-vacancies';
import { starterKitCartridge } from '$lib/stories/starter-kit';
import type { StoryDefinition } from '$lib/stories/types';

const cartridges: Record<string, StoryDefinition> = {
	[noVacanciesCartridge.id]: noVacanciesCartridge,
	[starterKitCartridge.id]: starterKitCartridge
};

const DEFAULT_CARTRIDGE_ID = noVacanciesCartridge.id;

function getConfiguredStoryId(): string {
	const configured =
		(globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
			?.PUBLIC_STORY_ID ??
		(import.meta as { env?: Record<string, string | undefined> }).env?.PUBLIC_STORY_ID;
	if (typeof configured !== 'string' || configured.trim().length === 0) {
		return DEFAULT_CARTRIDGE_ID;
	}
	return configured.trim().toLowerCase();
}

export function listStoryCartridges(): StoryDefinition[] {
	return Object.values(cartridges);
}

export function getStoryCartridge(storyId: string): StoryDefinition | null {
	const normalized = typeof storyId === 'string' ? storyId.trim().toLowerCase() : '';
	if (!normalized) return null;
	return cartridges[normalized] ?? null;
}

export function getActiveStoryCartridge(): StoryDefinition {
	const configuredId = getConfiguredStoryId();
	const cartridge = getStoryCartridge(configuredId);
	if (!cartridge) {
		// Defaulting for "unset" is safe; defaulting for "unknown" hides the wrong story at runtime.
		throw new Error(
			`Unknown story cartridge id "${configuredId}". Available cartridges: ${listStoryCartridges()
				.map((candidate) => candidate.id)
				.join(', ')}`
		);
	}
	return cartridge;
}

export function getSafeActiveStoryCartridge(): StoryDefinition | null {
	const configuredId = getConfiguredStoryId();
	return getStoryCartridge(configuredId);
}

export function getStoryDefinition(storyId: string): StoryDefinition | null {
	return getStoryCartridge(storyId);
}

export function getActiveStoryDefinition(): StoryDefinition {
	return getActiveStoryCartridge();
}

export { noVacanciesCartridge, starterKitCartridge };
export type { StoryCartridge, StoryDefinition } from '$lib/stories/types';
