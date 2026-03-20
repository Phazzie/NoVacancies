import type { NarrativeContext } from '$lib/contracts';
import type { Lesson } from '$lib/narrative/lessonsCatalog';

export function formatLessonsForPrompt(lessons: Lesson[]): string {
	return lessons
		.map((lesson) => {
			const stakes = Array.isArray(lesson.emotionalStakes)
				? lesson.emotionalStakes.slice(0, 2).join(' | ')
				: '';
			const triggers = Array.isArray(lesson.storyTriggers)
				? lesson.storyTriggers.slice(0, 2).join(' | ')
				: '';
			const unconventionalAngle = lesson.unconventionalAngle || '';

			return `${lesson.id}. ${lesson.title}
   Quote: "${lesson.quote}"
   Core Insight: ${lesson.insight}
   Emotional Stakes: ${stakes}
   Common Triggers: ${triggers}
   Unconventional Angle: ${unconventionalAngle}`;
		})
		.join('\n\n');
}

export function formatNarrativeContextSection(context: NarrativeContext): string {
	const recentText =
		context.recentSceneProse.length > 0
			? context.recentSceneProse
					.map((entry, index) => {
						const choiceLine = entry.viaChoiceText
							? `[Choice: ${entry.viaChoiceText}]`
							: '[Choice: opening]';
						return `### RECENT SCENE ${index + 1}\n${choiceLine}\n${entry.text}`;
					})
					.join('\n\n')
			: 'No recent scene prose available.';

	const olderText =
		context.olderSceneSummaries.length > 0
			? context.olderSceneSummaries.map((line) => `- ${line}`).join('\n')
			: '- None yet.';

	const threadNarrative = context.threadNarrativeLines.map((line) => `- ${line}`).join('\n');
	const boundaryNarrative = context.boundaryNarrativeLines.map((line) => `- ${line}`).join('\n');
	const lessonHistory = context.lessonHistoryLines.map((line) => `- ${line}`).join('\n');
	const recentOpenings =
		context.recentOpenings.length > 0
			? context.recentOpenings.map((line) => `- ${line}`).join('\n')
			: '- none captured';
	const recentChoiceTexts =
		context.recentChoiceTexts.length > 0
			? context.recentChoiceTexts.map((line) => `- ${line}`).join('\n')
			: '- none captured';

	const transitionSection =
		context.transitionBridge?.moments?.length
			? `\n## STATE SHIFT MEMORY\n${context.transitionBridge.moments
					.map(
						(moment) =>
							`- ${moment.key}\n  BEFORE: "${moment.before}"\n  AFTER: "${moment.after}"\n  NOTE: ${moment.bridge}`
					)
					.join('\n')}\nIntegrate one shift naturally if it fits this scene.`
			: '\n## STATE SHIFT MEMORY\nNo bridge-worthy thread jump this turn. Do not force one.';

	return `## NARRATIVE CONTEXT
Scene count: ${context.sceneCount}

## RECENT PROSE (verbatim; match this voice)
${recentText}

## OLDER SCENES (compressed)
${olderText}

## THREAD NARRATIVE READ
${threadNarrative}

## BOUNDARY READ
${boundaryNarrative}

## LESSON HISTORY (already surfaced)
${lessonHistory}

## RECENT OPENING STRATEGIES (avoid repeating these angles)
${recentOpenings}

## RECENT CHOICE TEXTS (for ending trajectory + intent memory)
${recentChoiceTexts}
${transitionSection}

## CONTEXT BUDGET
chars=${context.meta.contextChars}/${context.meta.budgetChars}; truncated=${context.meta.truncated}; droppedOlder=${context.meta.droppedOlderSummaries}; droppedRecent=${context.meta.droppedRecentProse}`;
}
