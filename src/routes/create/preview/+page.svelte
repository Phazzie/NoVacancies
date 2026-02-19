<script lang="ts">
	import { onDestroy } from 'svelte';
	import { creatorStore } from '$lib/creator/store';
	import type { CreatorWorkspaceState } from '$lib/creator/storyBuilder';

	let state: CreatorWorkspaceState | null = null;
	const unsubscribe = creatorStore.subscribe((value) => {
		state = value;
	});

	$: validation = state ? creatorStore.getValidation(state) : { isReady: false, errors: [] as string[] };

	onDestroy(() => {
		unsubscribe();
	});
</script>

<svelte:head>
	<title>Creator Preview · No Vacancies</title>
</svelte:head>

{#if state}
	<section class="creator-card">
		<h3>Preview play mode</h3>
		<p class="hint">This preview mirrors what players would enter on a new run before you publish.</p>

		<article class="preview-card">
			<p class="eyebrow">PREVIEW OPENING</p>
			<h4>{state.draft.title}</h4>
			<p>{state.draft.synopsis || 'Add a synopsis to see your opening context.'}</p>
			<div class="preview-meta">
				<span><strong>Theme:</strong> {state.draft.theme || '—'}</span>
				<span><strong>Assets:</strong> {state.draft.assets.join(', ') || '—'}</span>
			</div>
			<ol>
				<li>Work the phones before anyone wakes up.</li>
				<li>Wake Oswaldo and force an answer now.</li>
				<li>Step outside and call your own shot.</li>
			</ol>
		</article>

		{#if !validation.isReady}
			<p class="hint">Preview available, but publish remains blocked until validation is clean.</p>
		{/if}
	</section>
{/if}
