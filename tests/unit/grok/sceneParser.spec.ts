import { expect, test } from '@playwright/test';
import { AiProviderError } from '../../../src/lib/server/ai/provider.interface';
import { extractJsonObject, parseSceneWithRecovery } from '../../../src/lib/server/ai/providers/grok/sceneParser';

const baseScene = '{"sceneText":"test","choices":[{"id":"a","text":"A"}],"lessonId":null,"imageKey":"hotel_room","isEnding":false,"endingType":null}';

test.describe('sceneParser', () => {
	test('extracts fenced JSON payload', () => {
		const wrapped = `before\n\n\`\`\`json\n${baseScene}\n\`\`\`\n\nafter`;
		expect(extractJsonObject(wrapped)).toBe(baseScene);
	});

	test('extracts object with malformed prefix/suffix text', () => {
		const wrapped = `Result (draft):: ${baseScene} -- end.`;
		expect(extractJsonObject(wrapped)).toBe(baseScene);
	});

	test('handles nested braces in scene text', () => {
		const nested = '{"sceneText":"Sydney whispers {keep it together} and keeps moving.","choices":[{"id":"a","text":"A"}],"lessonId":null,"imageKey":"hotel_room","isEnding":false,"endingType":null}';
		expect(extractJsonObject(nested)).toBe(nested);
	});

	test('recovery parse remains bounded to second attempt', async () => {
		let calls = 0;
		await expect(
			parseSceneWithRecovery({
				firstResponseText: 'not-json',
				getRecoveryText: async () => {
					calls += 1;
					return 'still-not-json';
				}
			})
		).rejects.toMatchObject({
			name: AiProviderError.name,
			code: 'invalid_response',
			retryable: false
		});
		expect(calls).toBe(1);
	});
});
