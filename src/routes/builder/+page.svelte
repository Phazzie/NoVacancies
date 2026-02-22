<script lang="ts">
    import { onMount } from 'svelte';
    import { storyLibrary } from '$lib/client/storyStore';
    import { localStoryRepository } from '$lib/client/storyStore';
    import { goto } from '$app/navigation';
    import type { StoryConfig } from '$lib/contracts/story';

    // Auto-subscribe to the store
    let stories: StoryConfig[] = [];
    storyLibrary.subscribe(value => {
        stories = value;
    });

    onMount(async () => {
        await storyLibrary.load();
    });

    function createNew() {
        const id = crypto.randomUUID();
        const newStory: StoryConfig = {
            id,
            title: 'Untitled Story',
            author: 'Anonymous',
            premise: 'A new story begins...',
            genre: 'General',
            theme: {
                primaryColor: '#ffffff',
                secondaryColor: '#000000',
                backgroundColor: '#1a1a1a',
                fontFamily: 'sans-serif'
            },
            characters: [],
            openingPrompt: '',
            mechanics: [],
            endingRules: []
        };
        storyLibrary.save(newStory).then(() => {
            goto(`/builder/${id}/info`);
        });
    }

    async function deleteStory(id: string) {
        if (confirm('Are you sure you want to delete this story?')) {
            await storyLibrary.delete(id);
        }
    }
</script>

<div class="builder-home">
    <h1>Your Stories</h1>
    <div class="toolbar">
        <button on:click={createNew} class="btn-primary">Create New Story</button>
    </div>

    {#if stories.length === 0}
        <p class="empty-state">No stories found. Create one to get started!</p>
    {:else}
        <div class="story-grid">
            {#each stories as story (story.id)}
                <div class="story-card" style="border-left: 4px solid {story.theme?.primaryColor || '#666'}">
                    <h2>{story.title}</h2>
                    <p class="author">by {story.author}</p>
                    <p class="premise">{story.premise || 'No premise set.'}</p>
                    <div class="actions">
                        <a href={`/builder/${story.id}/info`} class="btn-secondary">Edit</a>
                        <a href={`/play?storyId=${story.id}&source=local`} class="btn-secondary">Play</a>
                        <button on:click={() => deleteStory(story.id)} class="btn-danger">Delete</button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .builder-home {
        padding: 2rem;
        color: white;
        max-width: 1200px;
        margin: 0 auto;
    }
    .toolbar {
        margin-bottom: 2rem;
    }
    .story-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
    }
    .story-card {
        background: #2a2a2a;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        display: flex;
        flex-direction: column;
    }
    h2 { margin: 0 0 0.5rem 0; font-size: 1.5rem; }
    .author { color: #888; font-size: 0.9rem; margin-bottom: 1rem; }
    .premise { color: #ccc; flex: 1; margin-bottom: 1.5rem; line-height: 1.4; }

    .actions {
        display: flex;
        gap: 0.5rem;
        margin-top: auto;
    }
    .btn-primary, .btn-secondary, .btn-danger {
        padding: 0.5rem 1rem;
        border: none;
        cursor: pointer;
        text-decoration: none;
        color: white;
        border-radius: 4px;
        font-weight: bold;
        text-align: center;
    }
    .btn-primary { background: #007bff; }
    .btn-secondary { background: #444; flex: 1; }
    .btn-secondary:hover { background: #555; }
    .btn-danger { background: #dc3545; }
    .btn-danger:hover { background: #c82333; }
</style>
