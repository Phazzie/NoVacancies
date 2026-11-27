<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import '../app.css';
	import '../bureau.css';
	import { registerPwaServiceWorker } from '$lib/client/pwa';
	import { getSafeActiveStoryCartridge } from '$lib/stories';
	import { selectStoryPresentation } from '$lib/stories/selectors';
	import { initPosthog, capturePageview, identifyUser } from '$lib/client/analytics/posthog';
	import { env } from '$env/dynamic/public';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	const activeStory = getSafeActiveStoryCartridge();
	// The file header names No Vacancies' subject only when that cartridge is active.
	const fileSubject = activeStory?.id === 'no-vacancies' ? 'Sydney, 44' : (activeStory?.title ?? 'unknown');
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

	// Nav labels stay in the bureau's vocabulary; the route names are what tests and links rely on.
	const navItems = [
		{ href: '/', index: '§1', label: 'Summary' },
		{ href: '/play', index: '§2', label: 'Statement' },
		{ href: '/ending', index: '§3', label: 'Final Report' },
		{ href: '/builder', index: '§4', label: 'Builder' },
		{ href: '/settings', index: '§5', label: 'Preferences' }
	];

	// Track the last pathname we sent a pageview for to avoid double-firing on initial load.
	let lastTrackedPath = '';

	onMount(() => {
		registerPwaServiceWorker();

		// Initialise PostHog. No-op when PUBLIC_POSTHOG_API_KEY is absent.
		initPosthog(env.PUBLIC_POSTHOG_API_KEY);

		// Capture the initial pageview.
		lastTrackedPath = $page.url.pathname;
		capturePageview($page.url.pathname);

		// If a session user is known at load time, identify them in PostHog so
		// events are attributed correctly from the first interaction.
		if (data.sessionUser) {
			identifyUser(data.sessionUser.userId, { role: data.sessionUser.role });
		}
	});

	// Capture subsequent client-side navigations as pageviews.
	$: if (browser && $page.url.pathname !== lastTrackedPath) {
		lastTrackedPath = $page.url.pathname;
		capturePageview($page.url.pathname);
	}
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
	<header class="bu-masthead">
		<a class="bu-masthead-top" href="/">
			<span class="bu-bureau-name">Bureau of Uncredited Labor <em>{shellStoryTitle}</em></span>
			<span class="bu-file-meta">Consumer Disclosure · File No. NV-0647 · Subject: {fileSubject}</span>
		</a>
		<nav class="route-nav" aria-label="Primary navigation">
			{#each navItems as item}
				<a
					href={item.href}
					class:active={$page.url.pathname === item.href}
					aria-current={$page.url.pathname === item.href ? 'page' : undefined}
				>
					<span class="route-index">{item.index}</span>
					<span>{item.label}</span>
				</a>
			{/each}
			{#if $page.url.pathname === '/debug'}
				<a href="/debug" class:active={true} aria-current="page">
					<span class="route-index">§6</span>
					<span>Audit Log</span>
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
