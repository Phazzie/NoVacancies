import { expect, test } from '@playwright/test';
import {
    normalizeDraft,
    normalizeProseFeedback
} from '../../../src/lib/server/ai/builder/normalizers';
import type { BuilderStoryDraft } from '../../../src/lib/stories/types';

// ---------- normalizeLineArray (tested indirectly via normalizeDraft.voiceCeilingLines) ----------

test.describe('normalizeLineArray (via normalizeDraft.voiceCeilingLines)', () => {
    test('filters empty and whitespace-only strings from a valid array', () => {
        const input = {
            title: 'T',
            premise: 'A premise',
            setting: 'A setting',
            aestheticStatement: 'An aesthetic',
            voiceCeilingLines: ['hello', '', ' ', 'world'],
            characters: [],
            mechanics: [],
            openingPrompt: 'p',
            systemPrompt: 's'
        };
        const result = normalizeDraft(input, 'A premise');
        expect(result.voiceCeilingLines).toEqual(['hello', 'world']);
    });

    test('returns fallback array when voiceCeilingLines is not an array', () => {
        const input = { voiceCeilingLines: 42, title: 'T', premise: 'p' };
        const result = normalizeDraft(input, 'p');
        // Fallback draft has non-empty voiceCeilingLines
        expect(Array.isArray(result.voiceCeilingLines)).toBe(true);
        expect(result.voiceCeilingLines.length).toBeGreaterThan(0);
    });
});

// ---------- normalizeDraft ----------

const wellFormedDraft: BuilderStoryDraft = {
    title: 'Test Title',
    premise: 'A woman keeps the lights on.',
    setting: 'A motel room at the end of the month.',
    aestheticStatement: 'Behavioral, not explanatory.',
    voiceCeilingLines: ['She carries the bill without applause.'],
    characters: [
        { name: 'Protagonist', role: 'lead', description: 'The load-bearer.' }
    ],
    mechanics: [
        {
            key: 'pressure',
            label: 'Pressure',
            voiceMap: [{ value: '0', line: 'The pressure is already here.' }]
        }
    ],
    openingPrompt: 'Generate an opening scene.',
    systemPrompt: 'You are writing a grounded narrative.'
};

test.describe('normalizeDraft — valid input', () => {
    test('passes through a well-formed draft with all required fields intact', () => {
        const result = normalizeDraft(wellFormedDraft, 'A woman keeps the lights on.');

        expect(result.title).toBe('Test Title');
        expect(result.premise).toBe('A woman keeps the lights on.');
        expect(result.setting).toBe('A motel room at the end of the month.');
        expect(result.aestheticStatement).toBe('Behavioral, not explanatory.');
        expect(result.voiceCeilingLines).toEqual(['She carries the bill without applause.']);
        expect(result.characters).toHaveLength(1);
        expect(result.mechanics).toHaveLength(1);
        expect(result.openingPrompt).toBe('Generate an opening scene.');
        expect(result.systemPrompt).toBe('You are writing a grounded narrative.');
    });
});

test.describe('normalizeDraft — null / non-object input', () => {
    test('returns a valid fallback draft for null', () => {
        const result = normalizeDraft(null, 'Some premise');

        expect(result.title.length).toBeGreaterThan(0);
        expect(result.premise).toBe('Some premise');
        expect(Array.isArray(result.characters)).toBe(true);
        expect(Array.isArray(result.mechanics)).toBe(true);
        expect(Array.isArray(result.voiceCeilingLines)).toBe(true);
    });

    test('returns a valid fallback draft for undefined', () => {
        const result = normalizeDraft(undefined, 'Some premise');
        expect(result.title.length).toBeGreaterThan(0);
    });

    test('returns a valid fallback draft for a primitive (number)', () => {
        const result = normalizeDraft(42, 'Some premise');
        expect(result.title.length).toBeGreaterThan(0);
    });
});

test.describe('normalizeDraft — partial / malformed input', () => {
    test('fills in missing string fields with fallback defaults', () => {
        const partial = { title: 'Partial Title' };
        const result = normalizeDraft(partial, 'A premise');

        expect(result.title).toBe('Partial Title');
        expect(result.premise).toBe('A premise');
        expect(typeof result.setting).toBe('string');
        expect(result.setting.length).toBeGreaterThan(0);
        expect(typeof result.openingPrompt).toBe('string');
        expect(typeof result.systemPrompt).toBe('string');
    });

    test('replaces characters/mechanics with fallback when they are strings instead of arrays', () => {
        const malformed = { characters: 'not-an-array', mechanics: 'also-not-an-array' };
        const result = normalizeDraft(malformed, 'A premise');

        expect(Array.isArray(result.characters)).toBe(true);
        expect(result.characters.length).toBeGreaterThan(0);
        expect(Array.isArray(result.mechanics)).toBe(true);
        expect(result.mechanics.length).toBeGreaterThan(0);
    });

    test('normalizes character entries with wrong types to safe defaults', () => {
        const input = {
            characters: [
                { name: 42, role: null, description: undefined }
            ]
        };
        const result = normalizeDraft(input, 'p');
        const character = result.characters[0];
        expect(typeof character.name).toBe('string');
        expect(typeof character.role).toBe('string');
        expect(typeof character.description).toBe('string');
    });

    test('normalizes mechanic entries with missing voiceMap to empty array', () => {
        const input = {
            mechanics: [
                { key: 'pressure', label: 'Pressure' } // missing voiceMap
            ]
        };
        const result = normalizeDraft(input, 'p');
        const mechanic = result.mechanics[0];
        expect(mechanic.key).toBe('pressure');
        expect(Array.isArray(mechanic.voiceMap)).toBe(true);
    });
});

// ---------- normalizeProseFeedback ----------

test.describe('normalizeProseFeedback', () => {
    test('passes through a valid score, flags, and suggestion', () => {
        const result = normalizeProseFeedback({
            score: 7,
            flags: ['Good tension.'],
            suggestion: 'Keep the current approach.'
        });

        expect(result.score).toBe(7);
        expect(result.flags).toEqual(['Good tension.']);
        expect(result.suggestion).toBe('Keep the current approach.');
    });

    test('clamps score below 1 up to 1', () => {
        const result = normalizeProseFeedback({ score: 0 });
        expect(result.score).toBe(1);
    });

    test('clamps score above 10 down to 10', () => {
        const result = normalizeProseFeedback({ score: 15 });
        expect(result.score).toBe(10);
    });

    test('replaces non-numeric score with 1', () => {
        const result = normalizeProseFeedback({ score: 'high' as unknown as number });
        expect(result.score).toBe(1);
    });

    test('replaces non-array flags with fallback message', () => {
        const result = normalizeProseFeedback({ flags: 'bad' as unknown as string[] });
        expect(Array.isArray(result.flags)).toBe(true);
        expect(result.flags.length).toBeGreaterThan(0);
    });

    test('replaces non-string suggestion with fallback', () => {
        const result = normalizeProseFeedback({ suggestion: 42 as unknown as string });
        expect(typeof result.suggestion).toBe('string');
        expect(result.suggestion.length).toBeGreaterThan(0);
    });

    test('returns valid defaults for an entirely empty input', () => {
        const result = normalizeProseFeedback({});
        expect(result.score).toBe(1);
        expect(Array.isArray(result.flags)).toBe(true);
        expect(typeof result.suggestion).toBe('string');
    });
});
