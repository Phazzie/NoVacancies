<script lang="ts" context="module">
	export interface VoiceExample {
		key: 'monologue' | 'sceneDetail' | 'choiceFraming' | 'unnoticedLoss';
		kicker: string;
		title: string;
		example: string;
		whyItWorks: string;
		promptLabel: string;
		placeholder: string;
	}
</script>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { BuilderStoryDraft } from '$lib/stories/types';

	export let draft: BuilderStoryDraft;

	const dispatch = createEventDispatcher<{
		addToVoiceCeiling: { lines: string[] };
	}>();

	let monologue = '';
	let sceneDetail = '';
	let choiceFraming = '';
	let unnoticedLoss = '';
	let saved = false;

	const examples: VoiceExample[] = [
		{
			key: 'monologue',
			kicker: 'Example 1',
			title: "Sydney's internal monologue — practical, not philosophical",
			example:
				"Okay, if I take the 6am pickup, that's $23 before fees. Minus the parking ticket from last week if they find it in the system. Okay. Okay.",
			whyItWorks:
				"She's doing arithmetic, not soul-searching. The \"Okay. Okay.\" at the end is anxiety managed through repetition, not insight. She never asks why she's in this situation — she just tries to get through it.",
			promptLabel: "Your protagonist's internal monologue — practical, task-focused",
			placeholder:
				'Write a beat of internal monologue where your protagonist is doing the math of their next move — money, time, logistics — not asking why they ended up here.'
		},
		{
			key: 'sceneDetail',
			kicker: 'Example 2',
			title: 'Scene texture — specific and unglamorous',
			example:
				"The motel AC unit makes a sound like someone left a fork in a garbage disposal. Room 14 always smells like the previous guest's takeout. She's learned to keep her phone charger on the nightstand because the outlet by the bathroom trips the breaker.",
			whyItWorks:
				'The details are institutional — the protagonist has memorized the specific failures of her specific environment. This is what it looks like to live somewhere instead of visit.',
			promptLabel: 'A scene detail that shows they live here, not visit',
			placeholder:
				'Name one piece of the environment that only someone who lives there would know about — a sound, a smell, a workaround for a thing that is broken.'
		},
		{
			key: 'choiceFraming',
			kicker: 'Example 3',
			title: 'Choice framing — bad vs. worse, never good vs. bad',
			example:
				"She could message the platform and dispute the rating. That'll take 2-3 days and freeze her account in the meantime. Or she could just accept it and hope the next five rides average it out.",
			whyItWorks:
				'Both options hurt. The "or" isn\'t a real choice — it\'s two paths to the same destination. The story never offers a clean escape, because that would lie about the situation.',
			promptLabel: 'A choice where both options hurt — write both options and why neither is good',
			placeholder:
				'Frame a choice your protagonist faces. Write both options as concrete actions. Make sure both cost something — no clean escape.'
		},
		{
			key: 'unnoticedLoss',
			kicker: 'Example 4',
			title: "The thing she doesn't notice",
			example:
				"She'd been meaning to call her sister back for three weeks. The notification was still there — she'd read it twice but it felt like something that belonged to a different day, a day with more battery left in it.",
			whyItWorks:
				"Sydney is losing things she doesn't name. The story surfaces what the protagonist can't. The reader sees it; she doesn't.",
			promptLabel: 'Something your protagonist is losing without naming it',
			placeholder:
				'Write a beat that shows something slipping — a relationship, a habit, a self — that the protagonist registers without confronting.'
		}
	];

	function getValueFor(key: VoiceExample['key']): string {
		if (key === 'monologue') return monologue;
		if (key === 'sceneDetail') return sceneDetail;
		if (key === 'choiceFraming') return choiceFraming;
		return unnoticedLoss;
	}

	function setValueFor(key: VoiceExample['key'], value: string): void {
		if (key === 'monologue') monologue = value;
		else if (key === 'sceneDetail') sceneDetail = value;
		else if (key === 'choiceFraming') choiceFraming = value;
		else unnoticedLoss = value;
		// Editing after a save resets the confirmation so the button can be used again.
		if (saved) saved = false;
	}

	$: filledLines = [monologue, sceneDetail, choiceFraming, unnoticedLoss]
		.map((value) => value.trim())
		.filter((value) => value.length > 0);
	$: canSave = filledLines.length > 0 && !saved;
	$: currentCeilingCount = draft?.voiceCeilingLines?.length ?? 0;

	function handleSave(): void {
		if (filledLines.length === 0) return;
		dispatch('addToVoiceCeiling', { lines: filledLines });
		saved = true;
	}
</script>

<section class="voice-guide" aria-label="Voice guide">
	<header class="voice-guide-head">
		<div>
			<p class="voice-guide-kicker">Onboarding · Craft</p>
			<h3>Voice guide — how No Vacancies sounds, and how yours might</h3>
		</div>
	</header>

	<p class="voice-guide-intro">
		These are the craft choices that give No Vacancies its texture. Read each one, then write your
		own equivalent for your story. Click "Save to voice ceiling" to add your examples to your
		draft.
	</p>

	<ol class="voice-guide-list">
		{#each examples as item (item.key)}
			<li class="voice-guide-item">
				<p class="voice-guide-kicker voice-guide-kicker-item">{item.kicker}</p>
				<h4 class="voice-guide-item-title">{item.title}</h4>
				<blockquote class="voice-guide-quote">{item.example}</blockquote>
				<p class="voice-guide-why">
					<span class="voice-guide-why-label">Why it works:</span>
					{item.whyItWorks}
				</p>
				<label class="voice-guide-field">
					<span class="voice-guide-field-label">{item.promptLabel}</span>
					<textarea
						class="voice-guide-textarea"
						rows="3"
						placeholder={item.placeholder}
						value={getValueFor(item.key)}
						on:input={(event) =>
							setValueFor(item.key, (event.currentTarget as HTMLTextAreaElement).value)}
					></textarea>
				</label>
			</li>
		{/each}
	</ol>

	<footer class="voice-guide-foot">
		<div class="voice-guide-foot-meta">
			<p class="voice-guide-counter">
				{filledLines.length} of 4 filled in
				<span class="voice-guide-counter-suffix">
					· Voice ceiling currently has {currentCeilingCount}
					{currentCeilingCount === 1 ? 'line' : 'lines'}
				</span>
			</p>
			{#if saved}
				<p class="voice-guide-confirm" role="status" aria-live="polite">
					Added to your voice ceiling ✓
				</p>
			{/if}
		</div>
		<button
			type="button"
			class="voice-guide-button"
			on:click={handleSave}
			disabled={!canSave}
			data-testid="voice-guide-save"
		>
			Save to voice ceiling
		</button>
	</footer>
</section>

<style>
	.voice-guide {
		--vg-accent: var(--accent-bright, #6366f1);
		--vg-card-border: var(--line-soft, rgba(247, 241, 232, 0.12));
		--vg-card-border-strong: var(--line-strong, rgba(247, 241, 232, 0.22));
		--vg-text: var(--text-100, #f7f1e8);
		--vg-text-dim: var(--text-300, #b8aa9d);
		--vg-good: var(--sage-400, #22c55e);
		display: grid;
		gap: 0.85rem;
		padding: 1rem;
		border: 1px solid var(--vg-card-border);
		border-radius: 16px;
		background: linear-gradient(180deg, rgba(18, 12, 9, 0.92), rgba(10, 8, 7, 0.96));
		box-shadow: var(--shadow-md, 0 16px 36px rgba(0, 0, 0, 0.22));
		color: var(--vg-text);
	}

	.voice-guide-head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.voice-guide-head h3 {
		margin: 0.1rem 0 0;
		font-family: var(--font-display, serif);
		font-size: 1.1rem;
		color: var(--vg-text);
		line-height: 1.25;
	}

	.voice-guide-kicker {
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		font-size: 0.68rem;
		color: var(--vg-text-dim);
	}

	.voice-guide-kicker-item {
		margin-bottom: 0.2rem;
	}

	.voice-guide-intro {
		margin: 0;
		font-size: 0.88rem;
		line-height: 1.5;
		color: var(--vg-text-dim);
	}

	.voice-guide-list {
		list-style: none;
		display: grid;
		gap: 0.85rem;
		margin: 0;
		padding: 0;
	}

	.voice-guide-item {
		display: grid;
		gap: 0.55rem;
		padding: 0.85rem 0.9rem;
		border: 1px solid var(--vg-card-border-strong);
		border-left: 3px solid var(--vg-accent);
		border-radius: 12px;
		background: rgba(9, 7, 7, 0.55);
	}

	.voice-guide-item-title {
		margin: 0;
		font-family: var(--font-display, serif);
		font-size: 0.98rem;
		color: var(--vg-text);
		line-height: 1.3;
	}

	.voice-guide-quote {
		margin: 0;
		padding: 0.7rem 0.85rem;
		border-left: 2px solid var(--vg-card-border-strong);
		background: rgba(247, 241, 232, 0.04);
		border-radius: 8px;
		font-family: var(--font-display, serif);
		font-style: italic;
		font-size: 0.92rem;
		line-height: 1.5;
		color: var(--vg-text);
	}

	.voice-guide-why {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.5;
		color: var(--vg-text-dim);
	}

	.voice-guide-why-label {
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--vg-good);
		margin-right: 0.3rem;
	}

	.voice-guide-field {
		display: grid;
		gap: 0.35rem;
	}

	.voice-guide-field-label {
		font-size: 0.78rem;
		letter-spacing: 0.02em;
		color: var(--vg-text-dim);
		font-weight: 600;
	}

	.voice-guide-textarea {
		appearance: none;
		width: 100%;
		box-sizing: border-box;
		resize: vertical;
		min-height: 4.5rem;
		padding: 0.6rem 0.7rem;
		border: 1px solid var(--vg-card-border-strong);
		border-radius: 10px;
		background: rgba(247, 241, 232, 0.04);
		color: var(--vg-text);
		font: inherit;
		font-size: 0.88rem;
		line-height: 1.45;
		transition: border-color 120ms ease-out, background 120ms ease-out;
	}

	.voice-guide-textarea::placeholder {
		color: var(--vg-text-dim);
		opacity: 0.75;
	}

	.voice-guide-textarea:focus {
		outline: none;
		border-color: var(--vg-accent);
		background: rgba(247, 241, 232, 0.07);
	}

	.voice-guide-foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		padding-top: 0.25rem;
	}

	.voice-guide-foot-meta {
		display: grid;
		gap: 0.2rem;
	}

	.voice-guide-counter {
		margin: 0;
		font-size: 0.78rem;
		color: var(--vg-text-dim);
	}

	.voice-guide-counter-suffix {
		color: var(--vg-text-dim);
		opacity: 0.85;
	}

	.voice-guide-confirm {
		margin: 0;
		font-size: 0.8rem;
		color: var(--vg-good);
		font-weight: 600;
	}

	.voice-guide-button {
		appearance: none;
		border: 1px solid var(--vg-card-border-strong);
		background: rgba(247, 241, 232, 0.04);
		color: var(--vg-text);
		font: inherit;
		font-size: 0.82rem;
		padding: 0.5rem 0.95rem;
		border-radius: 8px;
		cursor: pointer;
		transition: background 120ms ease-out, border-color 120ms ease-out;
	}

	.voice-guide-button:hover:not(:disabled) {
		background: rgba(247, 241, 232, 0.08);
		border-color: var(--vg-accent);
	}

	.voice-guide-button:disabled {
		cursor: not-allowed;
		opacity: 0.55;
	}
</style>
