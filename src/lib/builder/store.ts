import type { BuilderStoryDraft } from '$lib/stories/types';

function getStorageKey(scope: string): string {
	const normalized = typeof scope === 'string' && scope.trim().length > 0 ? scope.trim() : 'default';
	return `nv-builder-draft-v3:${normalized}`;
}

export function loadBuilderDraft(scope: string, fallback: BuilderStoryDraft): BuilderStoryDraft {
	if (typeof localStorage === 'undefined') {
		return fallback;
	}

	try {
		const raw = localStorage.getItem(getStorageKey(scope));
		if (!raw) return fallback;
		const parsed = JSON.parse(raw) as BuilderStoryDraft | null;
		if (!parsed || typeof parsed !== 'object') return fallback;
		return {
			...fallback,
			...parsed
		};
	} catch {
		return fallback;
	}
}

export function saveBuilderDraft(scope: string, draft: BuilderStoryDraft): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(getStorageKey(scope), JSON.stringify(draft));
	} catch {
		// Ignore storage failures and keep the editor usable.
	}
}
