<script lang="ts">
	import { onMount } from 'svelte';
	import { appendDebugError, clearDebugErrors, readDebugErrors, type DebugErrorEntry } from '$lib/debug/errorLog';

	interface DebugDiagnosticsPayload {
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

	let entries: DebugErrorEntry[] = [];
	let hydrated = false;
	let diagnostics: DebugDiagnosticsPayload | null = null;
	let diagnosticsError = '';

	function refresh(): void {
		entries = readDebugErrors();
		void loadDiagnostics();
	}

	async function loadDiagnostics(): Promise<void> {
		diagnosticsError = '';
		try {
			const response = await fetch('/api/debug/diagnostics');
			if (!response.ok) {
				throw new Error('Failed to load diagnostics');
			}
			diagnostics = (await response.json()) as DebugDiagnosticsPayload;
		} catch (error) {
			diagnostics = null;
			diagnosticsError = error instanceof Error ? error.message : 'Failed to load diagnostics';
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

		// If storage writes are unavailable (quota/privacy mode), keep the entry visible for this session.
		if (!entries.some((existing) => existing.id === entry.id)) {
			entries = [entry, ...entries];
		}
	}

	onMount(() => {
		hydrated = true;
		refresh();
		void loadDiagnostics();
	});
</script>

<h2>Debug</h2>
<p class="hint">Runtime error log for play/session troubleshooting.</p>
<p class="hint" data-testid="debug-ready" aria-live="polite">{hydrated ? 'ready' : 'pending'}</p>

<div class="debug-actions">
	<button class="btn btn-secondary btn-sm" on:click={refresh}>Refresh</button>
	<button class="btn btn-secondary btn-sm" on:click={addTestEntry}>Add Test Entry</button>
	<button class="btn btn-secondary btn-sm" on:click={clearAll}>Clear Log</button>
</div>

{#if diagnosticsError}
	<p class="error-banner">{diagnosticsError}</p>
{:else if diagnostics}
	<section class="debug-diagnostics" aria-live="polite">
		<h3>Runtime Diagnostics</h3>
		<p class="hint">
			Cartridge: {diagnostics.activeCartridge.title} ({diagnostics.activeCartridge.id}) · v{diagnostics.activeCartridge.version}
		</p>
		<ul class="hint-list">
			{#each diagnostics.imageGeneration.humanDiagnostics as line}
				<li>{line}</li>
			{/each}
		</ul>
	</section>
{/if}

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
