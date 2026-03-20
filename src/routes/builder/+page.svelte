<script lang="ts">
	import { onMount } from 'svelte';
	import { getSafeActiveStoryCartridge } from '$lib/stories';
	import { starterKitCartridge } from '$lib/stories/starter-kit';
	import { loadBuilderDraft, saveBuilderDraft } from '$lib/builder/store';
	import type { BuilderFieldFeedback, BuilderStoryDraft } from '$lib/stories/types';

	type FeedbackState = Record<string, { source: 'ai' | 'fallback'; feedback: BuilderFieldFeedback }>;

	const activeStory = getSafeActiveStoryCartridge();
	const draftScope = activeStory?.id ?? 'unknown-story';
	const fallbackDraft = starterKitCartridge.builder.createEmptyDraft();

	let premise = '';
	let draft: BuilderStoryDraft = fallbackDraft;
	let feedback: FeedbackState = {};
	let statusMessage = 'Start with a premise. The builder will draft structure before you edit.';
	let generateState: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
	let lastDraftSource: 'ai' | 'fallback' | null = null;
	let builderReady = false;

	onMount(() => {
		draft = loadBuilderDraft(draftScope, fallbackDraft);
		premise = draft.premise;
		builderReady = true;
	});

	$: saveBuilderDraft(draftScope, draft);

	async function generateDraft(): Promise<void> {
		generateState = 'loading';
		statusMessage = 'Generating first draft...';
		try {
			const response = await fetch('/api/builder/generate-draft', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ premise })
			});
			const payload = (await response.json()) as { draft?: BuilderStoryDraft; source?: 'ai' | 'fallback' };
			if (!response.ok || !payload.draft || !payload.source) {
				throw new Error('Could not generate a draft story definition.');
			}
			draft = payload.draft;
			lastDraftSource = payload.source;
			statusMessage =
				payload.source === 'ai'
					? 'Draft generated with Grok. Edit freely.'
					: 'Draft generated with fallback scaffolding. Grok was unavailable, so this is a structural starter.';
			generateState = 'ready';
		} catch (error) {
			generateState = 'error';
			statusMessage =
				error instanceof Error ? error.message : 'Could not generate a draft story definition.';
		}
	}

	async function evaluateField(fieldKey: string, prose: string): Promise<void> {
		const trimmed = prose.trim();
		if (!trimmed) return;
		try {
			const response = await fetch('/api/builder/evaluate-prose', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ prose: trimmed })
			});
			const payload = (await response.json()) as {
				feedback?: BuilderFieldFeedback;
				source?: 'ai' | 'fallback';
			};
			if (!response.ok || !payload.feedback || !payload.source) {
				throw new Error('Evaluation failed');
			}
			feedback = {
				...feedback,
				[fieldKey]: {
					source: payload.source,
					feedback: payload.feedback
				}
			};
		} catch {
			feedback = {
				...feedback,
				[fieldKey]: {
					source: 'fallback',
					feedback: {
						score: 1,
						flags: ['Evaluation failed. Try again after saving or when AI is configured.'],
						suggestion:
							'Keep the line behavioral and concrete. Add one visible action or object.'
					}
				}
			};
		}
	}

	function addCharacter(): void {
		draft = {
			...draft,
			characters: [
				...draft.characters,
				{ name: 'New Character', role: 'role', description: 'Describe what they do, not what they are.' }
			]
		};
	}

	function addMechanic(): void {
		draft = {
			...draft,
			mechanics: [
				...draft.mechanics,
				{
					key: `mechanic_${draft.mechanics.length + 1}`,
					label: 'New Mechanic',
					voiceMap: [
						{ value: '0', line: 'Write the baseline state as behavior.' },
						{ value: '1', line: 'Write the escalated state as behavior.' }
					]
				}
			]
		};
	}

	function mechanicFeedbackKey(mechanicIndex: number, lineIndex: number): string {
		return `mechanic:${mechanicIndex}:${lineIndex}`;
	}
</script>

<section class="builder-page">
	<header class="builder-hero">
		<div>
			<p class="card-kicker">Story engine authoring</p>
			<h1>Builder</h1>
			<p class="builder-copy">
				Start from a premise, get a drafted story definition, then tighten the prose-bearing
				fields until they actually behave.
			</p>
		</div>
		<div class="builder-status-card">
			<p class="card-kicker">Draft status</p>
			<p class="builder-status-line">{statusMessage}</p>
			<p class="sr-only" data-testid="builder-ready">{builderReady ? 'ready' : 'loading'}</p>
			{#if lastDraftSource}
				<p class="builder-source-pill">Source: {lastDraftSource === 'ai' ? 'Grok draft' : 'Fallback draft'}</p>
			{/if}
		</div>
	</header>

	<section class="builder-panel">
		<div class="builder-panel-head">
			<div>
				<p class="card-kicker">Creation entry</p>
				<h2>Premise</h2>
			</div>
			<button class="btn btn-primary" on:click={generateDraft} disabled={generateState === 'loading'}>
				{generateState === 'loading' ? 'Generating...' : 'Generate Draft'}
			</button>
		</div>
		<label class="builder-field">
			<span class="sr-only">Story premise</span>
			<textarea
				class="builder-textarea"
				rows="4"
				bind:value={premise}
				aria-label="Story premise"
				placeholder="A woman runs the graveyard shift at a roadside laundromat while her brother turns every favor into an invoice."
			></textarea>
		</label>
	</section>

	<section class="builder-grid">
		<div class="builder-panel">
			<p class="card-kicker">Core identity</p>
			<label class="builder-field">
				<span>Story Title</span>
				<input class="builder-input" bind:value={draft.title} />
			</label>
			<label class="builder-field">
				<span>Setting</span>
				<textarea class="builder-textarea" rows="3" bind:value={draft.setting}></textarea>
			</label>
			<label class="builder-field">
				<span>Aesthetic Statement</span>
				<textarea
					class="builder-textarea"
					rows="4"
					bind:value={draft.aestheticStatement}
					on:blur={() => evaluateField('aestheticStatement', draft.aestheticStatement)}
				></textarea>
			</label>
			{#if feedback.aestheticStatement}
				<div class="builder-feedback">
					<p class="builder-feedback-score">
						Score {feedback.aestheticStatement.feedback.score}/10
						<span>({feedback.aestheticStatement.source})</span>
					</p>
					<p>{feedback.aestheticStatement.feedback.suggestion}</p>
				</div>
			{/if}
		</div>

		<div class="builder-panel">
			<div class="builder-panel-head">
				<div>
					<p class="card-kicker">Voice ceiling</p>
					<h2>Lines that prove the tone</h2>
				</div>
			</div>
			{#each draft.voiceCeilingLines as line, index}
				<label class="builder-field">
					<span>Voice ceiling {index + 1}</span>
					<textarea
						class="builder-textarea"
						rows="2"
						bind:value={draft.voiceCeilingLines[index]}
						on:blur={() => evaluateField(`voice:${index}`, draft.voiceCeilingLines[index])}
					></textarea>
				</label>
				{#if feedback[`voice:${index}`]}
					<div class="builder-feedback">
						<p class="builder-feedback-score">
							Score {feedback[`voice:${index}`].feedback.score}/10
							<span>({feedback[`voice:${index}`].source})</span>
						</p>
						<p>{feedback[`voice:${index}`].feedback.suggestion}</p>
					</div>
				{/if}
			{/each}
		</div>
	</section>

	<section class="builder-panel">
		<div class="builder-panel-head">
			<div>
				<p class="card-kicker">Characters</p>
				<h2>Pressure sources and witnesses</h2>
			</div>
			<button class="btn btn-secondary btn-sm" on:click={addCharacter}>Add Character</button>
		</div>
		<div class="builder-stack">
			{#each draft.characters as character, index}
				<div class="builder-card">
					<label class="builder-field">
						<span>Name</span>
						<input class="builder-input" bind:value={draft.characters[index].name} />
					</label>
					<label class="builder-field">
						<span>Role</span>
						<input class="builder-input" bind:value={draft.characters[index].role} />
					</label>
					<label class="builder-field">
						<span>Description</span>
						<textarea
							class="builder-textarea"
							rows="3"
							bind:value={draft.characters[index].description}
							on:blur={() =>
								evaluateField(`character:${index}`, draft.characters[index].description)}
						></textarea>
					</label>
					{#if feedback[`character:${index}`]}
						<div class="builder-feedback">
							<p class="builder-feedback-score">
								Score {feedback[`character:${index}`].feedback.score}/10
								<span>({feedback[`character:${index}`].source})</span>
							</p>
							<p>{feedback[`character:${index}`].feedback.suggestion}</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</section>

	<section class="builder-panel">
		<div class="builder-panel-head">
			<div>
				<p class="card-kicker">Mechanics</p>
				<h2>Voice maps</h2>
			</div>
			<button class="btn btn-secondary btn-sm" on:click={addMechanic}>Add Mechanic</button>
		</div>
		<div class="builder-stack">
			{#each draft.mechanics as mechanic, mechanicIndex}
				<div class="builder-card">
					<label class="builder-field">
						<span>Mechanic key</span>
						<input class="builder-input" bind:value={draft.mechanics[mechanicIndex].key} />
					</label>
					<label class="builder-field">
						<span>Mechanic label</span>
						<input class="builder-input" bind:value={draft.mechanics[mechanicIndex].label} />
					</label>
					{#each mechanic.voiceMap as entry, lineIndex}
						<div class="builder-mechanic-line">
							<label class="builder-field">
								<span>Value</span>
								<input
									class="builder-input"
									bind:value={draft.mechanics[mechanicIndex].voiceMap[lineIndex].value}
								/>
							</label>
							<label class="builder-field builder-grow">
								<span>Voice line</span>
								<textarea
									class="builder-textarea"
									rows="2"
									bind:value={draft.mechanics[mechanicIndex].voiceMap[lineIndex].line}
									on:blur={() =>
										evaluateField(
											mechanicFeedbackKey(mechanicIndex, lineIndex),
											draft.mechanics[mechanicIndex].voiceMap[lineIndex].line
										)}
								></textarea>
							</label>
						</div>
						{#if feedback[mechanicFeedbackKey(mechanicIndex, lineIndex)]}
							<div class="builder-feedback">
								<p class="builder-feedback-score">
									Score {feedback[mechanicFeedbackKey(mechanicIndex, lineIndex)].feedback.score}/10
									<span>({feedback[mechanicFeedbackKey(mechanicIndex, lineIndex)].source})</span>
								</p>
								<p>{feedback[mechanicFeedbackKey(mechanicIndex, lineIndex)].feedback.suggestion}</p>
							</div>
						{/if}
					{/each}
				</div>
			{/each}
		</div>
	</section>

	<section class="builder-grid">
		<div class="builder-panel">
			<p class="card-kicker">Prompts</p>
			<label class="builder-field">
				<span>Opening Prompt</span>
				<textarea class="builder-textarea" rows="5" bind:value={draft.openingPrompt}></textarea>
			</label>
		</div>
		<div class="builder-panel">
			<p class="card-kicker">System prompt</p>
			<label class="builder-field">
				<span>System Prompt</span>
				<textarea class="builder-textarea" rows="8" bind:value={draft.systemPrompt}></textarea>
			</label>
		</div>
	</section>
</section>
