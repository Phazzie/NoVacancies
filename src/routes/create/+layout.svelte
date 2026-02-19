<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/stores';
	import { creatorStore } from '$lib/creator/store';
	import type { CreatorWorkspaceState } from '$lib/creator/storyBuilder';

	let state: CreatorWorkspaceState | null = null;

	const unsubscribe = creatorStore.subscribe((value) => {
		state = value;
	});

	onMount(() => {
		creatorStore.initialize();
	});

	onDestroy(() => {
		unsubscribe();
	});

	$: badge = state ? creatorStore.getBadgeStatus(state) : 'Draft';
	$: badgeClass = badge.toLowerCase();
</script>

<section class="creator-shell" aria-live="polite">
	<header class="creator-header">
		<div>
			<h2>Creator Workspace</h2>
			<p class="lede">Build safely in draft, preview your flow, and publish only validated versions.</p>
		</div>
		<span class={`status-badge ${badgeClass}`}>{badge}</span>
	</header>

	<nav class="creator-nav" aria-label="Creator navigation">
		<a href="/create/template" class:active={$page.url.pathname === '/create/template'}>1. Template</a>
		<a href="/create/editor" class:active={$page.url.pathname === '/create/editor'}>2. Edit</a>
		<a href="/create/preview" class:active={$page.url.pathname === '/create/preview'}>3. Preview</a>
		<a href="/create/publish" class:active={$page.url.pathname === '/create/publish'}>4. Publish</a>
	</nav>

	<slot />
</section>
