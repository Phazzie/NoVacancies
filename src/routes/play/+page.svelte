<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { gameStore } from '$lib/game';
	import { getLessonById } from '$lib/narrative/lessonsCatalog';
	import type { Scene } from '$lib/contracts';

	let scene: Scene | null = null;
	let isProcessing = false;
	let error = '';
	let sceneCount = 0;
	let showLessons = true;
	let lessonDetails: ReturnType<typeof getLessonById> | null = null;

	const unsubscribe = gameStore.subscribe((state) => {
		scene = state.scene;
		isProcessing = state.isProcessing;
		error = state.error;
		sceneCount = state.gameState?.sceneCount || 0;
		showLessons = state.settings?.showLessons ?? true;
		lessonDetails =
			state.scene?.lessonId && Number.isInteger(state.scene.lessonId)
				? getLessonById(state.scene.lessonId)
				: null;
	});

	onMount(() => {
		gameStore.initialize();

		if (!scene) {
			(async () => {
				try {
					await gameStore.startGame();
				} catch {
					// error already mapped in store
				}
			})();
		}

		return () => unsubscribe();
	});

	async function choose(choiceId: string, choiceText: string): Promise<void> {
		try {
			const result = await gameStore.choose(choiceId, choiceText);
			if (result.isEnding) {
				await goto('/ending');
			}
		} catch {
			// store captures message
		}
	}

	function imagePath(): string {
		return gameStore.getImagePath(scene?.imageKey, scene?.sceneId);
	}
</script>

<h2>Play</h2>

{#if error}
	<p class="error-banner">{error}</p>
{/if}

{#if !scene}
	<p>Loading story...</p>
{:else}
	<div class="play-grid">
		<div class="scene-image-wrap">
			<img class="scene-image" src={imagePath()} alt="Scene illustration" />
		</div>

		<div class="scene-meta">
			<div class="mode-row">
				<p class="progress-text">Scene {sceneCount}</p>
				<p class="mode-pill" data-testid="mode-pill">AI Mode</p>
			</div>
			<div class="scene-text">{scene.sceneText}</div>

			{#if showLessons && scene.lessonId}
				<p class="lesson-pill">
					Lesson Insight #{scene.lessonId}
					{#if lessonDetails}
						: {lessonDetails.title}
					{/if}
				</p>
				{#if lessonDetails}
					<div class="lesson-card">
						<p class="lesson-quote">{lessonDetails.quote}</p>
						<p class="lesson-insight">{lessonDetails.insight}</p>
					</div>
				{/if}
			{:else if showLessons}
				<p class="lesson-muted">No lesson insight tagged on this scene.</p>
			{/if}

			{#if scene.choices.length === 0}
				<a class="btn btn-primary" href="/ending">View Ending</a>
			{:else}
				<div class="choices-list">
					{#each scene.choices as choice}
						<button
							class="btn btn-primary choice-btn"
							on:click={() => choose(choice.id, choice.text)}
							disabled={isProcessing}
						>
							{choice.text}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
