<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import '../app.css';
	import { registerPwaServiceWorker } from '$lib/client/pwa';

	onMount(() => {
		registerPwaServiceWorker();
	});
</script>

<svelte:head>
	<title>No Vacancies</title>
	<meta name="description" content="An interactive fiction about invisible labor, pressure, and what finally changes." />
</svelte:head>

<div class="app-shell">
	<nav class="motel-sign" aria-label="Primary navigation">
		<a href="/" class="motel-brand">No Vacancies</a>
		<div class="motel-nav">
			<a href="/" class:active={$page.url.pathname === '/'} data-label="Home" aria-label="Home">H</a>
			<a href="/play" class:active={$page.url.pathname === '/play'} data-label="Play" aria-label="Play">P</a>
			<a href="/settings" class:active={$page.url.pathname === '/settings'} data-label="Settings" aria-label="Settings">S</a>
			<a href="/ending" class:active={$page.url.pathname === '/ending'} data-label="Ending" aria-label="Ending">E</a>
			<a href="/debug" class:active={$page.url.pathname === '/debug'} data-label="Debug" aria-label="Debug">D</a>
		</div>
	</nav>

	<main class="page-frame">
		<slot />
	</main>
</div>
