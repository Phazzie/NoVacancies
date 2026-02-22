<script lang="ts">
    import { builderStore } from '$lib/client/builderStore';
</script>

<h1>Story Info</h1>

<div class="form-group">
    <label for="title">Title</label>
    <input id="title" bind:value={$builderStore.title} placeholder="Enter title..." />
</div>

<div class="form-group">
    <label for="author">Author</label>
    <input id="author" bind:value={$builderStore.author} placeholder="Your name..." />
</div>

<div class="form-group">
    <label for="premise">Premise</label>
    <textarea id="premise" bind:value={$builderStore.premise} rows="3" placeholder="A short summary of the story setup..."></textarea>
</div>

<div class="form-group">
    <label for="genre">Genre</label>
    <input id="genre" bind:value={$builderStore.genre} placeholder="e.g. Sci-Fi, Horror..." />
</div>

{#if $builderStore.theme}
    <h2>Visual Theme</h2>
    <div class="form-group">
        <label for="primaryColor">Primary Color</label>
        <input type="color" id="primaryColor" bind:value={$builderStore.theme.primaryColor} />
    </div>
    <div class="form-group">
        <label for="secondaryColor">Secondary Color</label>
        <input type="color" id="secondaryColor" bind:value={$builderStore.theme.secondaryColor} />
    </div>
    <div class="form-group">
        <label for="backgroundColor">Background Color</label>
        <input type="color" id="backgroundColor" bind:value={$builderStore.theme.backgroundColor} />
    </div>
    <div class="form-group">
        <label for="fontFamily">Font Family</label>
        <select id="fontFamily" bind:value={$builderStore.theme.fontFamily}>
            <option value="sans-serif">Sans Serif</option>
            <option value="serif">Serif</option>
            <option value="monospace">Monospace</option>
            <option value="'Courier New', monospace">Courier New</option>
            <option value="'Times New Roman', serif">Times New Roman</option>
        </select>
    </div>
{/if}

<style>
    .form-group {
        margin-bottom: 1.5rem;
    }
    label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: bold;
    }
    input, textarea, select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #444;
        background: #222;
        color: white;
        border-radius: 4px;
    }
    textarea {
        resize: vertical;
    }
    h2 {
        margin-top: 2rem;
        border-bottom: 1px solid #444;
        padding-bottom: 0.5rem;
    }
</style>
