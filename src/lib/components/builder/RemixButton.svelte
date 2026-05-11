<script lang="ts" context="module">
	export interface RemixResponsePayload {
		draft: BuilderStoryDraft;
		source: 'ai' | 'fallback';
		lesson: { id: number; title: string };
	}
</script>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { lessons } from '$lib/narrative/lessonsCatalog';
	import type { BuilderStoryDraft } from '$lib/stories/types';

	export let draft: BuilderStoryDraft;
	export let currentLessonId: number;
	export let title: string = 'Remix with different lesson';

	type ViewState = 'idle' | 'confirming' | 'loading' | 'ready' | 'error';

	const dispatch = createEventDispatcher<{ remixed: { newDraft: BuilderStoryDraft } }>();

	let viewState: ViewState = 'idle';
	let errorMessage = '';
	let resultMessage = '';
	let lastSource: 'ai' | 'fallback' | null = null;

	$: alternativeLessons = lessons.filter((lesson) => lesson.id !== currentLessonId);
	$: defaultPickerId = alternativeLessons[0]?.id ?? null;

	let selectedLessonId: number | null = null;
	// Reset the picker default whenever the alternatives change (e.g. the
	// current lesson on the page changed) and the user has not yet picked.
	$: if (selectedLessonId === null && defaultPickerId !== null) {
		selectedLessonId = defaultPickerId;
	}
	$: if (
		selectedLessonId !== null &&
		!alternativeLessons.some((lesson) => lesson.id === selectedLessonId)
	) {
		selectedLessonId = defaultPickerId;
	}

	$: selectedLesson =
		selectedLessonId !== null
			? alternativeLessons.find((lesson) => lesson.id === selectedLessonId) ?? null
			: null;

	// Guard remix on having meaningful draft content. The empty/starter draft
	// has no real premise to remix against, so kicking off a remix from there
	// produces noise instead of a useful rewrite.
	$: hasDraftContent = Boolean(draft?.premise && draft.premise.trim().length >= 20);

	function startConfirmation(): void {
		if (selectedLesson) {
			viewState = 'confirming';
			errorMessage = '';
		}
	}

	function cancelConfirmation(): void {
		viewState = 'idle';
	}

	async function runRemix(): Promise<void> {
		if (!selectedLesson) return;
		viewState = 'loading';
		errorMessage = '';
		resultMessage = '';
		try {
			const response = await fetch('/api/builder/remix', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ draft, newLessonId: selectedLesson.id })
			});
			const payload = (await response.json().catch(() => ({}))) as Partial<
				RemixResponsePayload & { error: string }
			>;
			if (!response.ok || !payload.draft) {
				throw new Error(payload.error || `Remix failed (${response.status}).`);
			}
			lastSource = payload.source ?? null;
			resultMessage =
				payload.source === 'ai'
					? `Remixed around "${selectedLesson.title}" with Grok.`
					: `Remix fell back to your previous draft. Grok was unavailable.`;
			viewState = 'ready';
			dispatch('remixed', { newDraft: payload.draft });
		} catch (error) {
			viewState = 'error';
			errorMessage =
				error instanceof Error ? error.message : 'Remix failed unexpectedly.';
		}
	}
</script>

<section class="remix-card" aria-label={title}>
	<header class="remix-head">
		<div>
			<p class="remix-kicker">Lesson swap</p>
			<h3>{title}</h3>
		</div>
	</header>

	<p class="remix-warning">
		Remix will rewrite premise, opening prompt, system prompt, and mechanics. Your setting,
		characters, and voice ceiling will be preserved.
	</p>

	{#if alternativeLessons.length === 0}
		<p class="remix-empty">No other lessons available to remix against.</p>
	{:else}
		<label class="remix-picker" for="remix-lesson-picker">
			<span>Pick a different lesson</span>
			<select
				id="remix-lesson-picker"
				class="remix-select"
				bind:value={selectedLessonId}
				disabled={viewState === 'loading' || viewState === 'confirming'}
				data-testid="remix-lesson-picker"
			>
				{#each alternativeLessons as lesson (lesson.id)}
					<option value={lesson.id}>#{lesson.id} — {lesson.title}</option>
				{/each}
			</select>
		</label>

		{#if viewState === 'idle' || viewState === 'ready' || viewState === 'error'}
			<button
				type="button"
				class="remix-button"
				on:click={startConfirmation}
				disabled={!selectedLesson || !hasDraftContent}
				data-testid="remix-start"
			>
				Remix with this lesson
			</button>
			{#if !hasDraftContent}
				<p class="remix-empty" data-testid="remix-empty-guard">
					Generate a draft first before remixing.
				</p>
			{/if}
		{/if}

		{#if viewState === 'confirming' && selectedLesson}
			<div class="remix-confirm" role="group" aria-label="Confirm remix">
				<p class="remix-confirm-line">
					Confirm remix: rewrite premise, opening prompt, system prompt, and mechanics around
					<strong>#{selectedLesson.id} — {selectedLesson.title}</strong>? Setting, characters,
					aesthetic statement, and voice ceiling stay as you wrote them.
				</p>
				<div class="remix-confirm-actions">
					<button
						type="button"
						class="remix-button remix-button-primary"
						on:click={runRemix}
						data-testid="remix-confirm"
					>
						Yes, remix
					</button>
					<button
						type="button"
						class="remix-button remix-button-ghost"
						on:click={cancelConfirmation}
						data-testid="remix-cancel"
					>
						Cancel
					</button>
				</div>
			</div>
		{/if}

		{#if viewState === 'loading'}
			<p class="remix-status" aria-live="polite">Remixing draft around the new lesson…</p>
		{:else if viewState === 'error'}
			<p class="remix-error" role="alert">{errorMessage}</p>
		{:else if viewState === 'ready'}
			<p class="remix-status remix-status-ok" aria-live="polite">
				{resultMessage}
				{#if lastSource}
					<span class="remix-source"
						>({lastSource === 'ai' ? 'Grok remix' : 'Fallback'})</span
					>
				{/if}
			</p>
		{/if}
	{/if}
</section>

<style>
	.remix-card {
		--remix-accent: var(--accent-bright, #6366f1);
		--remix-low: var(--amber-400, #f59e0b);
		--remix-high: var(--sage-400, #22c55e);
		--remix-card-border: var(--line-soft, rgba(247, 241, 232, 0.12));
		--remix-card-border-strong: var(--line-strong, rgba(247, 241, 232, 0.22));
		--remix-text: var(--text-100, #f7f1e8);
		--remix-text-dim: var(--text-300, #b8aa9d);
		display: grid;
		gap: 0.85rem;
		padding: 1rem;
		border: 1px solid var(--remix-card-border);
		border-radius: 16px;
		background: linear-gradient(180deg, rgba(18, 12, 9, 0.92), rgba(10, 8, 7, 0.96));
		box-shadow: var(--shadow-md, 0 16px 36px rgba(0, 0, 0, 0.22));
		color: var(--remix-text);
	}

	.remix-head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.remix-head h3 {
		margin: 0.1rem 0 0;
		font-family: var(--font-display, serif);
		font-size: 1.1rem;
		color: var(--remix-text);
	}

	.remix-kicker {
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		font-size: 0.68rem;
		color: var(--remix-text-dim);
	}

	.remix-warning {
		margin: 0;
		padding: 0.75rem;
		border: 1px dashed var(--remix-card-border-strong);
		border-radius: 12px;
		color: var(--remix-text-dim);
		font-size: 0.85rem;
		line-height: 1.4;
	}

	.remix-picker {
		display: grid;
		gap: 0.35rem;
		font-size: 0.78rem;
		color: var(--remix-text-dim);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.remix-select {
		appearance: none;
		border: 1px solid var(--remix-card-border-strong);
		background: rgba(247, 241, 232, 0.04);
		color: var(--remix-text);
		font: inherit;
		text-transform: none;
		letter-spacing: normal;
		font-size: 0.9rem;
		padding: 0.45rem 0.7rem;
		border-radius: 8px;
	}

	.remix-select:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.remix-button {
		appearance: none;
		border: 1px solid var(--remix-card-border-strong);
		background: rgba(247, 241, 232, 0.04);
		color: var(--remix-text);
		font: inherit;
		font-size: 0.85rem;
		padding: 0.5rem 0.9rem;
		border-radius: 8px;
		cursor: pointer;
		transition: background 120ms ease-out, border-color 120ms ease-out;
	}

	.remix-button:hover:not(:disabled) {
		background: rgba(247, 241, 232, 0.08);
		border-color: var(--remix-accent);
	}

	.remix-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.remix-button-primary {
		background: var(--remix-accent);
		border-color: var(--remix-accent);
		color: #0a0807;
		font-weight: 600;
	}

	.remix-button-primary:hover:not(:disabled) {
		background: var(--remix-accent);
		filter: brightness(1.08);
	}

	.remix-button-ghost {
		background: transparent;
	}

	.remix-confirm {
		display: grid;
		gap: 0.7rem;
		padding: 0.85rem;
		border: 1px solid var(--remix-card-border-strong);
		border-left: 3px solid var(--remix-low);
		border-radius: 12px;
		background: rgba(245, 158, 11, 0.06);
	}

	.remix-confirm-line {
		margin: 0;
		font-size: 0.88rem;
		line-height: 1.45;
		color: var(--remix-text);
	}

	.remix-confirm-line strong {
		color: var(--remix-text);
		font-weight: 600;
	}

	.remix-confirm-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.remix-status {
		margin: 0;
		padding: 0.75rem;
		border-radius: 10px;
		border: 1px solid var(--remix-card-border-strong);
		background: rgba(9, 7, 7, 0.55);
		color: var(--remix-text);
		font-size: 0.86rem;
		line-height: 1.4;
	}

	.remix-status-ok {
		border-left: 3px solid var(--remix-high);
	}

	.remix-source {
		display: inline-block;
		margin-left: 0.35rem;
		color: var(--remix-text-dim);
		font-size: 0.78rem;
	}

	.remix-error {
		margin: 0;
		padding: 0.75rem;
		border: 1px solid var(--remix-low);
		border-radius: 10px;
		color: var(--remix-text);
		background: rgba(245, 158, 11, 0.08);
		font-size: 0.86rem;
	}

	.remix-empty {
		margin: 0;
		padding: 0.75rem;
		border: 1px dashed var(--remix-card-border-strong);
		border-radius: 10px;
		color: var(--remix-text-dim);
		font-size: 0.86rem;
	}
</style>
