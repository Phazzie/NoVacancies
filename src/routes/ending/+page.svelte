<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { gameStore } from '$lib/game';
	import type { EndingPayload } from '$lib/game';

	let ending: EndingPayload | null = null;

	const unsubscribe = gameStore.subscribe((state) => {
		ending = state.ending as EndingPayload | null;
	});

	onMount(() => {
		gameStore.initialize();
		return () => unsubscribe();
	});

	async function playAgain(): Promise<void> {
		await gameStore.startGame();
		await goto('/play');
	}
</script>

<h2>Ending</h2>

{#if !ending}
	<p>No ending has been reached in this session yet.</p>
	<div class="ending-actions">
		<a class="btn btn-primary" href="/play">Go to Play</a>
		<a class="btn btn-secondary" href="/debug">Open Debug (Temp)</a>
	</div>
{:else}
	<div class="ending-card">
		<p class="ending-title">{ending.endingType}</p>
		<p>Scenes: {ending.stats.sceneCount}</p>
		<p>Insights: {ending.stats.lessonsCount}</p>
		<p>Duration: {Math.round(ending.stats.durationMs / 1000)}s</p>

		<div class="ending-actions">
			<button class="btn btn-primary" on:click={playAgain}>Play Again</button>
			<a class="btn btn-secondary" href="/play">Back to Play</a>
			<a class="btn btn-secondary" href="/debug">Open Debug (Temp)</a>
		</div>
	</div>
{/if}
