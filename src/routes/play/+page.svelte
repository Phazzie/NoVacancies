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
	const choiceHotkeys = ['1', '2', '3'];

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


	async function triggerChoiceByIndex(index: number): Promise<void> {
		if (!scene || isProcessing || index < 0 || index >= scene.choices.length) {
			return;
		}
		const selected = scene.choices[index];
		await choose(selected.id, selected.text);
	}

	function handleChoiceHotkeys(event: KeyboardEvent): void {
		const index = Number(event.key) - 1;
		if (!Number.isInteger(index) || index < 0 || index > 2) return;
		event.preventDefault();
		void triggerChoiceByIndex(index);
	}

	onMount(() => {
		gameStore.initialize();
		window.addEventListener('keydown', handleChoiceHotkeys);

		if (!scene) {
			(async () => {
				try {
					await gameStore.startGame();
				} catch {
					// error already mapped in store
				}
			})();
		}

		return () => {
			window.removeEventListener('keydown', handleChoiceHotkeys);
			unsubscribe();
		};
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

	async function restartRun(): Promise<void> {
		if (isProcessing) return;
		try {
			await gameStore.startGame();
		} catch {
			// store captures message
		}
	}

	function imagePath(): string {
		return gameStore.getImagePath(scene?.imageKey, scene?.sceneId);
	}
</script>

{#if !scene}
	<section class:error-state={Boolean(error)} class="scene-loading">
		{#if error}
			<p class="loading-label">AI blocked</p>
			<h2 class="loading-title">Play</h2>
			<p class="loading-copy">The run cannot start until the AI service is configured.</p>
			<p class="error-banner">{error}</p>
			<div class="loading-actions">
				<a class="btn btn-secondary btn-sm" href="/settings">Open Settings</a>
				<a class="btn btn-secondary btn-sm" href="/debug">Open Debug</a>
			</div>
		{:else}
			<div class="loading-pulse" aria-hidden="true"></div>
			<p class="loading-label">Live Story Feed</p>
			<h2 class="loading-title">Play</h2>
			<p class="loading-copy">Loading the next pressure point...</p>
		{/if}
	</section>
{:else}
	<article class="story-stage" data-testid="play-command-deck">
		{#if error}
			<p class="error-banner">{error}</p>
		{/if}

		<header class="story-route-head">
			<div>
				<p class="card-kicker">Live run</p>
				<h2 class="story-route-title">Play</h2>
				<p class="story-route-tagline">Quiet control. Rising pressure.</p>
			</div>
			<div class="play-utility-row">
				<button class="btn btn-secondary btn-sm" on:click={restartRun} disabled={isProcessing}>
					Restart Run
				</button>
				<a class="btn btn-secondary btn-sm" href="/debug">Open Debug</a>
			</div>
		</header>

		<section class="scene-hero">
			<img class="scene-hero-image" src={imagePath()} alt="Scene illustration" />
			<div class="scene-hero-scrim"></div>
			<div class="scene-badge-row">
				<p class="scene-badge">Scene {sceneCount}</p>
				<p class="scene-badge scene-badge-accent" data-testid="mode-pill">AI Mode</p>
				{#if scene.mood}
					<p class="scene-badge scene-badge-muted">Mood {scene.mood}</p>
				{/if}
			</div>
		</section>

		<section class="story-body">
			<div class="story-meta-row">
				<p class="story-meta-chip">Turn Active</p>
				<p class="story-meta-chip">Scene {sceneCount}</p>
			</div>

			<div class="scene-text">{scene.sceneText}</div>

			{#if showLessons && scene.lessonId}
				<section class="lesson-card">
					<p class="lesson-pill">
						Lesson Insight #{scene.lessonId}
						{#if lessonDetails}
							: {lessonDetails.title}
						{/if}
					</p>
					{#if lessonDetails}
						<p class="lesson-quote">{lessonDetails.quote}</p>
						<p class="lesson-insight">{lessonDetails.insight}</p>
					{/if}
				</section>
			{:else if showLessons}
				<p class="lesson-muted">No lesson insight tagged on this scene.</p>
			{/if}

			{#if scene.choices.length === 0}
				<a class="btn btn-primary" href="/ending">View Ending</a>
			{:else}
				<section class="choices-panel">
					<div class="choices-head">
						<p class="card-kicker">Choose the next pressure point</p>
						<p class="choice-legend">Quick keys: 1 / 2 / 3</p>
					</div>
					<div class="choices-list">
					{#each scene.choices as choice, index}
						<button
							class="btn btn-primary choice-btn"
							on:click={() => triggerChoiceByIndex(index)}
							disabled={isProcessing}
						>
							<span class="choice-hotkey">{choiceHotkeys[index]}</span>
							<span class="choice-copy">{choice.text}</span>
							<span class="choice-hint">Press {choiceHotkeys[index]}</span>
						</button>
					{/each}
					</div>
				</section>
			{/if}
		</section>
	</article>
{/if}
