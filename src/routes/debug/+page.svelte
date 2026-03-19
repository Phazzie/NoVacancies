<script lang="ts">
	import { onMount } from 'svelte';
	import { appendDebugError, clearDebugErrors, readDebugErrors, type DebugErrorEntry } from '$lib/debug/errorLog';

	let entries: DebugErrorEntry[] = [];
	let hydrated = false;

	function refresh(): void {
		entries = readDebugErrors();
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
	});
</script>

<section class="utility-page utility-page-debug">
	<header class="page-intro">
		<p class="card-kicker">Operator console</p>
		<h2>Debug</h2>
		<p class="lede">Runtime error log for play and session troubleshooting.</p>
	</header>

	<section class="debug-console">
		<p class="debug-status" data-testid="debug-ready" aria-live="polite">
			{hydrated ? 'ready' : 'pending'}
		</p>

		<div class="debug-actions">
			<button class="btn btn-secondary btn-sm" on:click={refresh}>Refresh</button>
			<button class="btn btn-secondary btn-sm" on:click={addTestEntry}>Add Test Entry</button>
			<button class="btn btn-secondary btn-sm" on:click={clearAll}>Clear Log</button>
		</div>

		{#if entries.length === 0}
			<div class="debug-empty">
				<p class="hint">No debug errors recorded yet.</p>
			</div>
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
	</section>
</section>
