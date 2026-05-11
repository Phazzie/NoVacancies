<script lang="ts" context="module">
	export interface VoiceLineEvaluation {
		moment: string;
		text: string;
		flags: string[];
		isClean: boolean;
	}

	export interface VoiceEvaluationResult {
		lines: VoiceLineEvaluation[];
		overallVoiceScore: number;
		summary: string;
	}

	export interface VoiceEvaluationResponsePayload {
		evaluation: VoiceEvaluationResult;
		source: 'ai' | 'fallback';
	}
</script>

<script lang="ts">
	import type { BuilderStoryDraft } from '$lib/stories/types';

	export let draft: BuilderStoryDraft;
	export let title: string = "What would Sydney do?";

	type ViewState = 'idle' | 'loading' | 'ready' | 'error';

	let viewState: ViewState = 'idle';
	let errorMessage = '';
	let result: VoiceEvaluationResult | null = null;
	let resultSource: 'ai' | 'fallback' | null = null;

	$: scoreTone = result ? toneForScore(result.overallVoiceScore) : 'neutral';
	$: meterPercent = result
		? Math.max(0, Math.min(100, (result.overallVoiceScore / 10) * 100))
		: 0;
	$: flaggedCount = result ? result.lines.filter((line) => !line.isClean).length : 0;

	function toneForScore(score: number): 'low' | 'mid' | 'high' {
		if (score <= 4) return 'low';
		if (score <= 7) return 'mid';
		return 'high';
	}

	async function runVoiceCheck(): Promise<void> {
		viewState = 'loading';
		errorMessage = '';
		try {
			const response = await fetch('/api/builder/evaluate-voice', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ draft })
			});
			const payload = (await response.json().catch(() => ({}))) as Partial<
				VoiceEvaluationResponsePayload & { error: string }
			>;
			if (!response.ok || !payload.evaluation) {
				throw new Error(payload.error || `Voice evaluation failed (${response.status}).`);
			}
			result = payload.evaluation;
			resultSource = payload.source ?? null;
			viewState = 'ready';
		} catch (error) {
			viewState = 'error';
			errorMessage =
				error instanceof Error ? error.message : 'Voice evaluation failed unexpectedly.';
		}
	}
</script>

<section class="voice-evaluator" aria-label={title}>
	<header class="voice-head">
		<div>
			<p class="voice-kicker">Authoring signal</p>
			<h3>{title}</h3>
		</div>
		<button
			type="button"
			class="voice-button"
			on:click={runVoiceCheck}
			disabled={viewState === 'loading'}
			data-testid="voice-evaluator-run"
		>
			{viewState === 'loading' ? 'Testing…' : result ? 'Re-test' : "Test Sydney's voice"}
		</button>
	</header>

	{#if viewState === 'idle'}
		<p class="voice-empty">
			Generates five sample Sydney lines from the current voice constraints, then flags lines
			where she sounds too articulate, too self-aware, or out of register.
		</p>
	{:else if viewState === 'loading'}
		<p class="voice-empty" aria-live="polite">Asking Grok to put Sydney in five different moments…</p>
	{:else if viewState === 'error'}
		<p class="voice-error" role="alert">{errorMessage}</p>
	{:else if viewState === 'ready' && result}
		<div class="voice-result">
			<div class="voice-meta">
				{#if resultSource}
					<p class="voice-source">
						Source: {resultSource === 'ai' ? 'Grok evaluator' : 'Heuristic fallback'}
					</p>
				{/if}
				<p class="voice-flagged">
					Flagged: <strong>{flaggedCount}</strong> / {result.lines.length}
				</p>
			</div>

			<div
				class="voice-meter"
				class:is-low={scoreTone === 'low'}
				class:is-mid={scoreTone === 'mid'}
				class:is-high={scoreTone === 'high'}
				role="img"
				aria-label="Voice score {result.overallVoiceScore} of 10"
			>
				<div class="voice-meter-track">
					<div class="voice-meter-fill" style="width: {meterPercent}%"></div>
				</div>
				<div class="voice-meter-readout">
					<span class="voice-score-number">{result.overallVoiceScore}</span>
					<span class="voice-score-suffix">/ 10</span>
				</div>
			</div>

			<p class="voice-summary">{result.summary}</p>

			{#if result.lines.length === 0}
				<p class="voice-empty">No sample lines returned.</p>
			{:else}
				<ul class="voice-lines">
					{#each result.lines as line, index (index)}
						<li
							class="voice-line"
							class:is-clean={line.isClean}
							class:is-flagged={!line.isClean}
						>
							<div class="voice-line-head">
								<p class="voice-line-moment">{line.moment}</p>
								{#if line.isClean}
									<span class="voice-line-badge voice-line-badge-clean" aria-label="Clean line">
										<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
											<path
												d="M3.5 8.5l3 3 6-7"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
										Clean
									</span>
								{:else}
									<span
										class="voice-line-badge voice-line-badge-flag"
										aria-label="Flagged line"
									>
										<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
											<path
												d="M8 1.5l7 12H1l7-12z"
												fill="none"
												stroke="currentColor"
												stroke-width="1.6"
												stroke-linejoin="round"
											/>
											<path
												d="M8 6v4"
												stroke="currentColor"
												stroke-width="1.6"
												stroke-linecap="round"
											/>
											<circle cx="8" cy="12" r="0.9" fill="currentColor" />
										</svg>
										Flagged
									</span>
								{/if}
							</div>
							<blockquote class="voice-line-quote">{line.text}</blockquote>
							{#if !line.isClean && line.flags.length > 0}
								<ul class="voice-line-flags">
									{#each line.flags as flag, flagIndex (flagIndex)}
										<li>{flag}</li>
									{/each}
								</ul>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</section>

<style>
	.voice-evaluator {
		--voice-accent: var(--accent-bright, #6366f1);
		--voice-low: var(--amber-400, #f59e0b);
		--voice-mid: var(--amber-400, #f59e0b);
		--voice-high: var(--sage-400, #22c55e);
		--voice-card-bg: rgba(18, 12, 9, 0.92);
		--voice-card-border: var(--line-soft, rgba(247, 241, 232, 0.12));
		--voice-card-border-strong: var(--line-strong, rgba(247, 241, 232, 0.22));
		--voice-text: var(--text-100, #f7f1e8);
		--voice-text-dim: var(--text-300, #b8aa9d);
		display: grid;
		gap: 0.85rem;
		padding: 1rem;
		border: 1px solid var(--voice-card-border);
		border-radius: 16px;
		background: linear-gradient(180deg, rgba(18, 12, 9, 0.92), rgba(10, 8, 7, 0.96));
		box-shadow: var(--shadow-md, 0 16px 36px rgba(0, 0, 0, 0.22));
		color: var(--voice-text);
	}

	.voice-head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.voice-head h3 {
		margin: 0.1rem 0 0;
		font-family: var(--font-display, serif);
		font-size: 1.1rem;
		color: var(--voice-text);
	}

	.voice-kicker {
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		font-size: 0.68rem;
		color: var(--voice-text-dim);
	}

	.voice-button {
		appearance: none;
		border: 1px solid var(--voice-card-border-strong);
		background: rgba(247, 241, 232, 0.04);
		color: var(--voice-text);
		font: inherit;
		font-size: 0.82rem;
		padding: 0.45rem 0.85rem;
		border-radius: 8px;
		cursor: pointer;
		transition: background 120ms ease-out, border-color 120ms ease-out;
	}

	.voice-button:hover:not(:disabled) {
		background: rgba(247, 241, 232, 0.08);
		border-color: var(--voice-accent);
	}

	.voice-button:disabled {
		cursor: not-allowed;
		opacity: 0.55;
	}

	.voice-empty {
		margin: 0;
		padding: 0.85rem;
		border: 1px dashed var(--voice-card-border-strong);
		border-radius: 12px;
		color: var(--voice-text-dim);
		font-size: 0.88rem;
	}

	.voice-error {
		margin: 0;
		padding: 0.85rem;
		border: 1px solid var(--voice-low);
		border-radius: 12px;
		color: var(--voice-text);
		background: rgba(245, 158, 11, 0.08);
		font-size: 0.88rem;
	}

	.voice-result {
		display: grid;
		gap: 0.85rem;
	}

	.voice-meta {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.4rem;
		font-size: 0.78rem;
		color: var(--voice-text-dim);
	}

	.voice-meta p {
		margin: 0;
	}

	.voice-flagged strong {
		color: var(--voice-text);
		font-weight: 600;
	}

	.voice-meter {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: 0.85rem;
	}

	.voice-meter-track {
		height: 12px;
		border-radius: 999px;
		background: rgba(247, 241, 232, 0.08);
		border: 1px solid var(--voice-card-border-strong);
		overflow: hidden;
	}

	.voice-meter-fill {
		height: 100%;
		transition: width 240ms ease-out, background 240ms ease-out;
		background: var(--voice-mid);
	}

	.voice-meter.is-low .voice-meter-fill {
		background: var(--voice-low);
	}

	.voice-meter.is-mid .voice-meter-fill {
		background: var(--voice-mid);
	}

	.voice-meter.is-high .voice-meter-fill {
		background: var(--voice-high);
	}

	.voice-meter-readout {
		display: inline-flex;
		align-items: baseline;
		gap: 0.15rem;
		font-family: var(--font-mono, monospace);
		color: var(--voice-text);
	}

	.voice-meter.is-low .voice-meter-readout {
		color: var(--voice-low);
	}

	.voice-meter.is-high .voice-meter-readout {
		color: var(--voice-high);
	}

	.voice-score-number {
		font-size: 1.55rem;
		font-weight: 700;
	}

	.voice-score-suffix {
		font-size: 0.85rem;
		color: var(--voice-text-dim);
	}

	.voice-summary {
		margin: 0;
		font-size: 0.92rem;
		color: var(--voice-text);
		line-height: 1.4;
	}

	.voice-lines {
		list-style: none;
		display: grid;
		gap: 0.6rem;
		margin: 0;
		padding: 0;
	}

	.voice-line {
		display: grid;
		gap: 0.4rem;
		padding: 0.7rem 0.8rem;
		border: 1px solid var(--voice-card-border-strong);
		border-radius: 10px;
		background: rgba(9, 7, 7, 0.55);
	}

	.voice-line.is-clean {
		border-left: 3px solid var(--voice-high);
	}

	.voice-line.is-flagged {
		border-left: 3px solid var(--voice-low);
	}

	.voice-line-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.6rem;
	}

	.voice-line-moment {
		margin: 0;
		font-size: 0.78rem;
		color: var(--voice-text-dim);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		line-height: 1.35;
	}

	.voice-line-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		flex-shrink: 0;
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-weight: 700;
		padding: 0.15rem 0.45rem;
		border-radius: 999px;
		border: 1px solid transparent;
	}

	.voice-line-badge-clean {
		color: var(--voice-high);
		border-color: rgba(34, 197, 94, 0.4);
		background: rgba(34, 197, 94, 0.08);
	}

	.voice-line-badge-flag {
		color: var(--voice-low);
		border-color: rgba(245, 158, 11, 0.4);
		background: rgba(245, 158, 11, 0.08);
	}

	.voice-line-quote {
		margin: 0;
		padding: 0.5rem 0.75rem;
		border-left: 2px solid var(--voice-card-border-strong);
		color: var(--voice-text);
		font-family: var(--font-display, serif);
		font-style: italic;
		font-size: 0.95rem;
		line-height: 1.45;
	}

	.voice-line-flags {
		list-style: disc;
		padding-left: 1.1rem;
		margin: 0;
		display: grid;
		gap: 0.2rem;
		color: var(--voice-text-dim);
		font-size: 0.82rem;
		line-height: 1.4;
	}

	.voice-line-flags li {
		margin: 0;
	}
</style>
