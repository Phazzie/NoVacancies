import { AiProviderError } from '$lib/server/ai/provider.interface';

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

export function extractJsonObject(text: string): string {
	const trimmed = text.trim();
	if (!trimmed) throw new Error('Empty provider response');

	const candidates: string[] = [];
	const seen = new Set<string>();

	const pushCandidate = (value: string) => {
		const candidate = value.trim();
		if (!candidate || seen.has(candidate)) return;
		seen.add(candidate);
		candidates.push(candidate);
	};

	const fencedRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
	let fencedMatch: RegExpExecArray | null = null;
	while ((fencedMatch = fencedRegex.exec(trimmed)) !== null) {
		if (fencedMatch[1]) pushCandidate(fencedMatch[1]);
	}

	if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
		pushCandidate(trimmed);
	}

	const maxObjectsToScan = 10;
	let objectsFound = 0;
	for (let start = 0; start < trimmed.length && objectsFound < maxObjectsToScan; start += 1) {
		if (trimmed[start] !== '{') continue;

		let depth = 0;
		let inString = false;
		let escaped = false;

		for (let i = start; i < trimmed.length; i += 1) {
			const ch = trimmed[i];
			if (inString) {
				if (escaped) {
					escaped = false;
				} else if (ch === '\\') {
					escaped = true;
				} else if (ch === '"') {
					inString = false;
				}
				continue;
			}

			if (ch === '"') {
				inString = true;
				continue;
			}
			if (ch === '{') depth += 1;
			if (ch === '}') {
				depth -= 1;
				if (depth === 0) {
					pushCandidate(trimmed.slice(start, i + 1));
					objectsFound += 1;
					start = i;
					break;
				}
			}
		}
	}

	for (const candidate of candidates) {
		try {
			const parsed = JSON.parse(candidate);
			if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
				return candidate;
			}
		} catch {
			// continue scanning parse candidates
		}
	}

	throw new Error('No parseable JSON object found in provider response');
}

export function parseSceneCandidate(text: string): SceneCandidate {
	const json = extractJsonObject(text);
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
