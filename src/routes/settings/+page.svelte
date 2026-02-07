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

	function updateUseMocks(value: boolean): void {
		if (!settings) return;
		gameStore.updateSettings({ useMocks: value });
	}

	function updateShowLessons(value: boolean): void {
		if (!settings) return;
		gameStore.updateSettings({ showLessons: value });
	}

	function updateApiKey(value: string): void {
		if (!settings) return;
		gameStore.updateSettings({ apiKey: value });
	}
</script>

<h2>Settings</h2>

{#if !settings}
	<p>Loading settings...</p>
{:else}
	<section class="settings-section">
		<h3>Story Mode</h3>
		<div class="toggle-row">
			<button
				class="btn {settings.useMocks ? 'btn-primary' : 'btn-secondary'}"
				on:click={() => updateUseMocks(true)}
			>
				Static Story
			</button>
			<button
				class="btn {!settings.useMocks ? 'btn-primary' : 'btn-secondary'}"
				on:click={() => updateUseMocks(false)}
			>
				AI Generated
			</button>
		</div>
		<p class="hint">AI mode is routed through server-side providers with mock fallback safety.</p>
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

	<section class="settings-section">
		<h3>API Key</h3>
		<input
			class="text-input"
			type="password"
			value={settings.apiKey}
			on:change={(event) => updateApiKey((event.currentTarget as HTMLInputElement).value)}
			placeholder="Enter AI key"
		/>
		<p class="hint">Stored in session storage only.</p>
	</section>
{/if}
