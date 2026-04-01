import { AiProviderError } from '$lib/server/ai/provider.interface';
import { extractJsonObject as extractJsonObjectShared } from '$lib/server/ai/json/extractJsonObject';

// Re-export so callers and tests can use it via this module's path.
export { extractJsonObjectShared as extractJsonObject };

export interface SceneCandidate {
	sceneId?: unknown;
	sceneText?: unknown;
	choices?: Array<{ id?: unknown; text?: unknown; outcome?: unknown }>;
	lessonId?: unknown;
	imageKey?: unknown;
	imagePrompt?: unknown;
	isEnding?: unknown;
	endingType?: unknown;
	mood?: unknown;
	storyThreadUpdates?: Record<string, unknown> | null;
}

export function parseSceneCandidate(text: string): SceneCandidate {
	const json = extractJsonObjectShared(text, {
		emptyErrorMessage: 'Empty provider response',
		notFoundErrorMessage: 'No parseable JSON object found in provider response'
	});
	return JSON.parse(json) as SceneCandidate;
}

export async function parseSceneWithRecovery(options: {
	firstResponseText: string;
	getRecoveryText: (firstResponseText: string) => Promise<string>;
}): Promise<{ scene: SceneCandidate; parseAttempts: number; recoverySample?: string }> {
	try {
		return {
			scene: parseSceneCandidate(options.firstResponseText),
			parseAttempts: 1
		};
	} catch {
		const recoverySample = await options.getRecoveryText(options.firstResponseText);
		try {
			return {
				scene: parseSceneCandidate(recoverySample),
				parseAttempts: 2,
				recoverySample
			};
		} catch {
			throw new AiProviderError('Unable to parse scene from provider response', {
				code: 'invalid_response',
				retryable: false
			});
		}
	}
}
