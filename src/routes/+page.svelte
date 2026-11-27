<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { gameStore } from '$lib/game';
	import { getSafeActiveStoryCartridge } from '$lib/stories';
	import { selectStoryPresentation } from '$lib/stories/selectors';

	interface ReadinessCheck {
		id: string;
		label: string;
		ok: boolean;
		details: string;
		weight: number;
	}

	interface ReadinessPayload {
		score: number;
		status: 'ready' | 'almost' | 'blocked';
		summary: string;
		checks: ReadinessCheck[];
		activeCartridge: {
			id: string;
			title: string;
			version: string;
		};
		imageGeneration: {
			attempts: number;
			successes: number;
			failures: number;
			averageLatencyMs: number | null;
			topRecentFailureCategories: Array<{ category: string; count: number }>;
			humanDiagnostics: string[];
		};
		updatedAt: string;
	}

	const activeStory = getSafeActiveStoryCartridge();
	const homeStoryTitle = activeStory?.title ?? 'Story Configuration Blocked';
	const presentation = selectStoryPresentation(activeStory, {
		metaDescription: 'Active story unavailable in home fallback mode.',
		shellKicker: 'Story engine / configuration blocked',
		homeKicker: 'Interactive fiction / configuration blocked',
		homeSubtitle: 'Check Story Selection',
		homeTagline:
			'The app could not resolve the selected story cartridge. Use settings to inspect configuration.',
		homeSupportCopy:
			'Until a valid story is selected, runtime and visible branding cannot stay in sync.',
		storyBriefItems: [
			'Builder and play routes stay available for troubleshooting.',
			'Check settings to configure the active story.'
		]
	});
	const isNoVacancies = activeStory?.id === 'no-vacancies';
	// The story's own voice-ceiling lines double as the bureau's remarks: real lines, not filler.
	const remarks = isNoVacancies ? (activeStory?.voice.voiceCeilingLines ?? []).slice(0, 6) : [];
	let readiness: ReadinessPayload | null = null;
	let readinessError = '';
	let readinessLoading = false;
	const pipelineCheckId = 'image_pipeline_status';

	async function loadReadiness(): Promise<void> {
		readinessError = '';
		readinessLoading = true;
		try {
			const response = await fetch('/api/demo/readiness');
			if (!response.ok) {
				const body = (await response.json().catch(() => ({ error: 'Failed to load readiness' }))) as {
					error?: string;
				};
				throw new Error(body.error || 'Failed to load readiness');
			}
			readiness = (await response.json()) as ReadinessPayload;
		} catch (error) {
			readiness = null;
			readinessError = error instanceof Error ? error.message : 'Failed to load readiness';
		} finally {
			readinessLoading = false;
		}
	}

	onMount(() => {
		void loadReadiness();
	});

	$: failingChecks = readiness?.checks?.filter((check) => !check.ok) ?? [];
	$: pipelineCheck = readiness?.checks?.find((check) => check.id === pipelineCheckId) ?? null;

	function beginStory(): void {
		gameStore.clearError();
		goto('/play');
	}
</script>

<div class="home-page">
	<article class="bu-paper home-report" aria-labelledby="report-title">
		<header class="bu-doc-head">
			<div>
				<p class="bu-doc-kicker">Consumer disclosure · Prepared for the consumer</p>
				<h1 class="bu-doc-title" id="report-title">{homeStoryTitle}</h1>
				<p class="bu-doc-sub">{presentation.homeTagline}</p>
			</div>
			<div class="bu-doc-ids">
				<span>File No. NV-0647</span>
				<span>Pulled 6:47 AM</span>
				<span>Page 1 of 1</span>
			</div>
		</header>

		{#if isNoVacancies}
			<p class="bu-stamp bu-stamp-float" aria-hidden="true">
				Paid in full
				<small>Credited to: someone else</small>
			</p>

			<section class="bu-section" aria-labelledby="sec-personal">
				<h2 class="bu-section-head" id="sec-personal">Personal information <span>§1</span></h2>
				<dl class="bu-fields">
					<div><dt>Consumer</dt><dd>SYDNEY</dd></div>
					<div><dt>Age</dt><dd>44</dd></div>
					<div><dt>Current address</dt><dd>Same motel room. Renewed daily.</dd></div>
					<div><dt>Employer</dt><dd>Self. 3 to 5 phones. Not verified.</dd></div>
					<div><dt>Also known as</dt><dd>"The one who handles it"</dd></div>
					<div><dt>Dependents claimed</dt><dd>0 (actual: 3)</dd></div>
					<div><dt>Drug screen</dt><dd>Positive. So is everyone in the room. Hers is the only one that pays rent.</dd></div>
				</dl>
			</section>

			<section class="bu-section" aria-labelledby="sec-score">
				<h2 class="bu-section-head" id="sec-score">Credit score <span>§2</span></h2>
				<div class="bu-score">
					<p class="bu-score-number">N/A</p>
					<div>
						<p class="bu-score-reason">Score unavailable: not enough credit history in consumer's own name.</p>
						<p class="bu-score-note">
							Every payment on this file went through. None of it was reported under her name.
						</p>
						<div class="bu-score-scale" aria-hidden="true"></div>
						<div class="bu-score-scale-labels" aria-hidden="true"><span>300</span><span>850</span></div>
					</div>
				</div>
			</section>

			<section class="bu-section" aria-labelledby="sec-accounts">
				<h2 class="bu-section-head" id="sec-accounts">Accounts <span>§3 · 4 open</span></h2>
				<div class="bu-table-wrap">
					<table class="bu-table bu-table-stack">
						<thead>
							<tr>
								<th scope="col">Account</th>
								<th scope="col">Terms</th>
								<th scope="col">Paid by</th>
								<th scope="col">Credited to</th>
								<th scope="col">Status</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td data-label="Account">Motel room, daily rate</td>
								<td data-label="Terms">$65 due by 11:00 AM. $47 on hand.</td>
								<td data-label="Paid by">Sydney</td>
								<td data-label="Credited to" class="bu-credited-other">The room</td>
								<td data-label="Status"><span class="bu-status bu-status-bad">$18 short</span></td>
							</tr>
							<tr>
								<td data-label="Account">Oswaldo (boyfriend)</td>
								<td data-label="Terms">Rent, food, smokes, patience</td>
								<td data-label="Paid by">Sydney</td>
								<td data-label="Credited to" class="bu-credited-other">Oswaldo</td>
								<td data-label="Status"><span class="bu-status bu-status-dim">Current (asleep)</span></td>
							</tr>
							<tr>
								<td data-label="Account">Trina (crashed on floor)</td>
								<td data-label="Terms">Referral money fronted; she hit six hundred</td>
								<td data-label="Paid by">Sydney</td>
								<td data-label="Credited to" class="bu-credited-other">Trina</td>
								<td data-label="Status"><span class="bu-status bu-status-warn">Forgotten</span></td>
							</tr>
							<tr>
								<td data-label="Account">Dex ("friend")</td>
								<td data-label="Terms">Listens, agrees, relays</td>
								<td data-label="Paid by">Sydney, in confidences</td>
								<td data-label="Credited to" class="bu-credited-other">Whoever Dex talks to next</td>
								<td data-label="Status"><span class="bu-status bu-status-bad">Disputed</span></td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			{#if remarks.length}
				<section class="bu-section" aria-labelledby="sec-remarks">
					<h2 class="bu-section-head" id="sec-remarks">Bureau remarks <span>§4</span></h2>
					<ol class="bu-remarks">
						{#each remarks as line}
							<li>{line}</li>
						{/each}
					</ol>
				</section>
			{/if}
		{:else}
			<section class="bu-section">
				<p class="bu-doc-sub">{presentation.homeSupportCopy}</p>
			</section>
		{/if}

		<section class="bu-section story-brief" aria-labelledby="sec-statement">
			<h2 class="bu-section-head" id="sec-statement">Consumer statement <span>§5 · optional</span></h2>
			<div class="bu-statement">
				<p class="bu-statement-prompt">
					You have the right to add a statement to your file. The bureau will not read it, but it
					will keep it on record.
				</p>
				<ul class="bu-fine">
					<li>Each turn, the AI writes one scene of Sydney's morning. You answer with one of three responses (keys 1, 2, 3).</li>
					<li>Every response moves a balance: who she sees clearly, what she stops paying for, how tired she gets.</li>
					<li>The file closes one of four ways. Most of them still bill her.</li>
				</ul>
				<div class="bu-statement-actions">
					<button class="bu-btn bu-btn-primary" on:click={beginStory}>Begin Statement</button>
					<a class="bu-btn" href="/builder">Open a new file (Builder)</a>
					<a class="bu-btn" href="/settings">Reporting preferences</a>
				</div>
			</div>
		</section>

		<footer class="bu-fine-print" data-testid="home-readiness">
			<div class="bu-fine-head">
				<p><strong>Bureau systems status.</strong> Disclosure required. Nobody reads it.</p>
				<button class="bu-btn bu-btn-sm" on:click={loadReadiness} disabled={readinessLoading}>
					{readinessLoading ? 'Re-pulling...' : 'Re-pull status'}
				</button>
			</div>
			{#if readinessError}
				<p class="error-banner">{readinessError}</p>
			{:else if !readiness}
				<p>Pulling system status...</p>
			{:else}
				<p data-testid="home-readiness-summary">
					<strong>{readiness.status.toUpperCase()}</strong>
					<span>{readiness.score}%</span>
					<span>v{readiness.activeCartridge.version}</span>
					<span>{readiness.summary}</span>
				</p>
				<dl>
					<div data-testid="home-active-cartridge">
						<dt>Active cartridge</dt>
						<dd>{readiness.activeCartridge.title} ({readiness.activeCartridge.id})</dd>
					</div>
					<div data-testid="home-active-story">
						<dt>Active story</dt>
						<dd>{homeStoryTitle}</dd>
					</div>
					<div data-testid="home-image-generation">
						<dt>Image generation</dt>
						<dd>
							{readiness.imageGeneration.successes}/{readiness.imageGeneration.attempts} successful
							{#if readiness.imageGeneration.averageLatencyMs !== null}
								· avg {readiness.imageGeneration.averageLatencyMs}ms
							{/if}
						</dd>
					</div>
					{#if pipelineCheck}
						<div data-testid="home-image-pipeline">
							<dt>Image pipeline</dt>
							<dd>{pipelineCheck.details}</dd>
						</div>
					{/if}
				</dl>
				{#if readiness.imageGeneration.humanDiagnostics.length}
					<ul aria-live="polite">
						{#each readiness.imageGeneration.humanDiagnostics as line}
							<li>{line}</li>
						{/each}
					</ul>
				{/if}
				{#if failingChecks.length > 0}
					<ul>
						{#each failingChecks as check}
							<li><strong>{check.label}:</strong> {check.details}</li>
						{/each}
					</ul>
				{/if}
			{/if}
		</footer>
	</article>
</div>
