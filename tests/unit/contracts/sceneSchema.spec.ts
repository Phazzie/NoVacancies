import { expect, test } from '@playwright/test';
import { isScene, parseScene, SceneContractError, type Scene } from '../../../src/lib/contracts';

const validScene: Scene = {
    sceneId: 'opening',
    sceneText: 'Sydney checks the clock and replays every option.',
    choices: [
        { id: 'check_phone', text: 'Check the phone' },
        { id: 'scan_room', text: 'Scan the room for leverage', outcome: 'She exhales once.' }
    ],
    lessonId: null,
    imageKey: 'hotel_room',
    isEnding: false,
    endingType: null,
    storyThreadUpdates: null
};

test.describe('scene schema contract parser', () => {
    test('parseScene returns typed scene for valid payload', () => {
        const parsed = parseScene(validScene, 'unit-test');
        expect(parsed.sceneId).toBe('opening');
        expect(parsed.choices).toHaveLength(2);
    });

    test('isScene returns true for valid scene payload', () => {
        expect(isScene(validScene)).toBe(true);
    });

    test('invalid payload matrix throws SceneContractError with clear path + expectation', () => {
        const cases: Array<{
            name: string;
            payload: unknown;
            expectedPath: string;
            expected: string;
        }> = [
            {
                name: 'non-object payload',
                payload: null,
                expectedPath: 'scene',
                expected: 'object'
            },
            {
                name: 'missing sceneId',
                payload: { ...validScene, sceneId: '' },
                expectedPath: 'sceneId',
                expected: 'non-empty string'
            },
            {
                name: 'choices not array',
                payload: { ...validScene, choices: 'bad' },
                expectedPath: 'choices',
                expected: 'array'
            },
            {
                name: 'choice text missing',
                payload: {
                    ...validScene,
                    choices: [{ id: 'only_id' }]
                },
                expectedPath: 'choices[0].text',
                expected: 'non-empty string'
            },
            {
                name: 'ending type required when ending',
                payload: { ...validScene, isEnding: true, endingType: null },
                expectedPath: 'endingType',
                expected: 'non-empty string when isEnding=true'
            },
            {
                name: 'unknown thread update key',
                payload: {
                    ...validScene,
                    storyThreadUpdates: { rogueField: 1 }
                },
                expectedPath: 'storyThreadUpdates.rogueField',
                expected: 'known StoryThreads field'
            }
        ];

        for (const testCase of cases) {
            try {
                parseScene(testCase.payload, 'matrix');
                expect.fail(`Expected case to throw: ${testCase.name}`);
            } catch (error) {
                expect(error).toBeInstanceOf(SceneContractError);
                if (!(error instanceof SceneContractError)) {
                    continue;
                }
                expect(error.path, testCase.name).toBe(testCase.expectedPath);
                expect(error.expected, testCase.name).toBe(testCase.expected);
                expect(error.message).toContain('matrix contract violation');
            }
        }
    });

    test('isScene returns false when contract is violated', () => {
        expect(isScene({ ...validScene, endingType: 'loop' })).toBe(false);
    });
});
