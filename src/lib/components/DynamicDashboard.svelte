<script lang="ts">
    import type { GameState } from '$lib/contracts';
    import type { StoryConfig, Mechanic, MechanicType } from '$lib/contracts/story';

    type MechanicValue = number | boolean | string[];

    export let gameState: GameState;
    export let storyConfig: StoryConfig | null;

    // Filter visible mechanics
    $: visibleMechanics = storyConfig?.mechanics.filter(m => m.visible) || [];

    function getValue(mech: Mechanic): MechanicValue {
        if (!gameState.mechanics) return mech.startValue ?? 0;
        return gameState.mechanics[mech.id] ?? mech.startValue ?? 0;
    }

    function getPercent(mech: Mechanic, val: number): number {
        const min = mech.min ?? 0;
        const max = mech.max ?? 100;
        return Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
    }

    function getList(val: MechanicValue): string[] {
        return Array.isArray(val) ? val : [];
    }
</script>

<div class="dashboard">
    {#each visibleMechanics as mech (mech.id)}
        <div class="mechanic-card">
            <div class="mechanic-header">
                <span class="label">{mech.name}</span>
                {#if mech.type === 'meter' || mech.type === 'counter'}
                    <span class="value">{getValue(mech)}</span>
                {/if}
            </div>

            {#if mech.type === 'meter'}
                <div class="meter-track">
                    <div class="meter-fill" style="width: {getPercent(mech, Number(getValue(mech)))}%"></div>
                </div>
            {:else if mech.type === 'flag'}
                <div class="flag-indicator" class:active={Boolean(getValue(mech))}>
                    {getValue(mech) ? 'Active' : 'Inactive'}
                </div>
            {:else if mech.type === 'counter'}
                <!-- Just number shown above -->
            {:else if mech.type === 'set'}
                 <ul class="set-list">
                    {#each getList(getValue(mech)) as item}
                        <li>{item}</li>
                    {/each}
                 </ul>
            {/if}
        </div>
    {/each}
</div>

<style>
    .dashboard {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        background: rgba(0,0,0,0.3);
        border-radius: 8px;
    }
    .mechanic-card {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    .mechanic-header {
        display: flex;
        justify-content: space-between;
        font-size: 0.9rem;
        color: #ccc;
    }
    .meter-track {
        height: 8px;
        background: #444;
        border-radius: 4px;
        overflow: hidden;
    }
    .meter-fill {
        height: 100%;
        background: var(--primary-color, #ff4d4d);
        transition: width 0.3s ease;
    }
    .flag-indicator {
        padding: 0.25rem 0.5rem;
        background: #333;
        border-radius: 4px;
        font-size: 0.8rem;
        text-align: center;
        color: #666;
    }
    .flag-indicator.active {
        background: var(--primary-color, #ff4d4d);
        color: white;
    }
    .set-list {
        margin: 0;
        padding-left: 1.2rem;
        font-size: 0.8rem;
        color: #aaa;
    }
</style>
