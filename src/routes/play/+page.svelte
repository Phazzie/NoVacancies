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

	function imagePath(): string {
		return gameStore.getImagePath(scene?.imageKey, scene?.sceneId);
	}
</script>

{#if error}
	<div style="padding: 24px;">
		<p class="error-banner">{error}</p>
	</div>
{/if}

{#if !scene}
	<div class="scene-loading">
		<p class="loading-label">Live Story</p>
		<p class="loading-text">Composing your scene...</p>
	</div>
{:else}
	<div data-testid="play-command-deck">
		<!-- Full-bleed scene image -->
		<div class="scene-banner">
			<img src={imagePath()} alt="Scene illustration" />
			<div class="scene-badges">
				<span class="badge">Scene {sceneCount}</span>
				<span class="badge badge-amber" data-testid="mode-pill">AI</span>
			</div>
			<div class="arc-bar" role="progressbar" aria-label="Narrative arc progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={getArcProgress(sceneCount)}>
				<div class="arc-bar-fill" style={`width: ${getArcProgress(sceneCount)}%`}></div>
			</div>
		</div>

		<!-- Centered story body -->
		<div class="story-body">
			<div class="story-meta">
				<span class="story-arc-label">{getArcLabel(sceneCount)}</span>
				<span class="story-pressure">{getPressureLabel(sceneCount)}</span>
			</div>

			<div class="scene-prose">{scene.sceneText}</div>

			{#if showLessons && scene.lessonId}
				<div class="lesson-aside">
					<p class="lesson-label">
						Lesson {scene.lessonId}{#if lessonDetails} &mdash; {lessonDetails.title}{/if}
					</p>
					{#if lessonDetails}
						<p class="lesson-quote">{lessonDetails.quote}</p>
						<p class="lesson-insight">{lessonDetails.insight}</p>
					{/if}
				</div>
			{:else if showLessons}
				<p class="lesson-muted">No lesson insight on this scene.</p>
			{/if}

			{#if scene.choices.length === 0}
				<a class="btn btn-primary" href="/ending" style="width: 100%; text-align: center;">View Ending</a>
			{:else}
				<div class="choices-section">
					{#each scene.choices as choice, index}
						<button
							class="choice-btn"
							on:click={() => triggerChoiceByIndex(index)}
							disabled={isProcessing}
						>
							<span class="choice-key">{choiceHotkeys[index]}</span>
							<span class="choice-text">{choice.text}</span>
							<span class="choice-shortcut">Press {choiceHotkeys[index]}</span>
						</button>
					{/each}
				</div>
				<p class="choices-hint">Quick keys: 1 / 2 / 3</p>
			{/if}
		</div>
	</div>
{/if}
