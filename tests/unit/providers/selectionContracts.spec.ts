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

type HasGenerateImage<T> = 'generateImage' extends keyof T ? true : false;
type HasProbe<T> = 'probe' extends keyof T ? true : false;
type HasGetOpeningScene<T> = 'getOpeningScene' extends keyof T ? true : false;

test.describe('provider selection contract narrowing', () => {
	test('text selection returns text-only contract', () => {
		const config = makeConfig();
		const registry = createProviderRegistry(config);
		const provider = selectTextProvider(config, registry);

		// Compile-time type assertions — these fail to compile if the contract widens
		const textHasGenerateImage: HasGenerateImage<typeof provider> = false;
		const textHasProbe: HasProbe<typeof provider> = false;

		// Silence unused-variable warnings; the real check is above at compile time
		void textHasGenerateImage;
		void textHasProbe;

		expect(typeof provider.getOpeningScene).toBe('function');
		expect(typeof provider.getNextScene).toBe('function');
	});

	test('image selection returns image-only contract', () => {
		const config = makeConfig();
		const registry = createProviderRegistry(config);
		const provider = selectImageProvider(config, registry);

		const imageHasGetOpening: HasGetOpeningScene<typeof provider> = false;
		const imageHasProbe: HasProbe<typeof provider> = false;

		void imageHasGetOpening;
		void imageHasProbe;

		expect(typeof provider.generateImage).toBe('function');
	});

	test('probe selection returns probe-only contract', () => {
		const config = makeConfig();
		const registry = createProviderRegistry(config);
		const provider = selectProbeProvider(config, registry);

		const probeHasGenerateImage: HasGenerateImage<typeof provider> = false;
		const probeHasGetOpening: HasGetOpeningScene<typeof provider> = false;

		void probeHasGenerateImage;
		void probeHasGetOpening;

		expect(typeof provider.probe).toBe('function');
	});
});
