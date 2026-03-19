<script lang="ts">
	import { onMount } from 'svelte';
	import { gameStore } from '$lib/game';
	import type { GameSettings } from '$lib/contracts';

	let settings: GameSettings | null = null;

	const unsubscribe = gameStore.subscribe((state) => {
		settings = state.settings;
	});

	onMount(() => {
		gameStore.initialize();
		return () => unsubscribe();
	});

	function updateShowLessons(value: boolean): void {
		if (!settings) return;
		gameStore.updateSettings({ showLessons: value });
	}
</script>

<section class="utility-page">
	<header class="page-intro">
		<p class="card-kicker">Runtime controls</p>
		<h2>Settings</h2>
		<p class="lede">Tune what the player sees without changing the core story flow.</p>
	</header>

	{#if !settings}
		<p class="hint">Loading settings...</p>
	{:else}
		<section class="settings-section">
			<h3>Story Mode</h3>
			<p class="hint">AI Generated only. No mock fallback path is active.</p>
		</section>

		<section class="settings-section">
			<h3>Lesson Insights</h3>
			<p class="hint">Show or hide the contextual lesson card during live play.</p>
			<div class="toggle-row">
				<button
					class="btn {settings.showLessons ? 'btn-primary' : 'btn-secondary'}"
					on:click={() => updateShowLessons(true)}
				>
					On
				</button>
				<button
					class="btn {!settings.showLessons ? 'btn-primary' : 'btn-secondary'}"
					on:click={() => updateShowLessons(false)}
				>
					Off
				</button>
			</div>
			<p class="hint">Current state: {settings.showLessons ? 'visible during play' : 'hidden during play'}.</p>
		</section>
	{/if}
</section>
