import type { Choice, Scene, StoryThreads } from '../game';

const ALLOWED_MOODS = new Set(['neutral', 'tense', 'hopeful', 'dark', 'triumphant']);

const STORY_THREAD_FIELD_VALIDATORS: Record<keyof StoryThreads, (value: unknown) => boolean> = {
    oswaldoConflict: (value) => typeof value === 'number',
    trinaTension: (value) => typeof value === 'number',
    moneyResolved: (value) => typeof value === 'boolean',
    carMentioned: (value) => typeof value === 'boolean',
    sydneyRealization: (value) => typeof value === 'number',
    boundariesSet: (value) =>
        Array.isArray(value) && value.every((item) => typeof item === 'string'),
    oswaldoAwareness: (value) => typeof value === 'number',
    exhaustionLevel: (value) => typeof value === 'number',
    dexTriangulation: (value) => typeof value === 'number'
};

export class SceneContractError extends Error {
    readonly code = 'scene_contract_violation' as const;
    readonly path: string;
    readonly expected: string;
    readonly received: unknown;

    constructor(path: string, expected: string, received: unknown, context = 'scene') {
        super(`${context} contract violation at "${path}": expected ${expected}`);
        this.name = 'SceneContractError';
        this.path = path;
        this.expected = expected;
        this.received = received;
    }
}

function createViolation(
    path: string,
    expected: string,
    received: unknown,
    context?: string
): never {
    throw new SceneContractError(path, expected, received, context);
}

function isObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseChoice(candidate: unknown, index: number, context: string): Choice {
    if (!isObject(candidate)) {
        createViolation(`choices[${index}]`, 'object', candidate, context);
    }

    const id = candidate.id;
    if (typeof id !== 'string' || id.length === 0) {
        createViolation(`choices[${index}].id`, 'non-empty string', id, context);
    }

    const text = candidate.text;
    if (typeof text !== 'string' || text.length === 0) {
        createViolation(`choices[${index}].text`, 'non-empty string', text, context);
    }

    const outcome = candidate.outcome;
    if (typeof outcome !== 'undefined' && typeof outcome !== 'string') {
        createViolation(`choices[${index}].outcome`, 'string | undefined', outcome, context);
    }

    const nextSceneId = candidate.nextSceneId;
    if (typeof nextSceneId !== 'undefined' && typeof nextSceneId !== 'string') {
        createViolation(
            `choices[${index}].nextSceneId`,
            'string | undefined',
            nextSceneId,
            context
        );
    }

    return {
        id,
        text,
        outcome,
        nextSceneId
    };
}

function parseStoryThreadUpdates(
    candidate: unknown,
    context: string
): Partial<StoryThreads> | null {
    if (typeof candidate === 'undefined' || candidate === null) {
        return null;
    }
    if (!isObject(candidate)) {
        createViolation('storyThreadUpdates', 'object | null', candidate, context);
    }

    for (const [key, value] of Object.entries(candidate)) {
        if (!(key in STORY_THREAD_FIELD_VALIDATORS)) {
            createViolation(
                `storyThreadUpdates.${key}`,
                'known StoryThreads field',
                value,
                context
            );
        }
        if (typeof value === 'undefined') continue;

        const typedKey = key as keyof StoryThreads;
        if (!STORY_THREAD_FIELD_VALIDATORS[typedKey](value)) {
            const expected =
                typedKey === 'boundariesSet'
                    ? 'string[]'
                    : typedKey === 'moneyResolved' || typedKey === 'carMentioned'
                      ? 'boolean'
                      : 'number';
            createViolation(`storyThreadUpdates.${key}`, expected, value, context);
        }
    }

    return candidate as Partial<StoryThreads>;
}

export function parseScene(candidate: unknown, context = 'scene'): Scene {
    if (!isObject(candidate)) {
        createViolation('scene', 'object', candidate, context);
    }

    const sceneId = candidate.sceneId;
    if (typeof sceneId !== 'string' || sceneId.length === 0) {
        createViolation('sceneId', 'non-empty string', sceneId, context);
    }

    const sceneText = candidate.sceneText;
    if (typeof sceneText !== 'string' || sceneText.length === 0) {
        createViolation('sceneText', 'non-empty string', sceneText, context);
    }

    const rawChoices = candidate.choices;
    if (!Array.isArray(rawChoices)) {
        createViolation('choices', 'array', rawChoices, context);
    }
    const choices = rawChoices.map((choice, index) => parseChoice(choice, index, context));

    const lessonId = candidate.lessonId;
    if (lessonId !== null && typeof lessonId !== 'number') {
        createViolation('lessonId', 'number | null', lessonId, context);
    }

    const imageKey = candidate.imageKey;
    if (typeof imageKey !== 'string' || imageKey.length === 0) {
        createViolation('imageKey', 'non-empty string', imageKey, context);
    }

    const imagePrompt = candidate.imagePrompt;
    if (typeof imagePrompt !== 'undefined' && typeof imagePrompt !== 'string') {
        createViolation('imagePrompt', 'string | undefined', imagePrompt, context);
    }

    const isEnding = candidate.isEnding;
    if (typeof isEnding !== 'boolean') {
        createViolation('isEnding', 'boolean', isEnding, context);
    }

    const endingType = candidate.endingType;
    if (isEnding) {
        if (typeof endingType !== 'string' || endingType.trim().length === 0) {
            createViolation(
                'endingType',
                'non-empty string when isEnding=true',
                endingType,
                context
            );
        }
    } else if (endingType !== null) {
        createViolation('endingType', 'null when isEnding=false', endingType, context);
    }

    const moodCandidate = candidate.mood;
    if (typeof moodCandidate !== 'undefined') {
        if (typeof moodCandidate !== 'string' || !ALLOWED_MOODS.has(moodCandidate)) {
            createViolation(
                'mood',
                'neutral | tense | hopeful | dark | triumphant',
                moodCandidate,
                context
            );
        }
    }
    const mood = moodCandidate as Scene['mood'];

    const storyThreadUpdates = parseStoryThreadUpdates(candidate.storyThreadUpdates, context);

    return {
        sceneId,
        sceneText,
        choices,
        lessonId,
        imageKey,
        imagePrompt,
        isEnding,
        endingType,
        mood,
        storyThreadUpdates
    };
}

export function isScene(candidate: unknown): candidate is Scene {
    try {
        parseScene(candidate);
        return true;
    } catch {
        return false;
    }
}
