<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import '../app.css';
	import { registerPwaServiceWorker } from '$lib/client/pwa';
	import { getSafeActiveStoryCartridge } from '$lib/stories';
	import { selectStoryPresentation } from '$lib/stories/selectors';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	const activeStory = getSafeActiveStoryCartridge();
	const shellStoryTitle = activeStory?.title ?? 'Story Configuration Blocked';
	const shellPresentation = selectStoryPresentation(activeStory, {
		metaDescription:
			'The selected story cartridge could not be loaded. Check the demo readiness panel for configuration details.',
		shellKicker: 'Story engine / configuration blocked',
		homeKicker: 'Interactive fiction / configuration blocked',
		homeSubtitle: 'Check Story Selection',
		homeTagline: 'Unable to resolve active story cartridge.',
		homeSupportCopy: 'Visible shell copy is running in fallback mode until configuration is fixed.',
		storyBriefItems: ['Check Story Selection in settings to resolve cartridge configuration.']
	});

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
			{#if $page.url.pathname === '/debug'}
				<a href="/debug" class:active={true} aria-current="page">
					<span class="route-index">06</span>
					<span>Debug</span>
				</a>
			{/if}
			{#if data.sessionUser}
				<form method="POST" action="/api/auth/logout" class="sign-out-form">
					<button type="submit" class="sign-out-btn" title="Signed in as {data.sessionUser.role}">
						Sign out
					</button>
				</form>
			{/if}
		</nav>
	</header>

	<main id="page-content" class="page-frame">
		<slot />
	</main>
</div>

<style>
	.sign-out-form {
		display: contents;
	}

	.sign-out-btn {
		background: none;
		border: 1px solid currentColor;
		border-radius: 3px;
		color: inherit;
		cursor: pointer;
		font-family: inherit;
		font-size: 0.75rem;
		letter-spacing: 0.04em;
		opacity: 0.55;
		padding: 0.2em 0.6em;
		transition: opacity 0.15s;
	}

	.sign-out-btn:hover {
		opacity: 1;
	}
</style>
