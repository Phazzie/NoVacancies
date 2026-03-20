<script lang="ts">
	import { goto } from '$app/navigation';
	import { gameStore } from '$lib/game';
	import { getSafeActiveStoryCartridge } from '$lib/stories';

	const activeStory = getSafeActiveStoryCartridge();
	const homeStoryTitle = activeStory?.title ?? 'Story Configuration Blocked';
	const presentation = activeStory?.presentation ?? {
		homeKicker: 'Interactive fiction / configuration blocked',
		homeSubtitle: 'Check Story Selection',
		homeTagline:
			'The app could not resolve the selected story cartridge. Use settings to inspect configuration.',
		homeSupportCopy:
			'Until a valid story is selected, runtime and visible branding cannot stay in sync.',
		storyBriefItems: [
			'Builder and play routes stay available for troubleshooting.',
			'Check settings to configure the active story.'
		]
	};

	function beginStory(): void {
		gameStore.clearError();
		goto('/play');
	}
</script>

<div class="home-page">
	<section class="home-hero">
		<div class="home-copy">
			<p class="home-kicker">{presentation.homeKicker}</p>
			<h1 class="home-title">{homeStoryTitle}</h1>
			<h2 class="home-subtitle">{presentation.homeSubtitle}</h2>
			<p class="home-tagline">
				{presentation.homeTagline}
			</p>
			<p class="home-support-copy">
				{presentation.homeSupportCopy}
			</p>

			<div class="home-actions">
				<button class="btn btn-primary" on:click={beginStory}>Begin Story</button>
				<a class="btn btn-secondary" href="/builder">Open Builder</a>
				<a class="btn btn-secondary" href="/settings">Open Settings</a>
			</div>
		</div>

		<div class="home-notes">
			<section class="story-brief">
				<p class="card-kicker">How it plays</p>
				<ul class="story-brief-list">
					{#each presentation.storyBriefItems as item}
						<li>{item}</li>
					{/each}
				</ul>
			</section>
		</div>
	</section>

</div>
