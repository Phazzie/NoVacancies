import type { GameState } from '$lib/contracts';
import type { AiConfig } from '$lib/server/ai/config';
import { GrokAiProvider } from '$lib/server/ai/providers/grok';
import { mockAiProvider } from '$lib/server/ai/providers/mock';
import type { AiProvider } from '$lib/server/ai/provider.interface';

export interface ProviderRegistry {
	mock: AiProvider;
	grok: AiProvider;
}

export function createProviderRegistry(config: AiConfig): ProviderRegistry {
	return {
		mock: mockAiProvider,
		grok: new GrokAiProvider(config)
	};
}

export function selectTextProvider(
	config: AiConfig,
	registry: ProviderRegistry,
	gameState: Pick<GameState, 'useMocks'>
): AiProvider {
	if (gameState.useMocks) return registry.mock;
	if (config.provider === 'grok' && config.enableGrokText && config.xaiApiKey.length > 0) {
		return registry.grok;
	}
	return registry.mock;
}

export function selectImageProvider(config: AiConfig, registry: ProviderRegistry): AiProvider {
	if (config.provider === 'grok' && config.enableGrokImages && config.xaiApiKey.length > 0) {
		return registry.grok;
	}
	return registry.mock;
}
