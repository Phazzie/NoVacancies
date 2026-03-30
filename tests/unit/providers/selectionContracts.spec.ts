import { expect, test } from '@playwright/test';
import type { AiConfig } from '../../../src/lib/server/ai/config';
import {
	createProviderRegistry,
	selectImageProvider,
	selectProbeProvider,
	selectTextProvider
} from '../../../src/lib/server/ai/providers';

function makeConfig(overrides: Partial<AiConfig> = {}): AiConfig {
	return {
		provider: 'grok',
		enableGrokText: true,
		enableGrokImages: true,
		enableProviderProbe: true,
		aiAuthBypass: false,
		outageMode: 'hard_fail',
		xaiApiKey: 'test-key',
		grokTextModel: 'grok-test-text',
		grokImageModel: 'grok-test-image',
		maxOutputTokens: 1200,
		requestTimeoutMs: 10_000,
		maxRetries: 0,
		retryBackoffMs: [50, 100],
		...overrides
	};
}

type HasGenerateImage<T> = T extends { generateImage: (...args: unknown[]) => unknown } ? true : false;
type HasProbe<T> = T extends { probe: (...args: unknown[]) => unknown } ? true : false;
type HasGetOpeningScene<T> = T extends { getOpeningScene: (...args: unknown[]) => unknown }
	? true
	: false;

test.describe('provider selection contract narrowing', () => {
	test('text selection returns text-only contract', () => {
		const config = makeConfig();
		const registry = createProviderRegistry(config);
		const provider = selectTextProvider(config, registry);

		const textHasGenerateImage: HasGenerateImage<typeof provider> = false;
		const textHasProbe: HasProbe<typeof provider> = false;

		expect(textHasGenerateImage).toBe(false);
		expect(textHasProbe).toBe(false);
		expect(typeof provider.getOpeningScene).toBe('function');
		expect(typeof provider.getNextScene).toBe('function');
	});

	test('image selection returns image-only contract', () => {
		const config = makeConfig();
		const registry = createProviderRegistry(config);
		const provider = selectImageProvider(config, registry);

		const imageHasGetOpening: HasGetOpeningScene<typeof provider> = false;
		const imageHasProbe: HasProbe<typeof provider> = false;

		expect(imageHasGetOpening).toBe(false);
		expect(imageHasProbe).toBe(false);
		expect(typeof provider.generateImage).toBe('function');
	});

	test('probe selection returns probe-only contract', () => {
		const config = makeConfig();
		const registry = createProviderRegistry(config);
		const provider = selectProbeProvider(config, registry);

		const probeHasGenerateImage: HasGenerateImage<typeof provider> = false;
		const probeHasGetOpening: HasGetOpeningScene<typeof provider> = false;

		expect(probeHasGenerateImage).toBe(false);
		expect(probeHasGetOpening).toBe(false);
		expect(typeof provider.probe).toBe('function');
	});
});
