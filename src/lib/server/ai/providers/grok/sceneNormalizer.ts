import { Moods, validateEndingType, validateScene, type Scene, type StoryThreads } from '$lib/contracts';
import { AiProviderError } from '$lib/server/ai/provider.interface';
import type { SceneCandidate } from '$lib/server/ai/providers/grok/sceneParser';

function normalizeChoiceId(text: string, index: number): string {
	const normalized = text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, 64);
	return normalized || `choice_${index + 1}`;
}

// Validates and sanitizes a raw AI-supplied storyThreadUpdates object.
// Only known keys with correct value types are preserved; unknown keys and
// type-mismatched values are silently dropped.
function sanitizeStoryThreadUpdates(raw: unknown): Partial<StoryThreads> | null {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
		return null;
	}
	const src = raw as Record<string, unknown>;
	const result: Partial<StoryThreads> = {};

	const numericKeys: Array<keyof StoryThreads> = [
		'oswaldoConflict',
		'trinaTension',
		'sydneyRealization',
		'oswaldoAwareness',
		'exhaustionLevel',
		'dexTriangulation'
	];
	for (const key of numericKeys) {
		const val = src[key];
		if (typeof val === 'number' && Number.isFinite(val)) {
			(result as Record<string, unknown>)[key] = val;
		}
	}

	const booleanKeys: Array<keyof StoryThreads> = ['moneyResolved', 'carMentioned'];
	for (const key of booleanKeys) {
		const val = src[key];
		if (typeof val === 'boolean') {
			(result as Record<string, unknown>)[key] = val;
		}
	}

	if (
		Array.isArray(src.boundariesSet) &&
		(src.boundariesSet as unknown[]).every((el) => typeof el === 'string')
	) {
		result.boundariesSet = src.boundariesSet as string[];
	}

	return Object.keys(result).length > 0 ? result : null;
}

export function normalizeSceneCandidate(candidate: SceneCandidate, fallbackSceneId: string): Scene {
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

	return {
		sceneId: typeof candidate.sceneId === 'string' ? candidate.sceneId || fallbackSceneId : fallbackSceneId,
		sceneText: typeof candidate.sceneText === 'string' ? candidate.sceneText.trim() : '',
		choices,
		lessonId: typeof candidate.lessonId === 'number' ? candidate.lessonId : null,
		imageKey: typeof candidate.imageKey === 'string' ? candidate.imageKey : 'hotel_room',
		imagePrompt: typeof candidate.imagePrompt === 'string' ? candidate.imagePrompt : undefined,
		isEnding,
		endingType,
		mood: typeof candidate.mood === 'string' && (Object.values(Moods) as string[]).includes(candidate.mood)
			? (candidate.mood as Scene['mood'])
			: undefined,
		storyThreadUpdates: sanitizeStoryThreadUpdates(candidate.storyThreadUpdates ?? null)
	};
}

export function normalizeAndValidateScene(candidate: SceneCandidate, fallbackSceneId: string): Scene {
	const normalized = normalizeSceneCandidate(candidate, fallbackSceneId);
	if (!validateScene(normalized)) {
		throw new AiProviderError('xAI scene failed contract validation', {
			code: 'invalid_response',
			retryable: false
		});
	}
	return normalized;
}
