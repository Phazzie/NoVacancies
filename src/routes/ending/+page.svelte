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

<p class="ending-kicker">Story Complete</p>
<h2>Ending</h2>

{#if !ending}
	<div class="ending-empty">
		<p class="ending-empty-line">No ending has been reached in this session yet.</p>
		<p class="hint">Play through the story to arrive at a conclusion.</p>
		<div class="ending-actions" style="margin-top: 24px; justify-content: center;">
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
	.ending-kicker {
		margin: 0 0 4px;
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--accent);
		text-shadow: 0 0 20px var(--accent-glow);
	}

	.ending-empty {
		text-align: center;
		padding: 48px 20px;
	}

	.ending-empty-line {
		color: var(--text-secondary);
		font-size: 1.05rem;
		margin-bottom: 6px;
	}

	.ending-stats {
		display: flex;
		gap: 24px;
		margin-bottom: 28px;
		padding: 24px;
		background: var(--bg-elevated);
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		position: relative;
		overflow: hidden;
	}

	.ending-stats::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(232, 86, 75, 0.03) 0%, transparent 50%, rgba(62, 207, 178, 0.03) 100%);
		pointer-events: none;
	}

	.ending-stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex: 1;
		gap: 6px;
		position: relative;
	}

	.ending-stat-value {
		font-family: var(--font-display);
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--accent);
		text-shadow: 0 0 24px var(--accent-glow);
	}

	.ending-stat-label {
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--text-dim);
	}
</style>
