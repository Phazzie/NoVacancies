import type { Scene } from '$lib/contracts';

export interface StorySanityResult {
	ok: boolean;
	issues: string[];
}

function normalizeChoiceText(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function evaluateStorySanity(scene: Scene): StorySanityResult {
	const issues: string[] = [];
	const text = (scene.sceneText || '').trim();

	if (text.length < 80) {
		issues.push('scene_text_too_short');
	}

	if (!scene.isEnding && scene.choices.length < 2) {
		issues.push('insufficient_choices');
	}

	if (scene.choices.length > 3) {
		issues.push('too_many_choices');
	}

	const normalizedChoices = scene.choices.map((choice) => normalizeChoiceText(choice.text));
	for (let i = 0; i < normalizedChoices.length; i += 1) {
		for (let j = i + 1; j < normalizedChoices.length; j += 1) {
			if (normalizedChoices[i] && normalizedChoices[i] === normalizedChoices[j]) {
				issues.push('duplicate_choice_phrasing');
			}
		}
	}

	const apologyMentions = (text.match(/\b(sorry|apologize|apology)\b/gi) || []).length;
	if (apologyMentions >= 3) {
		issues.push('apology_loop_pattern');
	}

	return {
		ok: issues.length === 0,
		issues
	};
}

