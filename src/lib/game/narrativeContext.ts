import type { GameState, NarrativeContext, StoryThreads, TransitionBridge } from '../contracts';
import { getActiveStoryCartridge } from '$lib/stories';

export const NARRATIVE_CONTEXT_CHAR_BUDGET = 12000;
const MAX_RECENT_SCENE_PROSE = 2;
const MAX_OLDER_SCENE_SUMMARIES = 6;
const MAX_RECENT_OPENINGS = 3;
const MAX_RECENT_CHOICE_TEXTS = 5;
const MIN_RECENT_SCENE_PROSE_CHARS = 120;
const RECENT_SCENE_PROSE_TRIM_STEP = 240;

function compressSceneForSummary(sceneText = ''): string {
	const oneLine = sceneText.replace(/\s+/g, ' ').trim();
	if (!oneLine) return '';
	const firstSentence = oneLine.split(/[.!?]/)[0] || oneLine;
	return firstSentence.slice(0, 160);
}

function extractOpeningSentence(sceneText = ''): string {
	const oneLine = sceneText.replace(/\s+/g, ' ').trim();
	if (!oneLine) return '';
	const firstSentence = oneLine.split(/[.!?]/)[0] || oneLine;
	return firstSentence.trim().slice(0, 180);
}

function buildRecentOpenings(
	sceneLog: Array<{ sceneText?: string }> = []
): string[] {
	const seen = new Set<string>();
	const openings: string[] = [];

	// First-sentence memory replaces the old beat-label heuristic with model-readable scene variety cues.
	for (const entry of sceneLog.slice(-6).reverse()) {
		const opening = extractOpeningSentence(entry.sceneText || '');
		if (!opening || seen.has(opening)) continue;
		seen.add(opening);
		openings.push(opening);
		if (openings.length >= MAX_RECENT_OPENINGS) break;
	}

	return openings;
}

function buildRecentChoiceTexts(
	history: Array<{ choiceText?: string }> = []
): string[] {
	const texts = history
		.slice(-MAX_RECENT_CHOICE_TEXTS)
		.map((entry) => (typeof entry.choiceText === 'string' ? entry.choiceText.trim() : ''))
		.filter(Boolean);
	return texts;
}

function estimateContextChars(context: unknown): number {
	try {
		return JSON.stringify(context).length;
	} catch {
		return 0;
	}
}

function trimRecentSceneProse(text: string): string {
	if (text.length <= MIN_RECENT_SCENE_PROSE_CHARS) return text;
	const nextLength = Math.max(MIN_RECENT_SCENE_PROSE_CHARS, text.length - RECENT_SCENE_PROSE_TRIM_STEP);
	const trimmed = text.slice(0, nextLength).trimEnd();
	const withEllipsis = trimmed.endsWith('...') || trimmed.endsWith('…') ? trimmed : `${trimmed}…`;
	// Invariant: each trim call must either reduce length or return the original text unchanged.
	if (withEllipsis.length < text.length) return withEllipsis;
	if (trimmed.length < text.length) return trimmed;
	return text;
}

function applyContextBudget(context: NarrativeContext, maxChars: number): NarrativeContext {
	const budgeted = {
		...context,
		recentChoiceTexts: [...context.recentChoiceTexts],
		threadNarrativeLines: [...context.threadNarrativeLines],
		boundaryNarrativeLines: [...context.boundaryNarrativeLines],
		lessonHistoryLines: [...context.lessonHistoryLines],
		recentOpenings: [...context.recentOpenings],
		recentSceneProse: [...context.recentSceneProse],
		olderSceneSummaries: [...context.olderSceneSummaries]
	};

	const dropped = {
		olderSummaries: 0,
		recentProse: 0
	};

	// Older summaries are the cheapest information to lose; keep the freshest prose until we have to trim it.
	while (estimateContextChars(budgeted) > maxChars && budgeted.olderSceneSummaries.length > 0) {
		budgeted.olderSceneSummaries.shift();
		dropped.olderSummaries += 1;
	}

	while (estimateContextChars(budgeted) > maxChars) {
		let trimmed = false;
		for (let index = 0; index < budgeted.recentSceneProse.length; index += 1) {
			const prose = budgeted.recentSceneProse[index];
			if (prose.text.length > MIN_RECENT_SCENE_PROSE_CHARS) {
				const nextText = trimRecentSceneProse(prose.text);
				if (nextText === prose.text) {
					continue;
				}
				budgeted.recentSceneProse[index] = {
					...prose,
					text: nextText
				};
				dropped.recentProse += 1;
				trimmed = true;
				break;
			}
		}
		if (!trimmed) break;
	}

	budgeted.meta = {
		...budgeted.meta,
		contextChars: estimateContextChars(budgeted),
		budgetChars: maxChars,
		truncated: dropped.olderSummaries > 0 || dropped.recentProse > 0,
		droppedOlderSummaries: dropped.olderSummaries,
		droppedRecentProse: dropped.recentProse
	};

	return budgeted;
}

function resolveTransitionBridge(gameState: GameState | null | undefined): TransitionBridge | null {
	const bridge = gameState?.pendingTransitionBridge;
	if (!bridge || !Array.isArray(bridge.moments) || bridge.moments.length === 0) {
		return null;
	}
	return {
		keys: Array.isArray(bridge.keys) ? bridge.keys : [],
		// Prompt rendering only needs the next couple of shifts; cloning keeps game state immutable at the seam.
		moments: bridge.moments.slice(0, 2).map((moment) => ({ ...moment }))
	};
}

export function translateThreadStateNarrative(threads: StoryThreads | null): string[] {
	return getActiveStoryCartridge().context.translateThreadStateNarrative(threads);
}

export function translateBoundaries(boundaries: string[] = []): string[] {
	return getActiveStoryCartridge().context.translateBoundaries(boundaries);
}

export function translateLessonHistory(lessonsEncountered: number[] = []): string[] {
	return getActiveStoryCartridge().context.translateLessonHistory(lessonsEncountered);
}

export function detectThreadTransitions(
	previousThreads: StoryThreads | null | undefined,
	currentThreads: StoryThreads | null | undefined
): TransitionBridge {
	return getActiveStoryCartridge().context.detectThreadTransitions(previousThreads, currentThreads);
}

export function buildNarrativeContext(
	gameState: GameState | null | undefined,
	options: { lastChoiceText?: string; maxChars?: number } = {}
): NarrativeContext {
	const { lastChoiceText = '', maxChars = NARRATIVE_CONTEXT_CHAR_BUDGET } = options;
	const sceneLog = Array.isArray(gameState?.sceneLog) ? gameState.sceneLog : [];
	const recentEntries = sceneLog.slice(-MAX_RECENT_SCENE_PROSE);
	const olderEntries = sceneLog.slice(0, Math.max(0, sceneLog.length - MAX_RECENT_SCENE_PROSE));

	const recentSceneProse = recentEntries.map((entry) => ({
		sceneId: entry.sceneId,
		text: entry.sceneText || '',
		viaChoiceText: entry.viaChoiceText || ''
	}));

	const olderSceneSummaries = olderEntries
		.slice(-MAX_OLDER_SCENE_SUMMARIES)
		.map((entry) => `[Choice: ${entry.viaChoiceText || 'n/a'}] ${compressSceneForSummary(entry.sceneText || '')}`);

	const context: NarrativeContext = {
		sceneCount: Number(gameState?.sceneCount || 0),
		lastChoiceText: lastChoiceText || '',
		recentChoiceTexts: buildRecentChoiceTexts(
			(gameState?.sceneLog || []).map((e) => ({ choiceText: e.viaChoiceText }))
		),
		threadState: gameState?.storyThreads || null,
		threadNarrativeLines: translateThreadStateNarrative(gameState?.storyThreads || null),
		boundaryNarrativeLines: translateBoundaries(gameState?.storyThreads?.boundariesSet || []),
		lessonHistoryLines: translateLessonHistory(gameState?.lessonsEncountered || []),
		recentOpenings: buildRecentOpenings(sceneLog),
		recentSceneProse,
		olderSceneSummaries,
		transitionBridge: resolveTransitionBridge(gameState),
		meta: {
			contextChars: 0,
			budgetChars: maxChars,
			truncated: false,
			droppedOlderSummaries: 0,
			droppedRecentProse: 0
		}
	};

	context.meta.contextChars = estimateContextChars(context);
	return applyContextBudget(context, maxChars);
}
