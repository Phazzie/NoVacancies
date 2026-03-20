<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import '../app.css';
	import { registerPwaServiceWorker } from '$lib/client/pwa';
	import { getSafeActiveStoryCartridge } from '$lib/stories';

	const activeStory = getSafeActiveStoryCartridge();
	const shellStoryTitle = activeStory?.title ?? 'Story Configuration Blocked';
	const shellPresentation = activeStory?.presentation ?? {
		metaDescription:
			'The selected story cartridge could not be loaded. Check the demo readiness panel for configuration details.',
		shellKicker: 'Story engine / configuration blocked'
	};

	onMount(() => {
		registerPwaServiceWorker();
	});
</script>

<svelte:head>
	<title>{shellStoryTitle}</title>
	<meta
		name="description"
		content={shellPresentation.metaDescription}
	/>
</svelte:head>

<div class="app-shell">
	<a class="skip-link" href="#page-content">Skip to content</a>
	<header class="shell-bar">
		<a class="brand-lockup" href="/">
			<span class="brand-kicker">{shellPresentation.shellKicker}</span>
			<span class="brand-name">{shellStoryTitle}</span>
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
				href="/builder"
				class:active={$page.url.pathname === '/builder'}
				aria-current={$page.url.pathname === '/builder' ? 'page' : undefined}
			>
				<span class="route-index">03</span>
				<span>Builder</span>
			</a>
			<a
				href="/settings"
				class:active={$page.url.pathname === '/settings'}
				aria-current={$page.url.pathname === '/settings' ? 'page' : undefined}
			>
				<span class="route-index">04</span>
				<span>Settings</span>
			</a>
			<a
				href="/ending"
				class:active={$page.url.pathname === '/ending'}
				aria-current={$page.url.pathname === '/ending' ? 'page' : undefined}
			>
				<span class="route-index">05</span>
				<span>Ending</span>
			</a>
			<a
				href="/debug"
				class:active={$page.url.pathname === '/debug'}
				aria-current={$page.url.pathname === '/debug' ? 'page' : undefined}
			>
				<span class="route-index">06</span>
				<span>Debug</span>
			</a>
		</nav>
	</header>

	<main id="page-content" class="page-frame">
		<slot />
	</main>
</div>
