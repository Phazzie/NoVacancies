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

<h2>Settings</h2>

{#if !settings}
	<p>Loading settings...</p>
{:else}
	<section class="settings-section">
		<h3>Story Mode</h3>
		<p class="hint">AI Generated only. No mock fallback path is active.</p>
	</section>

	<section class="settings-section">
		<h3>Lesson Insights</h3>
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
	</section>
{/if}
