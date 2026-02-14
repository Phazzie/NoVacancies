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

<div class="settings-wrap">
	<h2 class="settings-title">Settings</h2>

	{#if !settings}
		<p class="hint">Loading settings...</p>
	{:else}
		<section class="settings-group">
			<h3>Story Mode</h3>
			<p>AI generated only. No mock fallback path is active.</p>
		</section>

		<section class="settings-group">
			<h3>Lesson Insights</h3>
			<p>Show contextual lesson cards during gameplay that reveal the emotional patterns beneath each scene.</p>
			<div class="toggle-row">
				<button
					class="btn {settings.showLessons ? 'btn-primary' : 'btn-secondary'} btn-sm"
					on:click={() => updateShowLessons(true)}
				>
					On
				</button>
				<button
					class="btn {!settings.showLessons ? 'btn-primary' : 'btn-secondary'} btn-sm"
					on:click={() => updateShowLessons(false)}
				>
					Off
				</button>
			</div>
		</section>
	{/if}
</div>
