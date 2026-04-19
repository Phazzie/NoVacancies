import { expect, test } from '@playwright/test';
import {
    lessons,
    getLessonById,
    getRandomTrigger,
    detectLessonInScene
} from '../../src/lib/narrative/lessonsCatalog';

// ---------- Catalog completeness ----------

test.describe('lessons catalog — completeness', () => {
    test('contains exactly 17 lessons', () => {
        expect(lessons.length).toBe(17);
    });

    test('every lesson has a non-empty storyTriggers array', () => {
        for (const lesson of lessons) {
            expect(lesson.storyTriggers.length).toBeGreaterThan(0);
        }
    });

    test('lesson IDs are unique and sequential from 1 to 17', () => {
        const ids = lessons.map((l) => l.id).sort((a, b) => a - b);
        for (let i = 0; i < ids.length; i += 1) {
            expect(ids[i]).toBe(i + 1);
        }
    });

    test('every lesson has non-empty title, quote, insight, and unconventionalAngle', () => {
        for (const lesson of lessons) {
            expect(lesson.title.length).toBeGreaterThan(0);
            expect(lesson.quote.length).toBeGreaterThan(0);
            expect(lesson.insight.length).toBeGreaterThan(0);
            expect(lesson.unconventionalAngle.length).toBeGreaterThan(0);
        }
    });
});

// ---------- getLessonById ----------

test.describe('getLessonById', () => {
    test('returns the correct lesson for ID 1', () => {
        const lesson = getLessonById(1);
        expect(lesson).not.toBeUndefined();
        expect(lesson?.id).toBe(1);
        expect(lesson?.title).toBe('Load-Bearing Beams Get Leaned On');
    });

    test('returns the correct lesson for ID 9', () => {
        const lesson = getLessonById(9);
        expect(lesson).not.toBeUndefined();
        expect(lesson?.id).toBe(9);
        expect(lesson?.title).toBe('Discomfort Becomes Attacks');
    });

    test('returns the correct lesson for ID 17 (last lesson)', () => {
        const lesson = getLessonById(17);
        expect(lesson).not.toBeUndefined();
        expect(lesson?.id).toBe(17);
        expect(lesson?.title).toBe('What Am I to You?');
    });

    test('returns undefined for ID 0', () => {
        expect(getLessonById(0)).toBeUndefined();
    });

    test('returns undefined for ID 999', () => {
        expect(getLessonById(999)).toBeUndefined();
    });

    test('returns undefined for a negative ID', () => {
        expect(getLessonById(-1)).toBeUndefined();
    });
});

// ---------- getRandomTrigger ----------

test.describe('getRandomTrigger', () => {
    test('returns a string for a known lesson with triggers', () => {
        const trigger = getRandomTrigger(1);
        expect(typeof trigger).toBe('string');
        expect((trigger as string).length).toBeGreaterThan(0);
    });

    test('returned trigger is a member of the lesson storyTriggers array', () => {
        const lesson = getLessonById(5)!;
        // Call enough times to get a representative sample
        for (let i = 0; i < 20; i += 1) {
            const trigger = getRandomTrigger(5);
            expect(lesson.storyTriggers).toContain(trigger);
        }
    });

    test('returns null for an unknown lesson ID (999)', () => {
        expect(getRandomTrigger(999)).toBeNull();
    });

    test('returns null for ID 0', () => {
        expect(getRandomTrigger(0)).toBeNull();
    });
});

// ---------- detectLessonInScene ----------

test.describe('detectLessonInScene — keyword matching', () => {
    test('detects lesson 9 when text contains "keep score"', () => {
        expect(detectLessonInScene('She used to keep score quietly in her head.')).toBe(9);
    });

    test('detects lesson 9 with variant "keeping score"', () => {
        expect(detectLessonInScene('Stop keeping score, she told herself.')).toBe(9);
    });

    test('detects lesson 2 when text contains "what did you do today"', () => {
        expect(detectLessonInScene('He asked, what did you do today, at 2pm.')).toBe(2);
    });

    test('detects lesson 4 when text contains "energy around here"', () => {
        expect(detectLessonInScene("You supply all the energy around here.")).toBe(4);
    });

    test('detects lesson 17 when text contains "what am i to you"', () => {
        expect(detectLessonInScene('She thought: what am i to you, really.')).toBe(17);
    });

    test('detects lesson 11 when text contains both "borrow" and "money"', () => {
        expect(detectLessonInScene('He tried to borrow money again.')).toBe(11);
    });

    test('does NOT detect lesson 11 when only "borrow" is present without "money"', () => {
        const result = detectLessonInScene('He tried to borrow her patience.');
        // Should not match lesson 11 — both keywords required
        expect(result).not.toBe(11);
    });

    test('returns null for neutral text with no keyword matches', () => {
        const neutral = 'The ice machine hums. She pours coffee. Nothing happens yet.';
        expect(detectLessonInScene(neutral)).toBeNull();
    });

    test('returns null for an empty string', () => {
        expect(detectLessonInScene('')).toBeNull();
    });

    test('matching is case-insensitive (uppercase text)', () => {
        expect(detectLessonInScene("SHE DOESN'T KEEP SCORE ANYMORE.")).toBe(9);
    });
});
