<script lang="ts">
	import { creatorStore } from '$lib/creator/store';
	import { listTemplateOptions } from '$lib/creator/storyBuilder';

	const templates = listTemplateOptions();
	let selected = 'blank';

	function apply(): void {
		creatorStore.setTemplate(selected);
	}
</script>

<section class="creator-card">
	<h3>Start from a template</h3>
	<p class="hint">Templates overwrite your current draft fields, but never touch published versions.</p>

	<div class="template-list" role="radiogroup" aria-label="Story template choices">
		{#each templates as template}
			<label class="template-option">
				<input type="radio" name="template" bind:group={selected} value={template.id} />
				<div>
					<strong>{template.label}</strong>
					<p>{template.summary}</p>
				</div>
			</label>
		{/each}
	</div>

	<button class="btn btn-primary" on:click={apply}>Apply Template to Draft</button>
</section>
