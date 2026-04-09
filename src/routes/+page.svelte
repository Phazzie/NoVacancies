<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { gameStore } from '$lib/game';
	import { getSafeActiveStoryCartridge } from '$lib/stories';
	import { selectStoryPresentation } from '$lib/stories/selectors';

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
		activeCartridge: {
			id: string;
			title: string;
			version: string;
		};
		imageGeneration: {
			attempts: number;
			successes: number;
			failures: number;
			averageLatencyMs: number | null;
			topRecentFailureCategories: Array<{ category: string; count: number }>;
			humanDiagnostics: string[];
		};
		updatedAt: string;
	}

	const activeStory = getSafeActiveStoryCartridge();
	const homeStoryTitle = activeStory?.title ?? 'Story Configuration Blocked';
	const presentation = selectStoryPresentation(activeStory, {
		metaDescription: 'Active story unavailable in home fallback mode.',
		shellKicker: 'Story engine / configuration blocked',
		homeKicker: 'Interactive fiction / configuration blocked',
		homeSubtitle: 'Check Story Selection',
		homeTagline:
			'The app could not resolve the selected story cartridge. Use settings to inspect configuration.',
		homeSupportCopy:
			'Until a valid story is selected, runtime and visible branding cannot stay in sync.',
		storyBriefItems: [
			'Builder and play routes stay available for troubleshooting.',
			'Check settings to configure the active story.'
		]
	});
	let readiness: ReadinessPayload | null = null;
	let readinessError = '';
	let readinessLoading = false;
	const pipelineCheckId = 'image_pipeline_status';

	async function loadReadiness(): Promise<void> {
		readinessError = '';
		readinessLoading = true;
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
		} finally {
			readinessLoading = false;
		}
	}

	onMount(() => {
		void loadReadiness();
	});

	$: failingChecks = readiness?.checks?.filter((check) => !check.ok) ?? [];
	$: pipelineCheck = readiness?.checks?.find((check) => check.id === pipelineCheckId) ?? null;

	function beginStory(): void {
		gameStore.clearError();
		goto('/play');
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
			<section class="home-readiness" data-testid="home-readiness">
				<div class="home-readiness-head">
					<p class="card-kicker">Demo readiness</p>
					<button class="btn btn-secondary btn-sm" on:click={loadReadiness} disabled={readinessLoading}>
						{readinessLoading ? 'Refreshing...' : 'Refresh'}
					</button>
				</div>
				{#if readinessError}
					<p class="error-banner">{readinessError}</p>
				{:else if !readiness}
					<p class="hint">Loading readiness summary...</p>
				{:else}
					<p class="home-readiness-status" data-testid="home-readiness-summary">
						<strong>{readiness.status.toUpperCase()}</strong>
						<span>{readiness.score}%</span>
						<span>v{readiness.activeCartridge.version}</span>
					</p>
					<p class="hint">{readiness.summary}</p>
					<div class="readiness-meta-grid">
						<div data-testid="home-active-cartridge">
							<div class="readiness-item-title">Active cartridge</div>
							<div class="readiness-item-detail">
								{readiness.activeCartridge.title} ({readiness.activeCartridge.id})
							</div>
						</div>
						<div data-testid="home-active-story">
							<div class="readiness-item-title">Active story</div>
							<div class="readiness-item-detail">{homeStoryTitle}</div>
						</div>
						<div data-testid="home-image-generation">
							<div class="readiness-item-title">Image generation</div>
							<div class="readiness-item-detail">
								{readiness.imageGeneration.successes}/{readiness.imageGeneration.attempts} successful
								{#if readiness.imageGeneration.averageLatencyMs !== null}
									· avg {readiness.imageGeneration.averageLatencyMs}ms
								{/if}
							</div>
						</div>
						{#if pipelineCheck}
							<div data-testid="home-image-pipeline">
								<div class="readiness-item-title">Image pipeline</div>
								<div class="readiness-item-detail">{pipelineCheck.details}</div>
							</div>
						{/if}
					</div>
					{#if readiness.imageGeneration.humanDiagnostics.length}
						<ul class="hint-list readiness-hints" aria-live="polite">
							{#each readiness.imageGeneration.humanDiagnostics as line}
								<li>{line}</li>
							{/each}
						</ul>
					{/if}
					{#if failingChecks.length > 0}
						<ul class="operator-issues">
							{#each failingChecks as check}
								<li>
									<strong>{check.label}:</strong> {check.details}
								</li>
							{/each}
						</ul>
					{/if}
				{/if}
			</section>
		</div>
	</section>

</div>
