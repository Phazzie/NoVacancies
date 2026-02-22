<script lang="ts">
    import { resolveImagePath } from '$lib/game/imagePaths';
    import type { StoryConfig } from '$lib/contracts/story';

    export let imageKey: string;
    export let imagePrompt: string | undefined = undefined;
    export let storyConfig: StoryConfig | null = null;

    let imageUrl: string | null = null;
    let loading = false;
    let error = '';
    let loadedPrompt: string | null = null; // Track which prompt we have loaded

    $: staticPath = resolveImagePath(imageKey);
    // Use dynamic if prompt exists AND we don't have a specific static asset override
    // (Assuming 'hotel_room.png' is the default fallback)
    $: isDynamic = !!imagePrompt && (!staticPath || staticPath.includes('placeholder') || staticPath.endsWith('hotel_room.png'));

    async function loadDynamicImage(prompt: string) {
        if (!storyConfig) return;
        loading = true;
        error = '';
        imageUrl = null; // Clear previous image while loading

        const characterRefs = (storyConfig.characters || [])
            .map(c => `${c.name}: ${c.referenceImagePrompt || c.description}`)
            .join('. ');

        const fullPrompt = `${prompt}. Characters: ${characterRefs}. Style: ${storyConfig.genre || 'photorealistic'}. Theme colors: ${storyConfig.theme?.primaryColor || ''}.`;

        try {
            const res = await fetch('/api/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: fullPrompt })
            });

            if (!res.ok) {
                // If 503 or similar (provider disabled), fall back silently
                throw new Error(`Image generation failed: ${res.statusText}`);
            }

            const data = await res.json();
            if (data.image && (data.image.url || data.image.b64)) {
                imageUrl = data.image.url || `data:image/png;base64,${data.image.b64}`;
                loadedPrompt = prompt;
            } else {
                throw new Error('No image data returned');
            }
        } catch (e) {
            console.error(e);
            error = 'Failed to load image';
            imageUrl = staticPath; // Fallback
            loadedPrompt = prompt; // Mark as "attempted" so we don't retry endlessly
        } finally {
            loading = false;
        }
    }

    $: if (isDynamic && imagePrompt && imagePrompt !== loadedPrompt && !loading) {
        loadDynamicImage(imagePrompt);
    } else if (!isDynamic) {
        imageUrl = staticPath;
        loadedPrompt = null;
    }
</script>

<div class="image-container">
    {#if loading}
        <div class="loading-overlay">
            <div class="spinner"></div>
            <p>Generating Scene...</p>
        </div>
    {/if}

    {#if imageUrl}
        <img src={imageUrl} alt="Scene" class:blur={loading} />
    {:else}
        <div class="placeholder">
            <p>{error || 'No Image Available'}</p>
        </div>
    {/if}
</div>

<style>
    .image-container {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 300px;
        background: #111;
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: filter 0.3s;
    }
    .blur {
        filter: blur(5px);
    }
    .loading-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: white;
        z-index: 10;
    }
    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
        margin-bottom: 1rem;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    .placeholder {
        text-align: center;
        color: #666;
        padding: 1rem;
    }
</style>
