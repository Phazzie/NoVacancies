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
	<meta
		name="description"
		content="A motel-noir interactive narrative about invisible labor, pressure, and what finally changes."
	/>
</svelte:head>

<div class="app-shell">
	<a class="skip-link" href="#page-content">Skip to content</a>
	<header class="shell-bar">
		<a class="brand-lockup" href="/">
			<span class="brand-kicker">Daily-rate motel / live narrative build</span>
			<span class="brand-name">No Vacancies</span>
		</a>
		<nav class="route-nav" aria-label="Primary navigation">
			<a
				href="/"
				class:active={$page.url.pathname === '/'}
				aria-current={$page.url.pathname === '/' ? 'page' : undefined}
			>
				<span class="route-index">01</span>
				<span>Home</span>
			</a>
			<a
				href="/play"
				class:active={$page.url.pathname === '/play'}
				aria-current={$page.url.pathname === '/play' ? 'page' : undefined}
			>
				<span class="route-index">02</span>
				<span>Play</span>
			</a>
			<a
				href="/settings"
				class:active={$page.url.pathname === '/settings'}
				aria-current={$page.url.pathname === '/settings' ? 'page' : undefined}
			>
				<span class="route-index">03</span>
				<span>Settings</span>
			</a>
			<a
				href="/ending"
				class:active={$page.url.pathname === '/ending'}
				aria-current={$page.url.pathname === '/ending' ? 'page' : undefined}
			>
				<span class="route-index">04</span>
				<span>Ending</span>
			</a>
			<a
				href="/debug"
				class:active={$page.url.pathname === '/debug'}
				aria-current={$page.url.pathname === '/debug' ? 'page' : undefined}
			>
				<span class="route-index">05</span>
				<span>Debug</span>
			</a>
		</nav>
	</header>

	<main id="page-content" class="page-frame">
		<slot />
	</main>
</div>
