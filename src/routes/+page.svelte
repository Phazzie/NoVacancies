<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { gameStore } from '$lib/game';
	import { getSafeActiveStoryCartridge } from '$lib/stories';

	interface ReadinessCheck {
		id: string;
		label: string;
		ok: boolean;
		details: string;
		weight: number;
	}

	interface ReadinessPayload {
		score: number;
		status: 'ready' | 'almost' | 'blocked';
		summary: string;
		checks: ReadinessCheck[];
		updatedAt: string;
	}

	let readiness: ReadinessPayload | null = null;
	let readinessError = '';
	const activeStory = getSafeActiveStoryCartridge();
	const homeStoryTitle = activeStory?.title ?? 'Story Configuration Blocked';
	const presentation = activeStory?.presentation ?? {
		homeKicker: 'Interactive fiction / configuration blocked',
		homeSubtitle: 'Check Story Selection',
		homeTagline:
			'The app could not resolve the selected story cartridge. Use the readiness panel to inspect configuration.',
		homeSupportCopy:
			'Until a valid story is selected, runtime and visible branding cannot stay in sync.',
		storyBriefItems: [
			'Readiness can show which story id is configured and whether it loaded.',
			'Builder and play routes stay available for troubleshooting.',
			'Fix the selected story id before using this as a demo surface.'
		]
	};

	onMount(() => {
		void loadReadiness();
	});

	function beginStory(): void {
		gameStore.clearError();
		goto('/play');
	}

	async function loadReadiness(): Promise<void> {
		readinessError = '';
		try {
			const response = await fetch('/api/demo/readiness');
			if (!response.ok) {
				const body = (await response.json().catch(() => ({ error: 'Failed to load readiness' }))) as {
					error?: string;
				};
				throw new Error(body.error || 'Failed to load readiness');
			}
			readiness = (await response.json()) as ReadinessPayload;
		} catch (error) {
			readiness = null;
			readinessError = error instanceof Error ? error.message : 'Failed to load readiness';
		}
	}
</script>

<div class="home-page">
	<section class="home-hero">
		<div class="home-copy">
			<p class="home-kicker">{presentation.homeKicker}</p>
			<h1 class="home-title">{homeStoryTitle}</h1>
			<h2 class="home-subtitle">{presentation.homeSubtitle}</h2>
			<p class="home-tagline">
				{presentation.homeTagline}
			</p>
			<p class="home-support-copy">
				{presentation.homeSupportCopy}
			</p>

			<div class="home-actions">
				<button class="btn btn-primary" on:click={beginStory}>Begin Story</button>
				<a class="btn btn-secondary" href="/builder">Open Builder</a>
				<a class="btn btn-secondary" href="/settings">Open Settings</a>
			</div>
		</div>

		<div class="home-notes">
			<section class="story-brief">
				<p class="card-kicker">How it plays</p>
				<ul class="story-brief-list">
					{#each presentation.storyBriefItems as item}
						<li>{item}</li>
					{/each}
				</ul>
			</section>
		</div>
	</section>

	<section class="readiness-card" aria-live="polite">
		<div class="readiness-head">
			<div>
				<p class="card-kicker">Operator panel</p>
				<h3>Demo Readiness</h3>
			</div>
			<button class="btn btn-secondary btn-sm" on:click={loadReadiness}>Refresh</button>
		</div>

		{#if readinessError}
			<p class="error-banner">{readinessError}</p>
		{:else if !readiness}
			<p class="hint">Loading readiness checks...</p>
		{:else}
			<div class="readiness-progress-wrap">
				<div class="readiness-progress-label">
					<span>{readiness.score}%</span>
					<span class="readiness-status readiness-{readiness.status}">
						{readiness.status.toUpperCase()}
					</span>
				</div>
				<div
					class="readiness-progress-track"
					role="progressbar"
					aria-valuemin="0"
					aria-valuemax="100"
					aria-valuenow={readiness.score}
				>
					<div
						class="readiness-progress-fill readiness-{readiness.status}"
						style={`width: ${readiness.score}%`}
					></div>
				</div>
			</div>
			<p class="hint">{readiness.summary}</p>
			<ul class="readiness-list">
				{#each readiness.checks as check}
					<li class:ok={check.ok} class:notok={!check.ok}>
						<span class="readiness-mark">{check.ok ? 'PASS' : 'WAIT'}</span>
						<div>
							<div class="readiness-item-title">{check.label}</div>
							<div class="readiness-item-detail">{check.details}</div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
