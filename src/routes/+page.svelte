<script lang="ts">
	import { goto } from '$app/navigation';
	import { gameStore } from '$lib/game';

	function beginStory(): void {
		gameStore.clearError();
		goto('/play');
	}
</script>

<h2>Carry What Matters</h2>
<p class="lede">A story about invisible labor, pressure, and what finally changes.</p>

<div class="home-actions">
	<button class="btn btn-primary" on:click={beginStory}>Begin Story</button>
	<a class="btn btn-secondary" href="/settings">Open Settings</a>
</div>
