<script lang="ts" context="module">
	export interface AlignmentGap {
		field: string;
		issue: string;
		suggestion: string;
	}

	export interface AlignmentResult {
		score: number;
		summary: string;
		gaps: AlignmentGap[];
	}

	export interface AlignmentResponsePayload {
		alignment: AlignmentResult;
		lesson: { id: number; title: string };
		source: 'ai' | 'fallback';
	}
</script>

<script lang="ts">
	import type { BuilderStoryDraft } from '$lib/stories/types';

	export let draft: BuilderStoryDraft;
	export let lessonId: string = '';
	export let title: string = 'Lesson alignment';

	type ViewState = 'idle' | 'loading' | 'ready' | 'error';

	let viewState: ViewState = 'idle';
	let errorMessage = '';
	let result: AlignmentResult | null = null;
	let resolvedLessonTitle: string | null = null;
	let resultSource: 'ai' | 'fallback' | null = null;

	$: hasLesson = typeof lessonId === 'string' && lessonId.trim().length > 0;
	$: scoreTone = result ? toneForScore(result.score) : 'neutral';
	$: meterPercent = result ? Math.max(0, Math.min(100, (result.score / 10) * 100)) : 0;

	function toneForScore(score: number): 'low' | 'mid' | 'high' {
		if (score <= 4) return 'low';
		if (score <= 7) return 'mid';
		return 'high';
	}

	async function runAlignmentCheck(): Promise<void> {
		if (!hasLesson) {
			viewState = 'error';
			errorMessage = 'Select a lesson before checking alignment.';
			return;
		}
		viewState = 'loading';
		errorMessage = '';
		try {
			const response = await fetch('/api/builder/alignment', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ draft, lessonId })
			});
			const payload = (await response.json().catch(() => ({}))) as Partial<
				AlignmentResponsePayload & { error: string }
			>;
			if (!response.ok || !payload.alignment) {
				throw new Error(payload.error || `Alignment check failed (${response.status}).`);
			}
			result = payload.alignment;
			resolvedLessonTitle = payload.lesson?.title ?? null;
			resultSource = payload.source ?? null;
			viewState = 'ready';
		} catch (error) {
			viewState = 'error';
			errorMessage =
				error instanceof Error ? error.message : 'Alignment check failed unexpectedly.';
		}
	}
</script>

<section class="alignment-score" aria-label={title}>
	<header class="alignment-head">
		<div>
			<p class="alignment-kicker">Authoring signal</p>
			<h3>{title}</h3>
		</div>
		<button
			type="button"
			class="alignment-button"
			on:click={runAlignmentCheck}
			disabled={viewState === 'loading' || !hasLesson}
			data-testid="alignment-check"
		>
			{viewState === 'loading' ? 'Checking…' : result ? 'Re-check' : 'Check alignment'}
		</button>
	</header>

	{#if !hasLesson}
		<p class="alignment-empty">
			Pick a lesson above to score how well this draft puts that lesson under pressure.
		</p>
	{:else if viewState === 'idle'}
		<p class="alignment-empty">
			Run a check to score how well the current draft surfaces the selected lesson.
		</p>
	{:else if viewState === 'loading'}
		<p class="alignment-empty" aria-live="polite">Grading draft against lesson…</p>
	{:else if viewState === 'error'}
		<p class="alignment-error" role="alert">{errorMessage}</p>
	{:else if viewState === 'ready' && result}
		<div class="alignment-result">
			<div class="alignment-meta">
				{#if resolvedLessonTitle}
					<p class="alignment-lesson">Lesson: <strong>{resolvedLessonTitle}</strong></p>
				{/if}
				{#if resultSource}
					<p class="alignment-source">
						Source: {resultSource === 'ai' ? 'Grok evaluator' : 'Heuristic fallback'}
					</p>
				{/if}
			</div>

			<div
				class="alignment-meter"
				class:is-low={scoreTone === 'low'}
				class:is-mid={scoreTone === 'mid'}
				class:is-high={scoreTone === 'high'}
				role="img"
				aria-label="Alignment score {result.score} of 10"
			>
				<div class="alignment-meter-track">
					<div class="alignment-meter-fill" style="width: {meterPercent}%"></div>
				</div>
				<div class="alignment-meter-readout">
					<span class="alignment-score-number">{result.score}</span>
					<span class="alignment-score-suffix">/ 10</span>
				</div>
			</div>

			<p class="alignment-summary">{result.summary}</p>

			{#if result.gaps.length === 0}
				<p class="alignment-empty">No gaps flagged. The draft is invoking the lesson cleanly.</p>
			{:else}
				<ul class="alignment-gaps">
					{#each result.gaps as gap, index (index)}
						<li class="alignment-gap">
							<p class="alignment-gap-field"><code>{gap.field}</code></p>
							<p class="alignment-gap-issue">{gap.issue}</p>
							<p class="alignment-gap-suggestion">
								<span class="alignment-gap-suggestion-label">Fix:</span>
								{gap.suggestion}
							</p>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</section>

<style>
	.alignment-score {
		--align-accent: var(--accent-bright, #6366f1);
		--align-low: var(--amber-400, #f59e0b);
		--align-mid: var(--amber-400, #f59e0b);
		--align-high: var(--sage-400, #22c55e);
		--align-card-bg: rgba(18, 12, 9, 0.92);
		--align-card-border: var(--line-soft, rgba(247, 241, 232, 0.12));
		--align-card-border-strong: var(--line-strong, rgba(247, 241, 232, 0.22));
		--align-text: var(--text-100, #f7f1e8);
		--align-text-dim: var(--text-300, #b8aa9d);
		display: grid;
		gap: 0.85rem;
		padding: 1rem;
		border: 1px solid var(--align-card-border);
		border-radius: 16px;
		background: linear-gradient(180deg, rgba(18, 12, 9, 0.92), rgba(10, 8, 7, 0.96));
		box-shadow: var(--shadow-md, 0 16px 36px rgba(0, 0, 0, 0.22));
		color: var(--align-text);
	}

	.alignment-head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.alignment-head h3 {
		margin: 0.1rem 0 0;
		font-family: var(--font-display, serif);
		font-size: 1.1rem;
		color: var(--align-text);
	}

	.alignment-kicker {
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		font-size: 0.68rem;
		color: var(--align-text-dim);
	}

	.alignment-button {
		appearance: none;
		border: 1px solid var(--align-card-border-strong);
		background: rgba(247, 241, 232, 0.04);
		color: var(--align-text);
		font: inherit;
		font-size: 0.82rem;
		padding: 0.45rem 0.85rem;
		border-radius: 8px;
		cursor: pointer;
		transition: background 120ms ease-out, border-color 120ms ease-out;
	}

	.alignment-button:hover:not(:disabled) {
		background: rgba(247, 241, 232, 0.08);
		border-color: var(--align-accent);
	}

	.alignment-button:disabled {
		cursor: not-allowed;
		opacity: 0.55;
	}

	.alignment-empty {
		margin: 0;
		padding: 0.85rem;
		border: 1px dashed var(--align-card-border-strong);
		border-radius: 12px;
		color: var(--align-text-dim);
		font-size: 0.88rem;
	}

	.alignment-error {
		margin: 0;
		padding: 0.85rem;
		border: 1px solid var(--align-low);
		border-radius: 12px;
		color: var(--align-text);
		background: rgba(245, 158, 11, 0.08);
		font-size: 0.88rem;
	}

	.alignment-result {
		display: grid;
		gap: 0.85rem;
	}

	.alignment-meta {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.4rem;
		font-size: 0.78rem;
		color: var(--align-text-dim);
	}

	.alignment-meta p {
		margin: 0;
	}

	.alignment-lesson strong {
		color: var(--align-text);
		font-weight: 600;
	}

	.alignment-meter {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: 0.85rem;
	}

	.alignment-meter-track {
		height: 12px;
		border-radius: 999px;
		background: rgba(247, 241, 232, 0.08);
		border: 1px solid var(--align-card-border-strong);
		overflow: hidden;
	}

	.alignment-meter-fill {
		height: 100%;
		transition: width 240ms ease-out, background 240ms ease-out;
		background: var(--align-mid);
	}

	.alignment-meter.is-low .alignment-meter-fill {
		background: var(--align-low);
	}

	.alignment-meter.is-mid .alignment-meter-fill {
		background: var(--align-mid);
	}

	.alignment-meter.is-high .alignment-meter-fill {
		background: var(--align-high);
	}

	.alignment-meter-readout {
		display: inline-flex;
		align-items: baseline;
		gap: 0.15rem;
		font-family: var(--font-mono, monospace);
		color: var(--align-text);
	}

	.alignment-meter.is-low .alignment-meter-readout {
		color: var(--align-low);
	}

	.alignment-meter.is-high .alignment-meter-readout {
		color: var(--align-high);
	}

	.alignment-score-number {
		font-size: 1.55rem;
		font-weight: 700;
	}

	.alignment-score-suffix {
		font-size: 0.85rem;
		color: var(--align-text-dim);
	}

	.alignment-summary {
		margin: 0;
		font-size: 0.92rem;
		color: var(--align-text);
		line-height: 1.4;
	}

	.alignment-gaps {
		list-style: none;
		display: grid;
		gap: 0.6rem;
		margin: 0;
		padding: 0;
	}

	.alignment-gap {
		display: grid;
		gap: 0.25rem;
		padding: 0.7rem 0.8rem;
		border: 1px solid var(--align-card-border-strong);
		border-left: 3px solid var(--align-low);
		border-radius: 10px;
		background: rgba(9, 7, 7, 0.55);
	}

	.alignment-gap p {
		margin: 0;
		font-size: 0.86rem;
		line-height: 1.4;
	}

	.alignment-gap-field code {
		font-family: var(--font-mono, monospace);
		font-size: 0.78rem;
		padding: 0.1rem 0.4rem;
		border-radius: 6px;
		background: rgba(247, 241, 232, 0.08);
		color: var(--align-text);
		letter-spacing: 0.02em;
	}

	.alignment-gap-issue {
		color: var(--align-text);
	}

	.alignment-gap-suggestion {
		color: var(--align-text-dim);
	}

	.alignment-gap-suggestion-label {
		color: var(--align-high);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-size: 0.7rem;
		font-weight: 700;
		margin-right: 0.3rem;
	}
</style>
