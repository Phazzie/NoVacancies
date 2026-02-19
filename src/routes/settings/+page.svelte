<script lang="ts">
	import { onMount } from 'svelte';
	import { gameStore } from '$lib/game';
	import { imageCreatorStore } from '$lib/client/imageCreatorState';
	import type { GameSettings } from '$lib/contracts';
	import type { ImageRequestRecord, ImagePipelineSummary } from '$lib/server/ai/imagePipeline';

	let settings: GameSettings | null = null;
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
</script>

<h2>Settings</h2>

{#if !settings}
	<p>Loading settings...</p>
{:else}
	<section class="settings-section">
		<h3>Story Mode</h3>
		<p class="hint">AI Generated only. No mock fallback path is active.</p>
	</section>

	<section class="settings-section">
		<h3>Lesson Insights</h3>
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
			<div class="creator-pipeline-summary" data-testid="creator-image-summary">
				<p>
					<strong>Pipeline:</strong> {imageStatus.inFlight} in-flight / {imageStatus.successCount} success /
					{imageStatus.failedCount} failed / cache {imageStatus.cacheEntries}
				</p>
			</div>
		{/if}
	</section>
{/if}
