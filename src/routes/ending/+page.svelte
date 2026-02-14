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

	function formatDuration(ms: number): string {
		const seconds = Math.round(ms / 1000);
		if (seconds < 60) return `${seconds}s`;
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}m ${remainingSeconds}s`;
	}
</script>

{#if !ending}
	<div class="ending-empty">
		<p class="ending-empty-text">No ending reached yet.</p>
		<p class="hint">Play through the story to arrive at a conclusion.</p>
		<div class="ending-actions" style="margin-top: 28px;">
			<a class="btn btn-primary" href="/play">Go to Play</a>
			<a class="btn btn-secondary" href="/debug">Debug</a>
		</div>
	</div>
{:else}
	<div class="ending-wrap">
		<p class="ending-badge">Story Complete</p>
		<h2 class="ending-type">{ending.endingType}</h2>

		<div class="ending-stats">
			<div class="ending-stat">
				<span class="ending-stat-number">{ending.stats.sceneCount}</span>
				<span class="ending-stat-label">Scenes</span>
			</div>
			<div class="ending-stat">
				<span class="ending-stat-number">{ending.stats.lessonsCount}</span>
				<span class="ending-stat-label">Insights</span>
			</div>
			<div class="ending-stat">
				<span class="ending-stat-number">{formatDuration(ending.stats.durationMs)}</span>
				<span class="ending-stat-label">Duration</span>
			</div>
		</div>

		<div class="ending-actions">
			<button class="btn btn-primary" on:click={playAgain}>Play Again</button>
			<a class="btn btn-secondary" href="/play">Back to Play</a>
			<a class="btn btn-secondary" href="/debug">Debug</a>
		</div>
	</div>
{/if}
