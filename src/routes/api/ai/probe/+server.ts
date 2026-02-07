import { json, type RequestHandler } from '@sveltejs/kit';
import { loadAiConfig } from '$lib/server/ai/config';
import { createProviderRegistry } from '$lib/server/ai/providers';
import { asRouteError } from '$lib/server/ai/routeHelpers';

export const GET: RequestHandler = async (event) => {
	try {
		const config = loadAiConfig();
		if (!config.enableProviderProbe) {
			return json({ error: 'provider probe disabled' }, { status: 403 });
		}

		const providers = createProviderRegistry(config);
		const probeProvider = config.provider === 'grok' ? providers.grok : providers.mock;
		const result = await probeProvider.probe?.();
		return json({
			probe: result ?? null,
			config: {
				provider: config.provider,
				grokTextModel: config.grokTextModel,
				grokImageModel: config.grokImageModel
			}
		});
	} catch (error) {
		return asRouteError(event, error);
	}
};

