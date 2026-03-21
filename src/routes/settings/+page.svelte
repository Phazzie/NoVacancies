<script lang="ts">
	import { onMount } from 'svelte';
	import { gameStore } from '$lib/game';
	import type { GameSettings } from '$lib/contracts';

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
		activeStory?: {
			id: string;
			title: string;
		};
		updatedAt: string;
	}

	let settings: GameSettings | null = null;
	let readiness: ReadinessPayload | null = null;
	let readinessError = '';

	const unsubscribe = gameStore.subscribe((state) => {
		settings = state.settings;
	});

	onMount(() => {
		gameStore.initialize();
		void loadReadiness();
		return () => unsubscribe();
	});

	function updateShowLessons(value: boolean): void {
		if (!settings) return;
		gameStore.updateSettings({ showLessons: value });
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

	$: failingChecks = readiness?.checks?.filter((check) => !check.ok) ?? [];
</script>

<section class="utility-page">
	<header class="page-intro">
		<p class="card-kicker">Runtime controls</p>
		<h2>Settings</h2>
		<p class="lede">Tune what the player sees without changing the core story flow.</p>
	</header>

	{#if !settings}
		<p class="hint">Loading settings...</p>
	{:else}
		<section class="settings-section">
			<h3>Story Mode</h3>
			<p class="hint">AI Generated only. No mock fallback path is active.</p>
		</section>

		<section class="settings-section">
			<h3>Lesson Insights</h3>
			<p class="hint">Show or hide the contextual lesson card during live play.</p>
			<div class="toggle-row">
				<button
					class="btn {settings.showLessons ? 'btn-primary' : 'btn-secondary'}"
					on:click={() => updateShowLessons(true)}
				>
					On
				</button>
				<button
					class="btn {!settings.showLessons ? 'btn-primary' : 'btn-secondary'}"
					on:click={() => updateShowLessons(false)}
				>
					Off
				</button>
			</div>
			<p class="hint">Current state: {settings.showLessons ? 'visible during play' : 'hidden during play'}.</p>
		</section>

		<section class="settings-section">
			<h3>Operator Tools</h3>
			<p class="hint">Tuck demo checks and troubleshooting behind Settings so the public surface stays lean.</p>
			<div class="toggle-row">
				<button class="btn btn-secondary btn-sm" on:click={loadReadiness}>Refresh Readiness</button>
				<a class="btn btn-secondary btn-sm" href="/debug">Open Debug</a>
			</div>

			<div class="operator-status" aria-live="polite">
				{#if readinessError}
					<p class="error-banner">{readinessError}</p>
				{:else if !readiness}
					<p class="hint">Loading readiness summary...</p>
				{:else}
					<p class="operator-summary">
						<strong>{readiness.status.toUpperCase()}</strong>
						<span>{readiness.score}% ready</span>
						{#if readiness.activeStory}
							<span>{readiness.activeStory.title}</span>
						{/if}
					</p>
					<p class="hint">{readiness.summary}</p>

					{#if failingChecks.length > 0}
						<ul class="operator-issues">
							{#each failingChecks as check}
								<li>
									<strong>{check.label}:</strong> {check.details}
								</li>
							{/each}
						</ul>
					{/if}

					<details class="operator-checks">
						<summary>Readiness checklist</summary>
						<ul class="operator-check-list">
							{#each readiness.checks as check}
								<li class:operator-check-ok={check.ok}>
									<strong>{check.ok ? 'PASS' : 'WAIT'}</strong>
									<span>{check.label}</span>
									<small>{check.details}</small>
								</li>
							{/each}
						</ul>
					</details>
				{/if}
			</div>
		</section>
	{/if}
</section>
