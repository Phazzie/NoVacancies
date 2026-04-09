<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { gameStore } from '$lib/game';
	import type { EndingPayload } from '$lib/game';
	import type { PageData } from './$types';

	export let data: PageData;

	let ending: EndingPayload | null = null;
	let shareUrl = '';
	let shareCopied = false;
	let shareFailed = false;
	let shareUrlVisible = false;

	const unsubscribe = gameStore.subscribe((state) => {
		ending = state.ending as EndingPayload | null;
	});

	onMount(() => {
		gameStore.initialize();
		return () => unsubscribe();
	});

	// Deterministic precedence: active in-memory ending wins; URL params (from SSR load) are fallback.
	$: activeEnding = ending ?? data.urlEnding;

	$: if (activeEnding) {
		const params = new URLSearchParams({
			type: activeEnding.endingType,
			scenes: String(activeEnding.stats.sceneCount),
			lessons: String(activeEnding.stats.lessonsCount),
			duration: String(Math.floor(activeEnding.stats.durationMs / 60_000))
		});
		shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/ending?${params.toString()}`;
	}

	function formatDuration(ms: number): string {
		const seconds = Math.round(ms / 1000);
		if (seconds < 60) return `${seconds}s`;
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}m ${remainingSeconds}s`;
	}

	async function playAgain(): Promise<void> {
		await gameStore.startGame();
		await goto('/play');
	}

	async function copyShareUrl(): Promise<void> {
		shareCopied = false;
		shareFailed = false;
		shareUrlVisible = false;

		try {
			await navigator.clipboard.writeText(shareUrl);
			shareCopied = true;
			setTimeout(() => { shareCopied = false; }, 2000);
		} catch {
			// Clipboard unavailable or denied — show URL for manual copy
			shareFailed = true;
			shareUrlVisible = true;
		}
	}
</script>

<section class="ending-page">
	{#if !activeEnding}
		<div class="ending-empty">
			<p class="card-kicker">No ending logged</p>
			<h2>Ending</h2>
			<p class="ending-empty-copy">No ending has been reached in this session yet.</p>
			<div class="ending-actions">
				<a class="btn btn-primary" href="/play">Go to Play</a>
				<a class="btn btn-secondary" href="/debug">Open Debug</a>
			</div>
		</div>
	{:else}
		<div class="ending-card">
			<p class="card-kicker">Run closed</p>
			<h2>Ending</h2>
			<p class="ending-title">{activeEnding.endingType}</p>
			<p class="ending-copy">What the room made visible this time.</p>
			<div class="ending-stats">
				<div class="ending-stat">
					<span class="ending-stat-number">{activeEnding.stats.sceneCount}</span>
					<span class="ending-stat-label">Scenes</span>
				</div>
				<div class="ending-stat">
					<span class="ending-stat-number">{activeEnding.stats.lessonsCount}</span>
					<span class="ending-stat-label">Insights</span>
				</div>
				<div class="ending-stat">
					<span class="ending-stat-number">{formatDuration(activeEnding.stats.durationMs)}</span>
					<span class="ending-stat-label">Duration</span>
				</div>
			</div>
		</div>
		<div class="ending-actions">
			<button class="btn btn-primary" on:click={playAgain}>Play Again</button>
			<button class="btn btn-secondary" on:click={copyShareUrl}>
				{#if shareCopied}Copied!{:else}Share Ending{/if}
			</button>
			{#if !ending}
				<!-- Viewing from a shared URL — no in-memory game to go back to -->
			{:else}
				<a class="btn btn-secondary" href="/play">Back to Play</a>
			{/if}
			<a class="btn btn-secondary" href="/debug">Open Debug</a>
		</div>
		{#if shareUrlVisible}
			<div class="share-fallback">
				<p class="share-fallback-label">Copy this link:</p>
				<input
					class="share-fallback-input"
					type="text"
					readonly
					value={shareUrl}
					on:click={(e) => (e.currentTarget as HTMLInputElement).select()}
				/>
			</div>
		{/if}
		{#if shareFailed}
			<p class="share-status-error">Could not access clipboard. Copy the link below:</p>
		{/if}
	{/if}
</section>
