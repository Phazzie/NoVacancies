import { expect, test } from '@playwright/test';
import { isScene, parseScene, SceneContractError } from '../../../src/lib/contracts';

const validScene = {
	sceneId: 'opening',
	sceneText: 'Sydney studies the room and does the math again.',
	choices: [
		{ id: 'scan_room', text: 'Scan the room' },
		{ id: 'check_phone', text: 'Check her phone', outcome: 'She sees a new alert.' }
	],
	lessonId: null,
	imageKey: 'hotel_room',
	isEnding: false,
	endingType: null,
	storyThreadUpdates: null
};

test.describe('scene schema parser', () => {
	test('parses valid payload', () => {
		const parsed = parseScene(validScene);
		expect(parsed.sceneId).toBe('opening');
		expect(parsed.choices).toHaveLength(2);
	});

	test('invalid payload matrix throws SceneContractError with field and code', () => {
		const cases: Array<{
			name: string;
			payload: unknown;
			expectedField: string;
			expectedCode: SceneContractError['code'];
		}> = [
			{
				name: 'payload is not an object',
				payload: null,
				expectedField: 'scene',
				expectedCode: 'invalid_payload'
			},
			{
				name: 'missing sceneId',
				payload: { ...validScene, sceneId: undefined },
				expectedField: 'sceneId',
				expectedCode: 'missing_field'
			},
			{
				name: 'choices is not an array',
				payload: { ...validScene, choices: 'bad' },
				expectedField: 'choices',
				expectedCode: 'invalid_field_type'
			},
			{
				name: 'choice id is empty',
				payload: { ...validScene, choices: [{ id: '', text: 'ok' }] },
				expectedField: 'choices[0].id',
				expectedCode: 'invalid_value'
			},
			{
				name: 'ending missing endingType',
				payload: { ...validScene, isEnding: true, endingType: null },
				expectedField: 'endingType',
				expectedCode: 'missing_field'
			},
			{
				name: 'mood invalid',
				payload: { ...validScene, mood: 'angry' },
				expectedField: 'mood',
				expectedCode: 'invalid_value'
			}
		];

		for (const testCase of cases) {
			try {
				parseScene(testCase.payload);
				throw new Error(`Expected parseScene to throw for case: ${testCase.name}`);
			} catch (error) {
				expect(error).toBeInstanceOf(SceneContractError);
				const contractError = error as SceneContractError;
				expect(contractError.field, testCase.name).toBe(testCase.expectedField);
				expect(contractError.code, testCase.name).toBe(testCase.expectedCode);
			}
		}
	});

	test('isScene returns false for invalid payloads', () => {
		expect(isScene(validScene)).toBe(true);
		expect(isScene({ ...validScene, sceneText: '' })).toBe(false);
		expect(isScene({ ...validScene, choices: [{ id: 'ok' }] })).toBe(false);
	});
});
