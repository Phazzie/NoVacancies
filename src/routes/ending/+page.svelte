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

<h2>Ending</h2>

{#if !ending}
	<div class="ending-empty">
		<p class="hint" style="margin-bottom: 20px;">No ending has been reached in this session yet.</p>
		<div class="ending-actions">
			<a class="btn btn-primary" href="/play">Go to Play</a>
			<a class="btn btn-secondary" href="/debug">Open Debug</a>
		</div>
	</div>
{:else}
	<div class="ending-card">
		<p class="ending-title">{ending.endingType}</p>

		<div class="ending-stats">
			<div class="ending-stat">
				<span class="ending-stat-value">{ending.stats.sceneCount}</span>
				<span class="ending-stat-label">Scenes</span>
			</div>
			<div class="ending-stat">
				<span class="ending-stat-value">{ending.stats.lessonsCount}</span>
				<span class="ending-stat-label">Insights</span>
			</div>
			<div class="ending-stat">
				<span class="ending-stat-value">{formatDuration(ending.stats.durationMs)}</span>
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

<style>
	.ending-empty {
		text-align: center;
		padding: 32px 0;
	}

	.ending-stats {
		display: flex;
		gap: 24px;
		margin-bottom: 24px;
		padding: 20px;
		background: var(--bg-elevated);
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
	}

	.ending-stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex: 1;
		gap: 4px;
	}

	.ending-stat-value {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--accent);
	}

	.ending-stat-label {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-dim);
	}
</style>
