<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { gameStore } from '$lib/game';
    import { getLessonById } from '$lib/narrative/lessonsCatalog';
    import { localStoryRepository } from '$lib/client/storyStore';
    import DynamicDashboard from '$lib/components/DynamicDashboard.svelte';
    import AsyncSceneImage from '$lib/components/AsyncSceneImage.svelte';
    import type { Scene, GameState } from '$lib/contracts';
    import type { StoryConfig } from '$lib/contracts/story';

    let scene: Scene | null = null;
    let gameState: GameState | null = null;
    let activeConfig: StoryConfig | null = null;
    let isProcessing = false;
    let error = '';
    let sceneCount = 0;
    let showLessons = true;
    let lessonDetails: ReturnType<typeof getLessonById> | null = null;
    const choiceHotkeys = ['1', '2', '3'];

    const unsubscribe = gameStore.subscribe((state) => {
        scene = state.scene;
        gameState = state.gameState;
        activeConfig = state.activeStoryConfig;
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

        const init = async () => {
            const storyId = $page.url.searchParams.get('storyId');
            const source = $page.url.searchParams.get('source');

            if (!scene) {
                let config: StoryConfig | undefined;
                if (source === 'local' && storyId) {
                    const local = await localStoryRepository.getStory(storyId);
                    if (local) config = local;
                }

                try {
                    // Ensure initialization completes before starting game
                    await new Promise<void>(resolve => setTimeout(resolve, 0));

                    await gameStore.startGame({
                        storyId: storyId || undefined,
                        storyConfig: config || undefined
                    });
                } catch {
                    // error already mapped in store
                }
            }
        };

        void init();

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
</script>

<div class="play-container" style="
    --primary-color: {activeConfig?.theme?.primaryColor || '#ff4d4d'};
    --secondary-color: {activeConfig?.theme?.secondaryColor || '#1a1a1a'};
    --bg-color: {activeConfig?.theme?.backgroundColor || '#000000'};
    --font-family: {activeConfig?.theme?.fontFamily || 'Courier New, monospace'};
">
    <h2>{activeConfig?.title || 'Play'}</h2>
    <p class="play-tagline">{activeConfig?.premise || 'Loading story...'}</p>

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
                <!-- Using AsyncSceneImage -->
                <AsyncSceneImage
                    imageKey={scene.imageKey}
                    imagePrompt={scene.imagePrompt}
                    storyConfig={activeConfig}
                />

                <div class="image-overlay">
                    <p class="image-overlay-label">Scene {sceneCount}</p>
                    <p class="mode-pill" data-testid="mode-pill">AI Mode</p>
                </div>

                {#if gameState}
                    <div class="dashboard-wrapper">
                        <DynamicDashboard {gameState} storyConfig={activeConfig} />
                    </div>
                {/if}
            </section>

            <section class="scene-meta">
                <div class="mode-row">
                    <p class="progress-text">Live Scene</p>
                    <p class="mode-pill mode-pill-outline">Turn Active</p>
                </div>
                <div class="scene-text" style="font-family: var(--font-family)">{scene.sceneText}</div>

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
                                style="font-family: var(--font-family)"
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
</div>

<style>
    .play-container {
        background-color: var(--bg-color);
        color: #eee;
        min-height: 100vh;
        padding: 1rem;
    }

    .btn-primary {
        background-color: var(--primary-color);
    }

    .dashboard-wrapper {
        margin-top: 1rem;
    }

    :global(body) {
        background-color: var(--bg-color, black);
    }
</style>
