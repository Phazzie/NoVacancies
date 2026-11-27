<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { gameStore } from '$lib/game';
	import { getLessonById } from '$lib/narrative/lessonsCatalog';
	import type { Scene, StoryThreads } from '$lib/contracts';

	let scene: Scene | null = null;
	let isProcessing = false;
	let error = '';
	let sceneCount = 0;
	let showLessons = true;
	let lessonDetails: ReturnType<typeof getLessonById> | null = null;
	let threads: StoryThreads | null = null;
	const choiceHotkeys = ['1', '2', '3'];

	const unsubscribe = gameStore.subscribe((state) => {
		scene = state.scene;
		isProcessing = state.isProcessing;
		error = state.error;
		sceneCount = state.gameState?.sceneCount || 0;
		threads = state.gameState?.storyThreads ?? null;
		showLessons = state.settings?.showLessons ?? true;
		lessonDetails =
			state.scene?.lessonId && Number.isInteger(state.scene.lessonId)
				? getLessonById(state.scene.lessonId)
				: null;
	});


	async function triggerChoiceByIndex(index: number): Promise<void> {
		if (!scene || isProcessing || index < 0 || index >= scene.choices.length) {
			return;
		}
		const selected = scene.choices[index];
		await choose(selected.id, selected.text);
	}

	function handleChoiceHotkeys(event: KeyboardEvent): void {
		const index = Number(event.key) - 1;
		if (!Number.isInteger(index) || index < 0 || index > 2) return;
		event.preventDefault();
		void triggerChoiceByIndex(index);
	}

	onMount(() => {
		gameStore.initialize();
		window.addEventListener('keydown', handleChoiceHotkeys);

		if (!scene) {
			(async () => {
				try {
					await gameStore.startGame();
				} catch {
					// error already mapped in store
				}
			})();
		}

		return () => {
			window.removeEventListener('keydown', handleChoiceHotkeys);
			unsubscribe();
		};
	});

	async function choose(choiceId: string, choiceText: string): Promise<void> {
		try {
			const result = await gameStore.choose(choiceId, choiceText);
			if (result.isEnding) {
				await goto('/ending');
			}
		} catch {
			// store captures message
		}
	}

	async function restartRun(): Promise<void> {
		if (isProcessing) return;
		try {
			await gameStore.startGame();
		} catch {
			// store captures message
		}
	}

	// Story threads rendered as account balances. Scales mirror the translation tables in
	// stories/no-vacancies/context.ts (0-3 for most, 0-5 for exhaustion).
	interface LedgerLine {
		label: string;
		value: number;
		max: number;
		note: string;
		red?: boolean;
	}

	function ledgerLines(t: StoryThreads): LedgerLine[] {
		return [
			{ label: 'Sees it clearly', value: t.sydneyRealization, max: 3, note: 'Sydney: "can\'t" vs "won\'t"' },
			{ label: 'Oswaldo notices', value: t.oswaldoAwareness, max: 3, note: 'Labor recognized as labor' },
			{ label: 'Oswaldo friction', value: t.oswaldoConflict, max: 3, note: 'Arguments on file', red: true },
			{ label: 'Trina friction', value: t.trinaTension, max: 3, note: 'Floor-space dispute', red: true },
			{ label: 'Dex relaying', value: t.dexTriangulation, max: 3, note: 'Confidences resold', red: true },
			{ label: 'Exhaustion', value: t.exhaustionLevel, max: 5, note: 'Interest on every interaction', red: true }
		];
	}

	function clamp(value: number, max: number): number {
		return Math.max(0, Math.min(max, Math.round(value)));
	}

	function imagePath(): string {
		return gameStore.getImagePath(scene?.imageKey, scene?.sceneId);
	}
</script>

{#if !scene}
	<section class="bu-paper bu-pending">
		{#if error}
			<p class="bu-doc-kicker">File frozen</p>
			<h2 class="bu-doc-title">Consumer Statement</h2>
			<p class="bu-doc-sub">
				The bureau could not reach its narrator, so no statement can be taken. Nothing on the file
				was changed.
			</p>
			<p class="error-banner">{error}</p>
			<div class="bu-statement-actions">
				<a class="bu-btn bu-btn-sm" href="/settings">Reporting preferences</a>
				<a class="bu-btn bu-btn-sm" href="/debug">Audit log</a>
			</div>
		{:else}
			<p class="bu-doc-kicker">File No. NV-0647</p>
			<h2 class="bu-doc-title">Consumer Statement</h2>
			<ul class="bu-pending-lines" aria-live="polite">
				<li>Pulling report</li>
				<li>Verifying identity: Sydney, 44</li>
				<li>Writing the next scene<span class="bu-cursor" aria-hidden="true"></span></li>
			</ul>
		{/if}
	</section>
{:else}
	<article class="bu-paper" data-testid="play-command-deck">
		<header class="bu-doc-head">
			<div>
				<p class="bu-doc-kicker">File No. NV-0647 · Consumer: Sydney</p>
				<h2 class="bu-doc-title">Consumer Statement</h2>
				<p class="bu-doc-sub">Reporting period {sceneCount}. Pick one response for the record.</p>
			</div>
			<div class="bu-statement-actions">
				<button class="bu-btn bu-btn-sm" on:click={restartRun} disabled={isProcessing}>
					Void &amp; reopen file
				</button>
				<a class="bu-btn bu-btn-sm" href="/debug">Audit log</a>
			</div>
		</header>

		{#if error}
			<p class="error-banner">{error}</p>
		{/if}

		<div class="bu-play">
			<div class="bu-play-main">
				<figure class="bu-exhibit">
					<img src={imagePath()} alt="Exhibit for reporting period {sceneCount}: the motel room" />
					<span class="bu-exhibit-tag">Exhibit {sceneCount}</span>
					<figcaption>
						<span>Period {sceneCount}</span>
						<span data-testid="mode-pill">AI-written record</span>
					</figcaption>
				</figure>

				<div class="scene-text">{scene.sceneText}</div>

				{#if showLessons && scene.lessonId}
					<section class="bu-remark-card">
						<p class="bu-remark-title">
							Bureau remark #{scene.lessonId}{#if lessonDetails}: {lessonDetails.title}{/if}
						</p>
						{#if lessonDetails}
							<p class="bu-remark-quote">{lessonDetails.quote}</p>
							<p class="bu-remark-body">{lessonDetails.insight}</p>
						{/if}
					</section>
				{/if}

				{#if scene.choices.length === 0}
					<div class="bu-statement-actions">
						<a class="bu-btn bu-btn-primary" href="/ending">Read final report</a>
					</div>
				{:else}
					<section class="bu-responses" aria-labelledby="responses-head">
						<div class="bu-responses-head">
							<span id="responses-head">Consumer response</span>
							<span>Keys 1 / 2 / 3</span>
						</div>
						<div class="bu-responses-list">
							{#each scene.choices as choice, index}
								<button
									class="choice-btn"
									on:click={() => triggerChoiceByIndex(index)}
									disabled={isProcessing}
								>
									<span class="choice-hotkey" aria-hidden="true">{choiceHotkeys[index]}</span>
									<span class="choice-copy">{choice.text}</span>
								</button>
							{/each}
						</div>
						{#if isProcessing}
							<p class="bu-fine" aria-live="polite">Posting response to file. Writing the next scene...</p>
						{/if}
					</section>
				{/if}
			</div>

			{#if threads}
				<aside class="bu-ledger" aria-label="Account balances">
					<p class="bu-ledger-head">Balances · Period {sceneCount}</p>
					{#each ledgerLines(threads) as line}
						<div class="bu-ledger-row">
							<div class="bu-ledger-row-top">
								<span>{line.label}</span>
								<span>{clamp(line.value, line.max)} / {line.max}</span>
							</div>
							<div class="bu-meter" class:bu-meter-red={line.red} aria-hidden="true">
								{#each Array(line.max) as _, i}
									<i class:on={i < clamp(line.value, line.max)}></i>
								{/each}
							</div>
							<p class="bu-ledger-note">{line.note}</p>
						</div>
					{/each}
					<div class="bu-ledger-row">
						<div class="bu-ledger-row-top">
							<span>Rent ($65 by 11 AM)</span>
							<span>{threads.moneyResolved ? 'Paid' : 'Open'}</span>
						</div>
						<p class="bu-ledger-note">
							{threads.moneyResolved ? 'Paid by Sydney. Reported under someone else.' : '$47 on hand. Clock says 6:47.'}
						</p>
					</div>
					<div class="bu-ledger-foot">
						<strong>Boundaries on record:</strong>
						{#if threads.boundariesSet.length}
							<ul>
								{#each threads.boundariesSet as boundary}
									<li>{boundary}</li>
								{/each}
							</ul>
						{:else}
							none yet.
						{/if}
					</div>
				</aside>
			{/if}
		</div>
	</article>
{/if}
