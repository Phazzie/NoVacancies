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

	function updateField(field: keyof CreatorWorkspaceState['draft'], value: string): void {
		creatorStore.patchDraft({ [field]: value });
	}

	function updateAssets(value: string): void {
		const assets = value
			.split(',')
			.map((item) => item.trim())
			.filter(Boolean);
		creatorStore.patchDraft({ assets });
	}
</script>

{#if state}
	<section class="creator-card">
		<h3>Edit metadata, prompts, and assets</h3>
		<p class="hint">Draft saves automatically in local storage and is isolated from publish history.</p>

		<label class="field">
			<span>Story title</span>
			<input
				class="text-input"
				value={state.draft.title}
				on:input={(event) => updateField('title', (event.currentTarget as HTMLInputElement).value)}
			/>
		</label>

		<label class="field">
			<span>Synopsis</span>
			<textarea
				rows="3"
				class="text-input text-area"
				value={state.draft.synopsis}
				on:input={(event) => updateField('synopsis', (event.currentTarget as HTMLTextAreaElement).value)}
			></textarea>
		</label>

		<label class="field">
			<span>Theme</span>
			<input
				class="text-input"
				value={state.draft.theme}
				on:input={(event) => updateField('theme', (event.currentTarget as HTMLInputElement).value)}
			/>
		</label>

		<label class="field">
			<span>System prompt</span>
			<textarea
				rows="4"
				class="text-input text-area"
				value={state.draft.systemPrompt}
				on:input={(event) => updateField('systemPrompt', (event.currentTarget as HTMLTextAreaElement).value)}
			></textarea>
		</label>

		<label class="field">
			<span>User prompt</span>
			<textarea
				rows="4"
				class="text-input text-area"
				value={state.draft.userPrompt}
				on:input={(event) => updateField('userPrompt', (event.currentTarget as HTMLTextAreaElement).value)}
			></textarea>
		</label>

		<label class="field">
			<span>Asset keys (comma separated)</span>
			<input
				class="text-input"
				value={state.draft.assets.join(', ')}
				on:input={(event) => updateAssets((event.currentTarget as HTMLInputElement).value)}
			/>
		</label>

		{#if validation.errors.length > 0}
			<div class="validation-list" role="status">
				<strong>Draft requirements before publish:</strong>
				<ul>
					{#each validation.errors as error}
						<li>{error}</li>
					{/each}
				</ul>
			</div>
		{:else}
			<p class="publish-ok">All validation checks pass. Draft is publish-ready.</p>
		{/if}
	</section>
{/if}
