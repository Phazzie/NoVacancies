<script lang="ts">
    import { builderStore } from '$lib/client/builderStore';
    import type { Character } from '$lib/contracts/story';

    let selectedIndex: number | null = null;
    let editMode = false;
    let draftCharacter: Character | null = null;

    function select(index: number) {
        selectedIndex = index;
        draftCharacter = { ...$builderStore.characters[index] };
        editMode = true;
    }

    function createNew() {
        draftCharacter = {
            id: crypto.randomUUID(),
            name: 'New Character',
            role: 'Support',
            description: '',
            referenceImagePrompt: ''
        };
        selectedIndex = null;
        editMode = true;
    }

    function save() {
        if (!draftCharacter) return;
        if (selectedIndex !== null) {
            builderStore.updateCharacter(selectedIndex, draftCharacter);
        } else {
            builderStore.addCharacter(draftCharacter);
        }
        editMode = false;
        draftCharacter = null;
        selectedIndex = null;
    }

    function cancel() {
        editMode = false;
        draftCharacter = null;
        selectedIndex = null;
    }

    function remove(index: number) {
        if (confirm('Delete this character?')) {
            builderStore.removeCharacter(index);
            if (selectedIndex === index) cancel();
        }
    }
</script>

<h1>Characters</h1>

{#if !editMode}
    <button on:click={createNew} class="btn-primary">Add Character</button>
    <div class="list">
        {#each $builderStore.characters as char, index}
            <div class="item">
                <div class="info">
                    <strong>{char.name}</strong> ({char.role})
                    <p>{char.description}</p>
                </div>
                <div class="actions">
                    <button on:click={() => select(index)}>Edit</button>
                    <button on:click={() => remove(index)} class="btn-danger">Delete</button>
                </div>
            </div>
        {/each}
    </div>
{:else if draftCharacter}
    <div class="editor">
        <h2>{selectedIndex !== null ? 'Edit Character' : 'New Character'}</h2>

        <div class="form-group">
            <label for="name">Name</label>
            <input id="name" bind:value={draftCharacter.name} />
        </div>

        <div class="form-group">
            <label for="role">Role</label>
            <input id="role" bind:value={draftCharacter.role} placeholder="e.g. Protagonist, Antagonist..." />
        </div>

        <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" bind:value={draftCharacter.description} rows="3"></textarea>
        </div>

        <div class="form-group">
            <label for="imagePrompt">Visual Description (AI Prompt)</label>
            <textarea id="imagePrompt" bind:value={draftCharacter.referenceImagePrompt} rows="3" placeholder="Describe appearance for image generation..."></textarea>
        </div>

        <div class="editor-actions">
            <button on:click={save} class="btn-primary">Save</button>
            <button on:click={cancel}>Cancel</button>
        </div>
    </div>
{/if}

<style>
    .list { margin-top: 1rem; }
    .item {
        background: #333;
        padding: 1rem;
        margin-bottom: 0.5rem;
        border-radius: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .info p { margin: 0; color: #aaa; font-size: 0.9rem; }
    .actions { display: flex; gap: 0.5rem; }
    .editor {
        background: #2a2a2a;
        padding: 2rem;
        border-radius: 8px;
        margin-top: 1rem;
    }
    .form-group { margin-bottom: 1rem; }
    label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
    input, textarea { width: 100%; padding: 0.5rem; background: #222; border: 1px solid #444; color: white; }
    .editor-actions { margin-top: 1rem; display: flex; gap: 1rem; }
    .btn-primary { background: #007bff; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; }
    .btn-danger { background: #dc3545; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; }
</style>
