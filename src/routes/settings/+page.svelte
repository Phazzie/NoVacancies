<script lang="ts">
    import { onMount } from 'svelte';
    import { gameStore } from '$lib/game';
    import type { GameSettings } from '$lib/contracts';
    import { imageCreatorStore } from '$lib/client/imageCreatorState';
    import type { ImageRequestRecord, ImagePipelineSummary } from '$lib/server/ai/imagePipeline';

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
        activeCartridge?: {
            id: string;
            title: string;
            version: string;
        };
        imageGeneration?: {
            attempts: number;
            successes: number;
            failures: number;
            averageLatencyMs: number | null;
            humanDiagnostics: string[];
        };
        updatedAt: string;
    }

    let settings: GameSettings | null = null;
    let readiness: ReadinessPayload | null = null;
    let readinessError = '';
    let creatorPrompt = '';
    let imageRequest: ImageRequestRecord | null = null;
    let imageStatus: ImagePipelineSummary | null = null;
    let imageError = '';
    let imageWorking = false;

    const unsubscribe = gameStore.subscribe((state) => {
        settings = state.settings;
    });

    const unsubscribeImage = imageCreatorStore.subscribe((state) => {
        creatorPrompt = state.prompt;
        imageRequest = state.activeRequest;
        imageStatus = state.status;
        imageError = state.error;
        imageWorking = state.isWorking;
    });

    onMount(() => {
        gameStore.initialize();
        void loadReadiness();
        void imageCreatorStore.refreshStatus();
        return () => {
            unsubscribe();
            unsubscribeImage();
        };
    });

    function updateShowLessons(value: boolean): void {
        if (!settings) return;
        gameStore.updateSettings({ showLessons: value });
    }

    function updatePrompt(event: Event): void {
        const value = (event.currentTarget as HTMLTextAreaElement).value;
        imageCreatorStore.setPrompt(value);
    }

    async function generateImage(): Promise<void> {
        await imageCreatorStore.triggerAction('generate', { prompt: creatorPrompt });
    }

    async function regenerateImage(): Promise<void> {
        await imageCreatorStore.triggerAction('regenerate', { prompt: creatorPrompt });
    }

    async function applyDecision(action: 'accept' | 'reject' | 'fallback_to_static'): Promise<void> {
        if (!imageRequest?.requestId) return;
        await imageCreatorStore.triggerAction(action, { requestId: imageRequest.requestId });
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

					{#if readiness.activeCartridge || readiness.imageGeneration}
						<div class="readiness-meta-grid">
							{#if readiness.activeCartridge}
								<div>
									<div class="readiness-item-title">Active cartridge</div>
									<div class="readiness-item-detail">
										{readiness.activeCartridge.title} ({readiness.activeCartridge.id}) · v{readiness.activeCartridge.version}
									</div>
								</div>
							{/if}
							{#if readiness.imageGeneration}
								<div>
									<div class="readiness-item-title">Image generation</div>
									<div class="readiness-item-detail">
										{readiness.imageGeneration.successes}/{readiness.imageGeneration.attempts} successful
										{#if readiness.imageGeneration.averageLatencyMs !== null}
											· avg {readiness.imageGeneration.averageLatencyMs}ms
										{/if}
									</div>
								</div>
							{/if}
						</div>
					{/if}

					{#if readiness.imageGeneration?.humanDiagnostics?.length}
						<div class="readiness-diagnostics" aria-live="polite">
							<div class="readiness-item-title">Telemetry diagnostics</div>
							<ul class="hint-list">
								{#each readiness.imageGeneration.humanDiagnostics as line}
									<li>{line}</li>
								{/each}
							</ul>
						</div>
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

		<section class="settings-section" data-testid="creator-image-panel">
			<h3>Creator Image Pipeline</h3>
			<p class="hint">Generate, review, and decide whether to ship dynamic images for demo scenes.</p>

			<label for="creator-image-prompt">Scene image prompt</label>
			<textarea
				id="creator-image-prompt"
				class="input"
				rows="3"
				value={creatorPrompt}
				on:input={updatePrompt}
				placeholder="Describe an image-safe scene composition..."
			></textarea>

			<div class="toggle-row">
				<button class="btn btn-primary" on:click={generateImage} disabled={imageWorking}>Generate</button>
				<button class="btn btn-secondary" on:click={regenerateImage} disabled={imageWorking}>Regenerate</button>
			</div>

			{#if imageError}
				<p class="error-banner">{imageError}</p>
			{/if}

			{#if imageRequest}
				<div class="creator-request-card" data-testid="creator-image-status">
					<p><strong>Status:</strong> {imageRequest.status}</p>
					<p><strong>Cache key:</strong> <code>{imageRequest.cacheKey || 'n/a'}</code></p>
					<p><strong>Retries:</strong> {imageRequest.retry.attemptCount}/{imageRequest.retry.maxAttempts}</p>
					{#if imageRequest.error}
						<p><strong>Last error:</strong> {imageRequest.error.reasonCode} — {imageRequest.error.message}</p>
					{/if}
					{#if imageRequest.cacheHit}
						<p class="hint">Cache reused for this prompt.</p>
					{/if}
					<div class="toggle-row">
						<button class="btn btn-primary" on:click={() => applyDecision('accept')} disabled={imageWorking}>Accept</button>
						<button class="btn btn-secondary" on:click={() => applyDecision('reject')} disabled={imageWorking}>Reject</button>
						<button class="btn btn-secondary" on:click={() => applyDecision('fallback_to_static')} disabled={imageWorking}>
							Fallback to Static
						</button>
					</div>
				</div>
			{/if}

			{#if imageStatus}
				<p class="hint">
					Pipeline: {imageStatus.totalRequests} requests · {imageStatus.successCount} success ·
					{imageStatus.failedCount} failed · {imageStatus.cacheEntries} cached
				</p>
			{/if}
		</section>
	{/if}
</section>
