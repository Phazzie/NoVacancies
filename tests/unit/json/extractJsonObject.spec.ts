import { expect, test } from '@playwright/test';
import { extractJsonObject } from '../../../src/lib/server/ai/json/extractJsonObject';

const sceneObject = {
	sceneText: 'Sydney counts nineteen dollars against a bill that reads twenty-two.',
	choices: [{ id: 'wait', text: 'Wait', outcome: 'The hallway goes quiet.' }]
};

const sceneJson = JSON.stringify(sceneObject, null, 2);

const strictSuccessFixtures: Array<{ name: string; input: string; expected: Record<string, unknown> }> = [
	{
		name: 'parses plain JSON object',
		input: sceneJson,
		expected: sceneObject
	},
	{
		name: 'parses fenced JSON object with wrapper text',
		input: `Result:\n\n\`\`\`json\n${sceneJson}\n\`\`\``,
		expected: sceneObject
	},
	{
		name: 'parses balanced object when prose wraps response',
		input: `Here is the best draft.\n${sceneJson}\nShip it.`,
		expected: sceneObject
	},
	{
		name: 'skips invalid fenced object and returns first parseable object candidate',
		input: `\`\`\`json\n{"sceneText": "broken\"quote"}\n\`\`\`\n\n\`\`\`json\n${sceneJson}\n\`\`\``,
		expected: sceneObject
	}
];

test.describe('extractJsonObject strict mode', () => {
	for (const fixture of strictSuccessFixtures) {
		test(fixture.name, () => {
			const extracted = extractJsonObject(fixture.input);
			expect(JSON.parse(extracted)).toEqual(fixture.expected);
		});
	}

	test('throws when only non-object JSON is present', () => {
		expect(() => extractJsonObject('Prefix [1,2,3] suffix')).toThrow(
			'No parseable JSON object found in response'
		);
	});

	test('throws custom error when response is empty', () => {
		expect(() => extractJsonObject('   ', { emptyErrorMessage: 'Empty builder response' })).toThrow(
			'Empty builder response'
		);
	});
});

test.describe('extractJsonObject lenient mode', () => {
	test('returns first candidate even when not parseable JSON', () => {
		const extracted = extractJsonObject('```json\n{"sceneText": "bad "quote""}\n```', {
			strictness: 'lenient'
		});
		expect(extracted).toContain('bad "quote"');
	});

	test('throws custom not-found message when no object candidates exist', () => {
		expect(() =>
			extractJsonObject('No braces here', {
				strictness: 'lenient',
				notFoundErrorMessage: 'No JSON object found in builder response'
			})
		).toThrow('No JSON object found in builder response');
	});
});
