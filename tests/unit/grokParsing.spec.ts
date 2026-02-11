import { expect, test } from '@playwright/test';
import type { AiConfig } from '../../src/lib/server/ai/config';
import { AiProviderError } from '../../src/lib/server/ai/provider.interface';
import { GrokAiProvider } from '../../src/lib/server/ai/providers/grok';

const mockConfig: AiConfig = {
	xaiApiKey: 'test-key',
	grokTextModel: 'grok-test',
	grokImageModel: 'grok-image-test',
	enableGrokImages: false,
	maxRetries: 0,
	retryBackoffMs: [0],
	requestTimeoutMs: 5000,
	maxOutputTokens: 2000
};

const validSceneJson = `{
	"sceneText": "The room feels smaller tonight. The weight of eighteen dollars presses down. The clock does not care about excuses or effort. Just money.",
	"choices": [
		{"id": "look_around", "text": "Look around the room"},
		{"id": "check_phone", "text": "Check phone for messages"}
	],
	"lessonId": null,
	"imageKey": "hotel_room",
	"isEnding": false,
	"endingType": null
}`;

function createProviderWithResponses(responses: string[]) {
	let index = 0;
	const fetchMock = async () => {
		const content = responses[Math.min(index, responses.length - 1)] ?? '';
		index += 1;
		return new Response(JSON.stringify({ choices: [{ message: { content } }] }));
	};
	return {
		provider: new GrokAiProvider(mockConfig, fetchMock as typeof fetch),
		getCallCount: () => index
	};
}

test.describe('GrokAiProvider parse robustness (no synthetic fallback scene)', () => {
	test('parses plain JSON response', async () => {
		const { provider } = createProviderWithResponses([validSceneJson]);
		const scene = await provider.getOpeningScene({
			currentSceneId: null,
			choiceId: null,
			gameState: {} as never
		});
		expect(scene.sceneText).toContain('The room feels smaller tonight');
		expect(scene.choices).toHaveLength(2);
	});

	test('extracts JSON with prose wrapper', async () => {
		const wrapped = `Here is your scene:\n\n${validSceneJson}\n\nGood luck.`;
		const { provider } = createProviderWithResponses([wrapped]);
		const scene = await provider.getOpeningScene({
			currentSceneId: null,
			choiceId: null,
			gameState: {} as never
		});
		expect(scene.sceneText).toContain('The room feels smaller tonight');
	});

	test('extracts JSON from markdown fence', async () => {
		const fenced = `\`\`\`json\n${validSceneJson}\n\`\`\``;
		const { provider } = createProviderWithResponses([fenced]);
		const scene = await provider.getOpeningScene({
			currentSceneId: null,
			choiceId: null,
			gameState: {} as never
		});
		expect(scene.sceneText).toContain('The room feels smaller tonight');
	});

	test('uses first valid candidate when multiple fenced blocks are present', async () => {
		const first = validSceneJson.replace(
			'The room feels smaller tonight. The weight of eighteen dollars presses down. The clock does not care about excuses or effort. Just money.',
			'First valid block scene text that should be selected. Sydney counts every dollar twice and still comes up short while the room presses in around her.'
		);
		const second = validSceneJson.replace(
			'The room feels smaller tonight. The weight of eighteen dollars presses down. The clock does not care about excuses or effort. Just money.',
			'Second valid block scene text that should not be selected. This line exists to prove candidate ordering only and should be ignored by extraction.'
		);
		const body = `\`\`\`json\n${first}\n\`\`\`\n\n\`\`\`json\n${second}\n\`\`\``;
		const { provider } = createProviderWithResponses([body]);
		const scene = await provider.getOpeningScene({
			currentSceneId: null,
			choiceId: null,
			gameState: {} as never
		});
		expect(scene.sceneText).toContain('First valid block scene text');
		expect(scene.sceneText).not.toContain('Second valid block');
	});

	test('recovery parse succeeds after first malformed response', async () => {
		const malformed = '{"sceneText": "She said "hello" loudly.", "choices": []}';
		const { provider, getCallCount } = createProviderWithResponses([malformed, validSceneJson]);
		const scene = await provider.getOpeningScene({
			currentSceneId: null,
			choiceId: null,
			gameState: {} as never
		});
		expect(getCallCount()).toBe(2);
		expect(scene.sceneText).toContain('The room feels smaller tonight');
	});

	test('throws typed invalid_response when both parse attempts fail', async () => {
		const garbage = 'not json at all';
		const { provider, getCallCount } = createProviderWithResponses([garbage, garbage]);
		await expect(
			provider.getOpeningScene({
				currentSceneId: null,
				choiceId: null,
				gameState: {} as never
			})
		).rejects.toMatchObject({
			name: AiProviderError.name,
			code: 'invalid_response',
			retryable: false
		});
		expect(getCallCount()).toBe(2);
	});

	test('throws typed invalid_response for truncated JSON across both attempts', async () => {
		const truncated = '{"sceneText":"incomplete...';
		const { provider } = createProviderWithResponses([truncated, truncated]);
		await expect(
			provider.getOpeningScene({
				currentSceneId: null,
				choiceId: null,
				gameState: {} as never
			})
		).rejects.toMatchObject({
			name: AiProviderError.name,
			code: 'invalid_response'
		});
	});

	test('throws typed invalid_response for non-object JSON across both attempts', async () => {
		const nonObject = '["this", "is", "an", "array"]';
		const { provider } = createProviderWithResponses([nonObject, nonObject]);
		await expect(
			provider.getOpeningScene({
				currentSceneId: null,
				choiceId: null,
				gameState: {} as never
			})
		).rejects.toMatchObject({
			name: AiProviderError.name,
			code: 'invalid_response'
		});
	});
});
