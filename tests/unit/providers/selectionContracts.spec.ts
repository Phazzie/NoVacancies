import { expect, test } from '@playwright/test';
import { selectImageProvider, selectProbeProvider, selectTextProvider } from '../../../src/lib/server/ai/providers';
import type { AiConfig } from '../../../src/lib/server/ai/config';
import type {
	GenerateImageInput,
	GenerateSceneInput,
	GeneratedImage,
	ProviderProbeResult
} from '../../../src/lib/server/ai/provider.interface';

const baseConfig: AiConfig = {
	provider: 'grok',
	xaiApiKey: 'test-key',
	grokTextModel: 'grok-test-text',
	grokImageModel: 'grok-test-image',
	enableGrokText: true,
	enableGrokImages: true,
	enableProviderProbe: true,
	requestTimeoutMs: 1_000,
	maxRetries: 0,
	retryBackoffMs: [0],
	maxParseRecoveryAttempts: 1
};

function createRegistry() {
	return {
		grok: {
			name: 'grok' as const,
			getOpeningScene: async (_input: GenerateSceneInput) => ({
				sceneId: 'opening',
				sceneText: 'Opening scene text with enough words to satisfy validators in this test.',
				choices: [
					{ id: 'a', text: 'Option A' },
					{ id: 'b', text: 'Option B' }
				],
				lessonId: null,
				imageKey: 'hotel_room',
				isEnding: false,
				endingType: null
			}),
			getNextScene: async (_input: GenerateSceneInput) => ({
				sceneId: 'next',
				sceneText: 'Next scene text with enough words to satisfy validators in this test.',
				choices: [
					{ id: 'a', text: 'Option A' },
					{ id: 'b', text: 'Option B' }
				],
				lessonId: null,
				imageKey: 'hotel_room',
				isEnding: false,
				endingType: null
			}),
			generateImage: async (_input: GenerateImageInput): Promise<GeneratedImage> => ({ url: 'https://example.com' }),
			probe: async (): Promise<ProviderProbeResult> => ({
				provider: 'grok',
				model: 'grok-test-text',
				modelAvailable: true,
				authValid: true,
				latencyMs: 5
			}),
			isAvailable: () => true
		}
	};
}

test.describe('Provider selection contracts', () => {
	test('selectTextProvider returns a scene-capable provider only when text is enabled', async () => {
		const provider = selectTextProvider(baseConfig, createRegistry());
		const opening = await provider.getOpeningScene({
			currentSceneId: null,
			choiceId: null,
			gameState: {
				currentSceneId: 'opening',
				sceneHistory: [],
				inventory: [],
				stats: { money: 47, trust: 5, tension: 7 },
				flags: {},
				storyThreads: { debtPressure: 7, oswaldoCondition: 6, trinaSuspicion: 5 }
			}
		});
		expect(opening.sceneId).toBe('opening');

		expect(() =>
			selectTextProvider({ ...baseConfig, enableGrokText: false }, createRegistry())
		).toThrow(/text provider is not enabled/i);
	});

	test('selectImageProvider returns image capability only when image generation is enabled', async () => {
		const provider = selectImageProvider(baseConfig, createRegistry());
		const image = await provider.generateImage({ prompt: 'test prompt' });
		expect(image.url).toContain('example.com');

		expect(() =>
			selectImageProvider({ ...baseConfig, enableGrokImages: false }, createRegistry())
		).toThrow(/image provider is not enabled/i);
	});

	test('selectProbeProvider returns probe capability only when probing is enabled', async () => {
		const provider = selectProbeProvider(baseConfig, createRegistry());
		const result = await provider.probe();
		expect(result.modelAvailable).toBeTruthy();

		expect(() =>
			selectProbeProvider({ ...baseConfig, enableProviderProbe: false }, createRegistry())
		).toThrow(/probe is not enabled/i);
	});
});
