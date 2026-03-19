import type { BuilderStoryDraft } from '$lib/stories/types';

const STORAGE_KEY = 'nv-builder-draft-v1';

export function loadBuilderDraft(fallback: BuilderStoryDraft): BuilderStoryDraft {
	if (typeof localStorage === 'undefined') {
		return fallback;
	}

	try {
		const raw = localStorage.getItem(STORAGE_KEY);
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

export function saveBuilderDraft(draft: BuilderStoryDraft): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
	} catch {
		// Ignore storage failures and keep the editor usable.
	}
}
