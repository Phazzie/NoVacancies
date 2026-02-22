<script lang="ts">
    import { builderStore } from '$lib/client/builderStore';
</script>

<h1>Preview Story</h1>
<p>
    Test your story in the game engine. Ensure you have saved your changes first.
</p>

<div class="preview-actions">
    <a href={`/play?storyId=${$builderStore.id}&source=local`} class="btn-primary">Launch Preview</a>
</div>

<style>
    .preview-actions {
        margin-top: 2rem;
    }
    .btn-primary {
        display: inline-block;
        padding: 1rem 2rem;
        background: #28a745;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-size: 1.2rem;
        font-weight: bold;
    }
</style>
