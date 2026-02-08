import type { GameState } from '$lib/contracts';
import type { AiConfig } from '$lib/server/ai/config';
import { AiProviderError } from '$lib/server/ai/provider.interface';
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
	if (gameState.useMocks) {
		throw new AiProviderError('Mock mode is disabled in Grok-only runtime', {
			code: 'provider_down',
			retryable: false,
			status: 503
		});
	}
	if (config.provider === 'grok' && config.enableGrokText) {
		return registry.grok;
	}
	throw new AiProviderError('Grok text provider is not enabled', {
		code: 'provider_down',
		retryable: false,
		status: 503
	});
}

export function selectImageProvider(config: AiConfig, registry: ProviderRegistry): AiProvider {
	if (config.provider === 'grok' && config.enableGrokImages) {
		return registry.grok;
	}
	throw new AiProviderError('Grok image provider is not enabled (using static images)', {
		code: 'provider_down',
		retryable: false,
		status: 503
	});
}
