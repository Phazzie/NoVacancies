import { getLessonById, lessons, type Lesson } from '$lib/narrative/lessonsCatalog';

export { getLessonById, lessons, type Lesson };

/**
 * Get a random trigger from a lesson
 */
export function getRandomTrigger(lessonId: number): string | null {
	const lesson = getLessonById(lessonId);
	if (!lesson || !lesson.storyTriggers.length) return null;
	return lesson.storyTriggers[Math.floor(Math.random() * lesson.storyTriggers.length)];
}

/**
 * Check if a lesson matches a scene based on keywords.
 */
export function detectLessonInScene(sceneText: string): number | null {
	const text = sceneText.toLowerCase();

	if (text.includes('keep score') || text.includes('keeping score')) return 9;
	if (text.includes('what did you do today')) return 2;
	if (text.includes('energy around here')) return 4;
	if (text.includes('i see what would break')) return 10;
	if (text.includes("you'll figure it out") || text.includes('you always figure')) return 8;
	if (text.includes("this isn't hard") || text.includes('not that hard')) return 7;
	if (text.includes('controlling')) return 3;
	if (text.includes('borrow') && text.includes('money')) return 11;
	if (text.includes('what am i to you')) return 17;
	if (text.includes('risk') && text.includes('reduce')) return 16;
	if (text.includes("won't") && text.includes("can't")) return 13;
	if (text.includes('let it fail') || text.includes('let things break')) return 12;

	return null;
}
