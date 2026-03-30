import type { AiConfig } from '$lib/server/ai/config';
import { AiProviderError } from '$lib/server/ai/provider.interface';
import { GrokAiProvider } from '$lib/server/ai/providers/grok';
import type { AiProvider, ImageProvider, ProbeProvider, TextSceneProvider } from '$lib/server/ai/provider.interface';

type GrokProvider = AiProvider & ImageProvider & ProbeProvider;

export interface ProviderRegistry {
	grok: GrokProvider;
}

export function createProviderRegistry(config: AiConfig): ProviderRegistry {
	return {
		grok: new GrokAiProvider(config)
	};
}

export function selectTextProvider(
	config: AiConfig,
	registry: ProviderRegistry
): TextSceneProvider {
	if (config.provider === 'grok' && config.enableGrokText) {
		return registry.grok;
	}
	throw new AiProviderError('Grok text provider is not enabled', {
		code: 'provider_down',
		retryable: false,
		status: 503
	});
}

export function selectImageProvider(config: AiConfig, registry: ProviderRegistry): ImageProvider {
	if (config.provider === 'grok' && config.enableGrokImages) {
		return registry.grok;
	}
	throw new AiProviderError('Grok image provider is not enabled (using static images)', {
		code: 'provider_down',
		retryable: false,
		status: 503
	});
}

export function selectProbeProvider(config: AiConfig, registry: ProviderRegistry): ProbeProvider {
	if (config.provider === 'grok' && config.enableProviderProbe) {
		return registry.grok;
	}
	throw new AiProviderError('Grok probe provider is not enabled', {
		code: 'provider_down',
		retryable: false,
		status: 503
	});
}
