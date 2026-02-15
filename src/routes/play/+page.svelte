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

	function getArcLabel(count: number): string {
		if (count <= 3) return 'Opening Pressure';
		if (count <= 7) return 'Rising Pressure';
		if (count <= 11) return 'Consequence Phase';
		return 'Endgame Drift';
	}

	function getPressureLabel(count: number): string {
		if (count <= 3) return 'Tense';
		if (count <= 7) return 'Heating Up';
		if (count <= 11) return 'Unstable';
		return 'No Clean Exit';
	}

	function getArcProgress(count: number): number {
		return Math.max(8, Math.min(100, Math.round((count / 12) * 100)));
	}

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

<h2>Play</h2>
<p class="play-tagline">Quiet control. Rising pressure.</p>

{#if error}
	<p class="error-banner">{error}</p>
{/if}

{#if !scene}
	<div class="scene-loading-card">
		<p class="loading-kicker">Live Story Feed</p>
		<p>Loading scene...</p>
	</div>
{:else}
	<div class="play-grid play-command-deck" data-testid="play-command-deck">
		<section class="scene-image-wrap">
			<img class="scene-image" src={imagePath()} alt="Scene illustration" />
			<div class="image-overlay">
				<p class="image-overlay-label">Scene {sceneCount}</p>
				<p class="mode-pill" data-testid="mode-pill">AI Mode</p>
			</div>
			<div class="arc-card">
				<div class="arc-head">
					<p class="arc-label">{getArcLabel(sceneCount)}</p>
					<p class="pressure-pill">{getPressureLabel(sceneCount)}</p>
				</div>
				<div
					class="arc-track"
					role="progressbar"
					aria-label="Narrative arc progress"
					aria-valuemin="0"
					aria-valuemax="100"
					aria-valuenow={getArcProgress(sceneCount)}
				>
					<div class="arc-fill" style={`width: ${getArcProgress(sceneCount)}%`}></div>
				</div>
			</div>
		</section>

		<section class="scene-meta">
			<div class="mode-row">
				<p class="progress-text">Live Scene</p>
				<p class="mode-pill mode-pill-outline">Turn Active</p>
			</div>
			<div class="meta-chip-row">
				<p class="meta-chip">Scene {sceneCount}</p>
				<p class="meta-chip">{getArcLabel(sceneCount)}</p>
				{#if scene.mood}
					<p class="meta-chip">Mood: {scene.mood}</p>
				{/if}
			</div>
			<div class="play-utility-row">
				<button class="btn btn-secondary btn-sm" on:click={restartRun} disabled={isProcessing}>
					Restart Run
				</button>
				<a class="btn btn-secondary btn-sm" href="/debug">Open Debug</a>
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
				<p class="choice-legend">Quick keys: 1 / 2 / 3</p>
			{/if}
		</section>
	</div>
{/if}
