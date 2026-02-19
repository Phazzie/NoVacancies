<script lang="ts">
	import { onMount } from 'svelte';
	import { appendDebugError, clearDebugErrors, readDebugErrors, type DebugErrorEntry } from '$lib/debug/errorLog';
	import type { ImagePipelineSummary } from '$lib/server/ai/imagePipeline';

	let entries: DebugErrorEntry[] = [];
	let hydrated = false;
	let imageStatus: ImagePipelineSummary | null = null;
	let imageStatusError = '';

	function refresh(): void {
		entries = readDebugErrors();
	}

	async function refreshImageStatus(): Promise<void> {
		imageStatusError = '';
		try {
			const response = await fetch('/api/image');
			if (!response.ok) throw new Error(`Failed to load image status (${response.status})`);
			const body = (await response.json()) as { status?: ImagePipelineSummary };
			imageStatus = body.status ?? null;
		} catch (error) {
			imageStatus = null;
			imageStatusError = error instanceof Error ? error.message : 'Failed to load image status';
		}
	}

	function clearAll(): void {
		clearDebugErrors();
		refresh();
	}

	function addTestEntry(): void {
		let entry: DebugErrorEntry;
		try {
			entry = appendDebugError({
				scope: 'debug.manual',
				message: 'Manual test entry',
				details: { source: 'debug-page' }
			});
		} catch (error) {
			entry = {
				id: `dbg_manual_${Date.now()}`,
				timestamp: new Date().toISOString(),
				scope: 'debug.manual',
				message: 'Manual test entry',
				details: {
					source: 'debug-page',
					appendError: error instanceof Error ? error.message : String(error)
				}
			};
		}
		refresh();

		if (!entries.some((existing) => existing.id === entry.id)) {
			entries = [entry, ...entries];
		}
	}

	onMount(() => {
		hydrated = true;
		refresh();
		void refreshImageStatus();
	});
</script>

<h2>Debug</h2>
<p class="hint">Runtime error log for play/session troubleshooting.</p>
<p class="hint" data-testid="debug-ready" aria-live="polite">{hydrated ? 'ready' : 'pending'}</p>

<div class="debug-actions">
	<button class="btn btn-secondary btn-sm" on:click={refresh}>Refresh</button>
	<button class="btn btn-secondary btn-sm" on:click={addTestEntry}>Add Test Entry</button>
	<button class="btn btn-secondary btn-sm" on:click={clearAll}>Clear Log</button>
	<button class="btn btn-secondary btn-sm" on:click={refreshImageStatus}>Refresh Image Status</button>
</div>

<section class="settings-section" data-testid="debug-image-status">
	<h3>Image Pipeline Status</h3>
	{#if imageStatusError}
		<p class="error-banner">{imageStatusError}</p>
	{:else if !imageStatus}
		<p class="hint">No image pipeline data yet.</p>
	{:else}
		<p class="hint">
			in-flight: {imageStatus.inFlight} · success: {imageStatus.successCount} · failed: {imageStatus.failedCount}
			· cache: {imageStatus.cacheEntries}
		</p>
		{#if imageStatus.recentRequests.length > 0}
			<ul class="debug-log-list">
				{#each imageStatus.recentRequests.slice(0, 5) as request}
					<li class="debug-log-item">
						<div class="debug-log-head">
							<span class="debug-scope">{request.action}</span>
							<time>{new Date(request.updatedAt).toLocaleString()}</time>
						</div>
						<p class="debug-message">{request.status} · {request.cacheKey}</p>
						{#if request.error}
							<p class="debug-message">{request.error.reasonCode}: {request.error.message}</p>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</section>

{#if entries.length === 0}
	<p class="hint">No debug errors recorded yet.</p>
{:else}
	<ul class="debug-log-list">
		{#each entries as entry}
			<li class="debug-log-item">
				<div class="debug-log-head">
					<span class="debug-scope">{entry.scope}</span>
					<time>{new Date(entry.timestamp).toLocaleString()}</time>
				</div>
				<p class="debug-message">{entry.message}</p>
				{#if entry.details}
					<pre class="debug-details">{JSON.stringify(entry.details, null, 2)}</pre>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
