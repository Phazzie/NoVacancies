import { expect, test } from '@playwright/test';
import { extractJsonObject, parseSceneCandidate } from '../../../src/lib/server/ai/providers/grok/sceneParser';

test.describe('sceneParser', () => {
	test('extracts fenced JSON', () => {
		const json = '{"sceneText":"ok","choices":[]}';
		const raw = `Here you go\n\n\`\`\`json\n${json}\n\`\`\``;
		expect(extractJsonObject(raw)).toBe(json);
	});

	test('extracts JSON from malformed prefix/suffix wrapper', () => {
		const raw = 'note:::<<< {"sceneText":"hi","choices":[]} >>>:::tail';
		expect(extractJsonObject(raw)).toBe('{"sceneText":"hi","choices":[]}');
	});

	test('handles nested braces inside strings and objects', () => {
		const raw =
			'prelude {"sceneText":"brace text {not an object}","nested":{"deep":{"x":1}},"choices":[]} postlude';
		const parsed = parseSceneCandidate(raw);
		expect(parsed.sceneText).toBe('brace text {not an object}');
		expect(parsed.choices).toEqual([]);
	});

	test('throws on content with no parseable object', () => {
		expect(() => extractJsonObject('not json at all')).toThrow(/No parseable JSON object/);
	});
});
