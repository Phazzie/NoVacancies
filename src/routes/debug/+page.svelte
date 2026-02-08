<script lang="ts">
	import { onMount } from 'svelte';
	import { appendDebugError, clearDebugErrors, readDebugErrors, type DebugErrorEntry } from '$lib/debug/errorLog';

	let entries: DebugErrorEntry[] = [];

	function refresh(): void {
		entries = readDebugErrors();
	}

	function clearAll(): void {
		clearDebugErrors();
		refresh();
	}

	function addTestEntry(): void {
		appendDebugError({
			scope: 'debug.manual',
			message: 'Manual test entry',
			details: { source: 'debug-page' }
		});
		refresh();
	}

	onMount(() => {
		refresh();
	});
</script>

<h2>Debug</h2>
<p class="hint">Runtime error log for play/session troubleshooting.</p>

<div class="debug-actions">
	<button class="btn btn-secondary btn-sm" on:click={refresh}>Refresh</button>
	<button class="btn btn-secondary btn-sm" on:click={addTestEntry}>Add Test Entry</button>
	<button class="btn btn-secondary btn-sm" on:click={clearAll}>Clear Log</button>
</div>

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
