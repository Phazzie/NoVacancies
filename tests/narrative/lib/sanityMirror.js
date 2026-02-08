/**
 * Node-compatible mirror of src/lib/server/ai/sanity.ts:evaluateStorySanity
 *
 * This is a standalone copy for test use. The drift guard in the main test
 * file verifies this stays in sync with the canonical source via hash comparison.
 */

function normalizeChoiceText(value) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function evaluateStorySanity(scene) {
	const blockingIssues = [];
	const retryableIssues = [];
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

	const apologyMentions = (text.match(/\b(sorry|apologize|apology)\b/gi) || []).length;
	if (apologyMentions >= 3) {
		blockingIssues.push('apology_loop_pattern');
	}

	const bannedPatterns = [
		{ id: 'banned_phrase_lesson_is', regex: /\bthe lesson is\b/i },
		{ id: 'banned_phrase_teaches_us', regex: /\bwhat this teaches us is\b/i },
		{ id: 'banned_phrase_in_the_end_realized', regex: /\bin the end,\s*sydney realized\b/i },
		{ id: 'banned_phrase_everything_happens_for_reason', regex: /\beverything happens for a reason\b/i }
	];
	for (const pattern of bannedPatterns) {
		if (pattern.regex.test(text)) {
			blockingIssues.push(pattern.id);
		}
	}

	const therapySpeakMarkers = [
		/\bhold space\b/i,
		/\btrauma response\b/i,
		/\bemotional bandwidth\b/i,
		/\bnervous system\b/i
	];
	if (therapySpeakMarkers.some((regex) => regex.test(text))) {
		blockingIssues.push('therapy_speak_summary');
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
