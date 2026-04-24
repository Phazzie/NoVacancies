<script lang="ts">
	import { onMount } from 'svelte';
	import { getSafeActiveStoryCartridge } from '$lib/stories';
	import { starterKitCartridge } from '$lib/stories/starter-kit';
	import { loadBuilderDraft, saveBuilderDraft } from '$lib/builder/store';
	import type {
		BuilderDraftEvaluation,
		BuilderDraftFinding,
		BuilderDraftFindingSeverity,
		BuilderFieldFeedback,
		BuilderStoryDraft
	} from '$lib/stories/types';

	type FeedbackState = Record<string, { source: 'ai' | 'fallback'; feedback: BuilderFieldFeedback }>;
	type DraftQaState = { source: 'ai' | 'fallback'; evaluation: BuilderDraftEvaluation } | null;

	const activeStory = getSafeActiveStoryCartridge();
	const draftScope = activeStory?.id ?? 'unknown-story';
	const fallbackDraft = starterKitCartridge.builder.createEmptyDraft();

	let premise = '';
	let draft: BuilderStoryDraft = fallbackDraft;
	let feedback: FeedbackState = {};
	let draftQa: DraftQaState = null;
	let statusMessage = 'Start with a premise. The builder will draft structure before you edit.';
	let generateState: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
	let draftQaState: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
	let lastDraftSource: 'ai' | 'fallback' | null = null;
	let builderReady = false;
	let lastQaDraftSignature: string | null = null;
	let draftSignature = '';
	let changedSinceQa = false;
	let findingCounts = { blocker: 0, warning: 0, info: 0 };

	onMount(() => {
		draft = loadBuilderDraft(draftScope, fallbackDraft);
		premise = draft.premise;
		builderReady = true;
	});

	$: saveBuilderDraft(draftScope, draft);

	$: readinessLabel = draftQa?.evaluation.readiness ?? 'not-run';
	$: groupedFindings = groupFindings(draftQa?.evaluation.findings ?? []);
	$: findingCounts = {
		blocker: groupedFindings.blocker.length,
		warning: groupedFindings.warning.length,
		info: groupedFindings.info.length
	};
	$: draftSignature = computeDraftSignature(draft);
	$: changedSinceQa = lastQaDraftSignature !== null && lastQaDraftSignature !== draftSignature;

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
			draftQa = null;
			draftQaState = 'idle';
			statusMessage =
				payload.source === 'ai'
					? 'Draft generated with Grok. Edit freely.'
					: 'Draft generated with fallback scaffolding. Grok was unavailable, so this is a structural starter.';
			generateState = 'ready';
			lastQaDraftSignature = null;
		} catch (error) {
			generateState = 'error';
			statusMessage =
				error instanceof Error ? error.message : 'Could not generate a draft story definition.';
		}
	}

	async function runDraftQa(): Promise<void> {
		draftQaState = 'loading';
		try {
			const response = await fetch('/api/builder/evaluate-draft', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ draft })
			});
			const payload = (await response.json()) as {
				evaluation?: BuilderDraftEvaluation;
				source?: 'ai' | 'fallback';
			};
			if (!response.ok || !payload.evaluation || !payload.source) {
				throw new Error('Draft QA failed');
			}
			draftQa = {
				evaluation: payload.evaluation,
				source: payload.source
			};
			lastQaDraftSignature = draftSignature;
			draftQaState = 'ready';
		} catch {
			draftQaState = 'error';
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

	function fieldAnchorId(fieldKey: string): string {
		return `draft-field-${fieldKey.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
	}

	function groupFindings(findings: BuilderDraftFinding[]): Record<BuilderDraftFindingSeverity, BuilderDraftFinding[]> {
		return {
			blocker: findings.filter((finding) => finding.severity === 'blocker'),
			warning: findings.filter((finding) => finding.severity === 'warning'),
			info: findings.filter((finding) => finding.severity === 'info')
		};
	}

	function computeDraftSignature(value: BuilderStoryDraft): string {
		return JSON.stringify(value, Object.keys(value).sort());
	}

	function downloadDraftJson(): void {
		const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${draft.title || 'builder-draft'}.json`;
		link.click();
		URL.revokeObjectURL(url);
	}
</script>

<section class="builder-page">
	<header class="builder-hero">
		<div class="builder-hero-copy">
			<p class="card-kicker">Story engine authoring</p>
			<h1>Builder</h1>
			<p class="builder-copy">
				Start from a premise, get a drafted story definition, then tighten the prose-bearing fields
				until they behave under pressure. Gold standard = publishable without manual rescue.
			</p>
			<div class="builder-chip-row" aria-live="polite">
				<span class="builder-chip builder-chip-strong">Readiness: {readinessLabel}</span>
				{#if lastDraftSource}
					<span class="builder-chip builder-chip-soft">
						Source: {lastDraftSource === 'ai' ? 'Grok draft' : 'Fallback draft'}
					</span>
				{/if}
				<span class="builder-chip {changedSinceQa ? 'builder-chip-warn' : 'builder-chip-soft'}">
					{changedSinceQa ? 'Changes since last QA' : 'QA reflects current draft'}
				</span>
			</div>
		</div>
		<div class="builder-status-card" aria-live="polite">
			<p class="card-kicker">Draft status</p>
			<p class="builder-status-line">{statusMessage}</p>
			<p class="sr-only" data-testid="builder-ready">{builderReady ? 'ready' : 'loading'}</p>
			<div class="builder-status-grid">
				<div>
					<p class="builder-status-label">Blockers</p>
					<p class="builder-status-value">{findingCounts.blocker}</p>
				</div>
				<div>
					<p class="builder-status-label">Warnings</p>
					<p class="builder-status-value">{findingCounts.warning}</p>
				</div>
				<div>
					<p class="builder-status-label">Info</p>
					<p class="builder-status-value">{findingCounts.info}</p>
				</div>
			</div>
			<p class="builder-readiness-pill" data-testid="builder-readiness">
				Readiness: {readinessLabel}
			</p>
		</div>
	</header>

	<div class="builder-command-bar">
		<div class="builder-actions">
			<button class="btn btn-primary" on:click={generateDraft} disabled={generateState === 'loading'}>
				{generateState === 'loading' ? 'Generating...' : 'Generate Draft'}
			</button>
			<button class="btn btn-secondary" on:click={runDraftQa} disabled={draftQaState === 'loading'}>
				{draftQaState === 'loading' ? 'Running QA...' : 'Run Draft QA'}
			</button>
			<button class="btn btn-ghost" type="button" on:click={downloadDraftJson}>
				Download JSON
			</button>
		</div>
		<div class="builder-hints">
			<span>Steps: premise → draft → QA → revise until blockers = 0.</span>
			<span>{draftQa ? 'QA uses latest run; rerun after edits.' : 'Run QA after first draft to set a target.'}</span>
		</div>
	</div>

	<div class="builder-body">
		<div class="builder-main">
			<section class="builder-panel">
				<div class="builder-panel-head">
					<div>
						<p class="card-kicker">Creation entry</p>
						<h2>Premise</h2>
					</div>
				</div>
				<label class="builder-field" for={fieldAnchorId('premise')}>
					<span class="sr-only">Story premise</span>
					<textarea
						id={fieldAnchorId('premise')}
						class="builder-textarea builder-textarea-large"
						rows="5"
						bind:value={premise}
						aria-label="Story premise"
						placeholder="A woman runs the graveyard shift at a roadside laundromat while her brother turns every favor into an invoice."
					></textarea>
				</label>
			</section>

			{#if draftQa}
				<section class="builder-panel builder-qa-panel">
					<div class="builder-panel-head">
						<div>
							<p class="card-kicker">Draft QA</p>
							<h2>Readiness: {draftQa.evaluation.readiness}</h2>
						</div>
						<p class="builder-source-pill">
							Source: {draftQa.source === 'ai' ? 'Grok evaluator' : 'Fallback rubric'}
						</p>
					</div>
					<p class="builder-status-line">
						Overall score {draftQa.evaluation.overallScore}/10. Publishable = overall ≥
						{draftQa.evaluation.thresholds.minOverallScore}, each dimension ≥
						{draftQa.evaluation.thresholds.minDimensionScore}, blockers ≤
						{draftQa.evaluation.thresholds.maxBlockers}.
					</p>
					<div class="builder-meters">
						{#each Object.entries(draftQa.evaluation.dimensionScores) as [dimension, score]}
							<div class="builder-meter">
								<div class="builder-meter-head">
									<span>{dimension}</span>
									<span>{score}/10</span>
								</div>
								<meter min="0" max="10" low="7" high="9" optimum="10" value={score}></meter>
							</div>
						{/each}
					</div>
					{#each ['blocker', 'warning', 'info'] as severity}
						{#if groupedFindings[severity as BuilderDraftFindingSeverity].length > 0}
							<div class="builder-findings-group" data-severity={severity}>
								<h3>{severity}</h3>
								<ul>
									{#each groupedFindings[severity as BuilderDraftFindingSeverity] as finding}
										<li>
											<a href={`#${fieldAnchorId(finding.fieldKey)}`}>
												Jump to {finding.fieldKey}
											</a>
											<span>{finding.message}</span>
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					{/each}
				</section>
			{/if}

			<section class="builder-grid">
				<div class="builder-panel">
					<p class="card-kicker">Core identity</p>
					<label class="builder-field" for={fieldAnchorId('title')}>
						<span>Story Title</span>
						<input id={fieldAnchorId('title')} class="builder-input" bind:value={draft.title} />
					</label>
					<label class="builder-field" for={fieldAnchorId('setting')}>
						<span>Setting</span>
						<textarea id={fieldAnchorId('setting')} class="builder-textarea" rows="3" bind:value={draft.setting}></textarea>
					</label>
					<label class="builder-field" for={fieldAnchorId('aestheticStatement')}>
						<span>Aesthetic Statement</span>
						<textarea
							id={fieldAnchorId('aestheticStatement')}
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
						<label class="builder-field" for={fieldAnchorId(`voice:${index}`)}>
							<span>Voice ceiling {index + 1}</span>
							<textarea
								id={fieldAnchorId(`voice:${index}`)}
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
							<label class="builder-field" for={fieldAnchorId(`character:${index}`)}>
								<span>Description</span>
								<textarea
									id={fieldAnchorId(`character:${index}`)}
									class="builder-textarea"
									rows="3"
									bind:value={draft.characters[index].description}
									on:blur={() => evaluateField(`character:${index}`, draft.characters[index].description)}
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
							<label class="builder-field" for={fieldAnchorId(`mechanic:${mechanicIndex}:label`)}>
								<span>Mechanic label</span>
								<input
									id={fieldAnchorId(`mechanic:${mechanicIndex}:label`)}
									class="builder-input"
									bind:value={draft.mechanics[mechanicIndex].label}
								/>
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
									<label class="builder-field builder-grow" for={fieldAnchorId(mechanicFeedbackKey(mechanicIndex, lineIndex))}>
										<span>Voice line</span>
										<textarea
											id={fieldAnchorId(mechanicFeedbackKey(mechanicIndex, lineIndex))}
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
					<label class="builder-field" for={fieldAnchorId('openingPrompt')}>
						<span>Opening Prompt</span>
						<textarea id={fieldAnchorId('openingPrompt')} class="builder-textarea" rows="5" bind:value={draft.openingPrompt}></textarea>
					</label>
				</div>
				<div class="builder-panel">
					<p class="card-kicker">System prompt</p>
					<label class="builder-field" for={fieldAnchorId('systemPrompt')}>
						<span>System Prompt</span>
						<textarea id={fieldAnchorId('systemPrompt')} class="builder-textarea" rows="8" bind:value={draft.systemPrompt}></textarea>
					</label>
				</div>
			</section>
		</div>

		<aside class="builder-rail" aria-label="Builder audit rail">
			<div class="builder-rail-card">
				<h3>Gold medal bar</h3>
				<p class="builder-rail-copy">
					Publishable with zero blockers, all dimensions ≥
					{draftQa ? draftQa.evaluation.thresholds.minDimensionScore : 7}, concrete voice lines,
					and mechanics with at least two voiced states.
				</p>
				<ul class="builder-rail-list">
					<li>Characters: {draft.characters.length} (target 2-4)</li>
					<li>Mechanics: {draft.mechanics.length} (target 3-5)</li>
					<li>Voice lines: {draft.voiceCeilingLines.length} (≥2)</li>
					<li>QA status: {draftQa ? draftQa.evaluation.readiness : 'not-run'}</li>
				</ul>
			</div>
			<div class="builder-rail-card">
				<h3>Findings snapshot</h3>
				<div class="builder-chip-row">
					<span class="builder-chip builder-chip-strong">Blockers {findingCounts.blocker}</span>
					<span class="builder-chip builder-chip-warn">Warnings {findingCounts.warning}</span>
					<span class="builder-chip builder-chip-soft">Info {findingCounts.info}</span>
				</div>
				<p class="builder-rail-copy">
					Use findings to drive edits before the next QA run. Keep edits behavioral, concrete, and
					short.
				</p>
			</div>
			<div class="builder-rail-card">
				<h3>Workflow tips</h3>
				<ul class="builder-rail-list">
					<li>Every prose field should stage an action or object.</li>
					<li>Mechanic voice maps need at least two states.</li>
					<li>Keep prompts aligned to the premise language.</li>
					<li>Re-run QA after visible edits; watch blockers drop.</li>
				</ul>
			</div>
		</aside>
	</div>
</section>
