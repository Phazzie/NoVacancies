import { json, type RequestHandler } from '@sveltejs/kit';
import { formatImageDiagnosticsSummary, getImageGenerationDiagnostics } from '$lib/server/ai/diagnostics';
import { NARRATIVE_CARTRIDGE } from '$lib/server/ai/narrative';

export const GET: RequestHandler = async () => {
	const imageGeneration = getImageGenerationDiagnostics();
	return json({
		activeCartridge: NARRATIVE_CARTRIDGE,
		imageGeneration: {
			...imageGeneration,
			humanDiagnostics: formatImageDiagnosticsSummary(imageGeneration)
		},
		updatedAt: new Date().toISOString()
	});
};
