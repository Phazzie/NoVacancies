<script lang="ts">
    import { builderStore } from '$lib/client/builderStore';
    import type { Mechanic } from '$lib/contracts/story';

    let selectedIndex: number | null = null;
    let editMode = false;
    let draftMechanic: Mechanic | null = null;

    function select(index: number) {
        selectedIndex = index;
        draftMechanic = { ...$builderStore.mechanics[index] };
        editMode = true;
    }

    function createNew() {
        draftMechanic = {
            id: 'mechanic_' + Date.now(),
            type: 'meter',
            name: 'New Mechanic',
            description: '',
            min: 0,
            max: 10,
            startValue: 0,
            visible: true
        };
        selectedIndex = null;
        editMode = true;
    }

    function save() {
        if (!draftMechanic) return;
        if (selectedIndex !== null) {
            builderStore.updateMechanic(selectedIndex, draftMechanic);
        } else {
            builderStore.addMechanic(draftMechanic);
        }
        editMode = false;
        draftMechanic = null;
        selectedIndex = null;
    }

    function cancel() {
        editMode = false;
        draftMechanic = null;
        selectedIndex = null;
    }

    function remove(index: number) {
        if (confirm('Delete this mechanic?')) {
            builderStore.removeMechanic(index);
            if (selectedIndex === index) cancel();
        }
    }
</script>

<h1>Mechanics</h1>

{#if !editMode}
    <button on:click={createNew} class="btn-primary">Add Mechanic</button>
    <div class="list">
        {#each $builderStore.mechanics as mech, index}
            <div class="item">
                <div class="info">
                    <strong>{mech.name}</strong> ({mech.type})
                    <p>{mech.description || 'No description'}</p>
                </div>
                <div class="actions">
                    <button on:click={() => select(index)}>Edit</button>
                    <button on:click={() => remove(index)} class="btn-danger">Delete</button>
                </div>
            </div>
        {/each}
    </div>
{:else if draftMechanic}
    <div class="editor">
        <h2>{selectedIndex !== null ? 'Edit Mechanic' : 'New Mechanic'}</h2>

        <div class="form-group">
            <label for="id">Unique ID (e.g. pressure, trust)</label>
            <input id="id" bind:value={draftMechanic.id} />
        </div>

        <div class="form-group">
            <label for="type">Type</label>
            <select id="type" bind:value={draftMechanic.type}>
                <option value="meter">Meter (0-100)</option>
                <option value="flag">Flag (True/False)</option>
                <option value="counter">Counter (Number)</option>
                <option value="set">Set (List of Items)</option>
            </select>
        </div>

        <div class="form-group">
            <label for="name">Display Name</label>
            <input id="name" bind:value={draftMechanic.name} />
        </div>

        <div class="form-group">
            <label for="description">Description (Instruction for AI)</label>
            <textarea id="description" bind:value={draftMechanic.description} rows="2"></textarea>
        </div>

        {#if draftMechanic.type === 'meter' || draftMechanic.type === 'counter'}
            <div class="row">
                <div class="col">
                    <label for="min">Min</label>
                    <input type="number" id="min" bind:value={draftMechanic.min} />
                </div>
                <div class="col">
                    <label for="max">Max</label>
                    <input type="number" id="max" bind:value={draftMechanic.max} />
                </div>
                <div class="col">
                    <label for="startValue">Start Value</label>
                    <input type="number" id="startValue" bind:value={draftMechanic.startValue} />
                </div>
            </div>
        {/if}

        {#if draftMechanic.type === 'flag'}
            <div class="form-group">
                <label>
                    <input type="checkbox" checked={Boolean(draftMechanic.startValue)} on:change={(e) => draftMechanic && (draftMechanic.startValue = e.currentTarget.checked)} /> Start True?
                </label>
            </div>
        {/if}

        <div class="form-group">
            <label>
                <input type="checkbox" bind:checked={draftMechanic.visible} /> Visible to Player?
            </label>
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
    input, textarea, select { width: 100%; padding: 0.5rem; background: #222; border: 1px solid #444; color: white; }
    .row { display: flex; gap: 1rem; margin-bottom: 1rem; }
    .col { flex: 1; }
    .editor-actions { margin-top: 1rem; display: flex; gap: 1rem; }
    .btn-primary { background: #007bff; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; }
    .btn-danger { background: #dc3545; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; }
</style>
