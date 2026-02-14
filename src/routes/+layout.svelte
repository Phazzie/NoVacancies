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
	<main class="page-content">
		<slot />
	</main>

	<nav class="nav-pill" aria-label="Primary navigation">
		<a href="/" class:active={$page.url.pathname === '/'}>Home</a>
		<a href="/play" class:active={$page.url.pathname === '/play'}>Play</a>
		<a href="/settings" class:active={$page.url.pathname === '/settings'}>Settings</a>
		<a href="/ending" class:active={$page.url.pathname === '/ending'}>Ending</a>
		<a href="/debug" class:active={$page.url.pathname === '/debug'}>Debug</a>
	</nav>
</div>
