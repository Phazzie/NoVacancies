export interface ExtractJsonObjectOptions {
	strict?: boolean;
	emptyErrorMessage?: string;
	notFoundErrorMessage?: string;
}

const DEFAULT_EMPTY_ERROR = 'Empty response';
const DEFAULT_NOT_FOUND_ERROR = 'No parseable JSON object found in response';

function collectJsonObjectCandidates(text: string): string[] {
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
	while ((fencedMatch = fencedRegex.exec(text)) !== null) {
		if (fencedMatch[1]) pushCandidate(fencedMatch[1]);
	}

	if (text.startsWith('{') && text.endsWith('}')) {
		pushCandidate(text);
	}

	const maxObjectsToScan = 10;
	let objectsFound = 0;
	for (let start = 0; start < text.length && objectsFound < maxObjectsToScan; start += 1) {
		if (text[start] !== '{') continue;

		let depth = 0;
		let inString = false;
		let escaped = false;

		for (let i = start; i < text.length; i += 1) {
			const ch = text[i];
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
					pushCandidate(text.slice(start, i + 1));
					objectsFound += 1;
					start = i;
					break;
				}
			}
		}
	}

	return candidates;
}

export function extractJsonObject(text: string, options: ExtractJsonObjectOptions = {}): string {
	const {
		strict = true,
		emptyErrorMessage = DEFAULT_EMPTY_ERROR,
		notFoundErrorMessage = DEFAULT_NOT_FOUND_ERROR
	} = options;

	const trimmed = text.trim();
	if (!trimmed) {
		throw new Error(emptyErrorMessage);
	}

	const candidates = collectJsonObjectCandidates(trimmed);
	if (!strict) {
		if (candidates.length > 0) {
			return candidates[0];
		}
		throw new Error(notFoundErrorMessage);
	}

	for (const candidate of candidates) {
		try {
			const parsed = JSON.parse(candidate);
			if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
				return candidate;
			}
		} catch {
			// Try the next candidate.
		}
	}

	throw new Error(notFoundErrorMessage);
}
