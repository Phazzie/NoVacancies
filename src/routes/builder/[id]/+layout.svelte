<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { builderStore } from '$lib/client/builderStore';
    import { localStoryRepository } from '$lib/client/storyStore';
    import { goto } from '$app/navigation';

    let loading = true;
    let storyId = $page.params.id;

    onMount(async () => {
        const story = await localStoryRepository.getStory(storyId);
        if (story) {
            builderStore.set(story);
            loading = false;
        } else {
            goto('/builder');
        }
    });

    function save() {
        builderStore.save();
    }
</script>

{#if loading}
    <p>Loading...</p>
{:else}
    <div class="builder-layout">
        <aside class="sidebar">
            <h3>Story Editor</h3>
            <nav>
                <a href={`/builder/${storyId}/info`} class:active={$page.url.pathname.endsWith('/info')}>Info</a>
                <a href={`/builder/${storyId}/characters`} class:active={$page.url.pathname.endsWith('/characters')}>Characters</a>
                <a href={`/builder/${storyId}/mechanics`} class:active={$page.url.pathname.endsWith('/mechanics')}>Mechanics</a>
                <a href={`/builder/${storyId}/opening`} class:active={$page.url.pathname.endsWith('/opening')}>Opening</a>
                <a href={`/builder/${storyId}/preview`} class:active={$page.url.pathname.endsWith('/preview')}>Preview</a>
            </nav>
            <button on:click={save} class="btn-save">Save Changes</button>
            <a href="/builder" class="back-link">Back to Library</a>
        </aside>
        <main class="content">
            <slot />
        </main>
    </div>
{/if}

<style>
    .builder-layout {
        display: flex;
        height: 100vh;
        background: #1a1a1a;
        color: #eee;
    }
    .sidebar {
        width: 250px;
        background: #2a2a2a;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        border-right: 1px solid #444;
    }
    .content {
        flex: 1;
        overflow-y: auto;
        padding: 2rem;
    }
    nav {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 2rem;
    }
    nav a {
        color: #aaa;
        text-decoration: none;
        padding: 0.5rem;
        border-radius: 4px;
    }
    nav a:hover, nav a.active {
        background: #444;
        color: white;
    }
    .btn-save {
        margin-top: auto;
        padding: 0.75rem;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    .back-link {
        margin-top: 1rem;
        color: #888;
        font-size: 0.9rem;
        text-align: center;
    }
</style>
