<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { gameStore } from '$lib/game';

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

<div class="home-cover">
	<p class="home-genre">Interactive Fiction</p>
	<h1 class="home-title">No Vacancies</h1>
	<p class="home-subtitle">A story about invisible labor, pressure, and what finally changes.</p>
	<div class="home-actions">
		<button class="btn btn-primary" on:click={beginStory}>Begin Story</button>
		<a class="btn btn-secondary" href="/settings">Settings</a>
	</div>
</div>

<section class="readiness-section" aria-live="polite">
	<div class="readiness-head">
		<h3>System Readiness</h3>
		<button class="btn btn-secondary btn-sm" on:click={loadReadiness}>Refresh</button>
	</div>

	{#if readinessError}
		<p class="error-banner">{readinessError}</p>
	{:else if !readiness}
		<p class="hint">Checking systems...</p>
	{:else}
		<div class="readiness-progress-wrap">
			<div class="readiness-progress-label">
				<span>{readiness.score}%</span>
				<span class="readiness-status readiness-{readiness.status}">
					{readiness.status.toUpperCase()}
				</span>
			</div>
			<div class="readiness-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={readiness.score}>
				<div class="readiness-progress-fill readiness-{readiness.status}" style={`width: ${readiness.score}%`}></div>
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
