import { validateEndingType, validateScene, type Scene, type StoryThreads } from '$lib/contracts';
import { AiProviderError } from '$lib/server/ai/provider.interface';
import type { SceneCandidate } from '$lib/server/ai/providers/grok/sceneParser';

const VALID_MOODS: Scene['mood'][] = ['neutral', 'tense', 'hopeful', 'dark', 'triumphant'];

function normalizeChoiceId(text: string, index: number): string {
	const normalized = text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, 64);
	return normalized || `choice_${index + 1}`;
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
		mood: typeof candidate.mood === 'string' && VALID_MOODS.includes(candidate.mood as Scene['mood'])
			? (candidate.mood as Scene['mood'])
			: undefined,
		storyThreadUpdates:
			candidate.storyThreadUpdates && typeof candidate.storyThreadUpdates === 'object'
				? (candidate.storyThreadUpdates as Partial<StoryThreads>)
				: null
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
