<script lang="ts">
    import { builderStore } from '$lib/client/builderStore';

    let isSaving = false;

    function save() {
        isSaving = true;
        builderStore.save().then(() => {
            isSaving = false;
        });
    }
</script>

<h1>Opening Scene Prompt</h1>
<p class="description">
    Describe the starting situation. Who is there? What is happening? What is the immediate conflict?
    The AI will use this to generate the first scene.
</p>

<div class="editor-container">
    <textarea
        bind:value={$builderStore.openingPrompt}
        placeholder="Establish the time, place, and situation..."
    ></textarea>
</div>

<div class="actions">
    <button on:click={save} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Prompt'}
    </button>
</div>

<style>
    .description {
        color: #aaa;
        margin-bottom: 1rem;
    }
    .editor-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 400px;
    }
    textarea {
        flex: 1;
        background: #222;
        color: #eee;
        padding: 1rem;
        border: 1px solid #444;
        border-radius: 4px;
        font-family: monospace;
        font-size: 1rem;
        line-height: 1.5;
        resize: vertical;
    }
    .actions {
        margin-top: 1rem;
    }
    button {
        padding: 0.5rem 1rem;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    button:disabled {
        background: #555;
        cursor: not-allowed;
    }
</style>
