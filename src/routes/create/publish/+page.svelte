<script lang="ts">
	import { onDestroy } from 'svelte';
	import { creatorStore } from '$lib/creator/store';
	import type { CreatorWorkspaceState } from '$lib/creator/storyBuilder';

	let state: CreatorWorkspaceState | null = null;
	const unsubscribe = creatorStore.subscribe((value) => {
		state = value;
	});

	$: validation = state ? creatorStore.getValidation(state) : { isReady: false, errors: [] as string[] };

	onDestroy(() => {
		unsubscribe();
	});

	function publish(): void {
		creatorStore.publish();
	}

	function unpublish(): void {
		creatorStore.unpublish();
	}
</script>

{#if state}
	<section class="creator-card">
		<h3>Publish / unpublish versions</h3>
		<p class="hint">Publishing snapshots the current draft as an immutable version for play mode rollout.</p>

		<div class="publish-actions">
			<button class="btn btn-primary" on:click={publish} disabled={!validation.isReady}>Publish New Version</button>
			<button class="btn btn-secondary" on:click={unpublish} disabled={state.publish.activeVersion === null}
				>Unpublish Active Version</button
			>
		</div>

		{#if validation.errors.length > 0}
			<div class="validation-list" role="alert">
				<strong>Cannot publish yet:</strong>
				<ul>
					{#each validation.errors as error}
						<li>{error}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div class="version-list">
			<h4>Version history</h4>
			{#if state.publish.versions.length === 0}
				<p class="hint">No published versions yet.</p>
			{:else}
				<ul>
					{#each state.publish.versions as version}
						<li class:active-version={state.publish.activeVersion === version.version}>
							<div>
								<strong>v{version.version}</strong>
								<span> · {new Date(version.publishedAt).toLocaleString()}</span>
							</div>
							<p>{version.snapshot.title}</p>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</section>
{/if}
