import { expect, test } from '@playwright/test';
import { extractJsonObject } from '../../../src/lib/server/ai/json/extractJsonObject';

const edgeCaseFixtures = {
	plainObject: '{"sceneText":"ok","choices":[]}',
	proseWrapped: 'Intro line\n{"sceneText":"wrapped","choices":[]}\ntrailer',
	fencedJson: '```json\n{"sceneText":"fenced","choices":[]}\n```',
	multipleFencedBlocks: [
		'```json\n{"invalid":\n```',
		'```json\n{"sceneText":"first-valid","choices":[]}\n```',
		'```json\n{"sceneText":"second-valid","choices":[]}\n```'
	].join('\n\n'),
	escapedBraceInString:
		'prefix {"sceneText":"brace in string: } still text","choices":[{"id":"a","text":"Go"}] } suffix',
	arrayOnly: '["not","object"]',
	empty: '   '
};

test.describe('extractJsonObject', () => {
	test('extracts a parseable object from common wrappers in strict mode', () => {
		expect(extractJsonObject(edgeCaseFixtures.plainObject)).toBe(edgeCaseFixtures.plainObject);
		expect(extractJsonObject(edgeCaseFixtures.proseWrapped)).toContain('"sceneText":"wrapped"');
		expect(extractJsonObject(edgeCaseFixtures.fencedJson)).toContain('"sceneText":"fenced"');
	});

	test('strict mode skips invalid candidates and returns first parseable object', () => {
		const result = extractJsonObject(edgeCaseFixtures.multipleFencedBlocks, { strict: true });
		expect(result).toContain('"sceneText":"first-valid"');
		expect(result).not.toContain('"sceneText":"second-valid"');
	});

	test('strict mode respects quoted braces when scanning object boundaries', () => {
		const result = extractJsonObject(edgeCaseFixtures.escapedBraceInString);
		const parsed = JSON.parse(result) as { sceneText: string };
		expect(parsed.sceneText).toContain('brace in string: } still text');
	});

	test('strict mode rejects non-object JSON payloads', () => {
		expect(() => extractJsonObject(edgeCaseFixtures.arrayOnly)).toThrow(
			'No parseable JSON object found in response'
		);
	});

	test('lenient mode returns first candidate even when candidate is not valid JSON', () => {
		const result = extractJsonObject(edgeCaseFixtures.multipleFencedBlocks, { strict: false });
		expect(result).toContain('{"invalid":');
	});

	test('supports custom error messages for empty and not-found responses', () => {
		expect(() =>
			extractJsonObject(edgeCaseFixtures.empty, {
				emptyErrorMessage: 'custom empty'
			})
		).toThrow('custom empty');

		expect(() =>
			extractJsonObject('no object here', {
				notFoundErrorMessage: 'custom missing'
			})
		).toThrow('custom missing');
	});
});
