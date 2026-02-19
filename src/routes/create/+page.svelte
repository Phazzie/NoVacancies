<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		void goto('/create/template', { replaceState: true });
	});
</script>

<p class="hint">Redirecting to creator templates...</p>
