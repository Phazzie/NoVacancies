import type { Scene } from '$lib/contracts';

export interface StorySanityResult {
	ok: boolean;
	issues: string[];
	blockingIssues: string[];
	retryableIssues: string[];
}

function normalizeChoiceText(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function evaluateStorySanity(scene: Scene): StorySanityResult {
	const blockingIssues: string[] = [];
	const retryableIssues: string[] = [];
	const text = (scene.sceneText || '').trim();
	const words = text.split(/\s+/).filter(Boolean);
	const wordCount = words.length;

	if (text.length < 80) {
		blockingIssues.push('scene_text_too_short');
	}

	if (!scene.isEnding && scene.choices.length < 2) {
		blockingIssues.push('insufficient_choices');
	}

	if (scene.choices.length > 3) {
		blockingIssues.push('too_many_choices');
	}

	const normalizedChoices = scene.choices.map((choice) => normalizeChoiceText(choice.text));
	for (let i = 0; i < normalizedChoices.length; i += 1) {
		for (let j = i + 1; j < normalizedChoices.length; j += 1) {
			if (normalizedChoices[i] && normalizedChoices[i] === normalizedChoices[j]) {
				blockingIssues.push('duplicate_choice_phrasing');
			}
		}
	}

	if (scene.isEnding) {
		if (wordCount > 450) {
			blockingIssues.push('ending_scene_word_count_hard_limit');
		} else if (wordCount > 370) {
			retryableIssues.push('ending_scene_word_count_soft_limit');
		}
	} else if (wordCount > 350) {
		blockingIssues.push('scene_word_count_hard_limit');
	} else if (wordCount > 280) {
		retryableIssues.push('scene_word_count_soft_limit');
	}

	const issues = [...blockingIssues, ...retryableIssues];
	return {
		ok: issues.length === 0,
		issues,
		blockingIssues,
		retryableIssues
	};
}
