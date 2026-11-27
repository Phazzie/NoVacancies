<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { gameStore } from '$lib/game';
	import type { EndingPayload } from '$lib/game';
	import type { PageData } from './$types';
	import { getSafeActiveStoryCartridge } from '$lib/stories';

	// Final statuses and the consumer block are No Vacancies copy; other cartridges show stats only.
	const isNoVacancies = getSafeActiveStoryCartridge()?.id === 'no-vacancies';

	export let data: PageData;

	let ending: EndingPayload | null = null;
	let shareUrl = '';
	let shareCopied = false;
	let shareFailed = false;
	let shareUrlVisible = false;

	const unsubscribe = gameStore.subscribe((state) => {
		ending = state.ending as EndingPayload | null;
	});

	onMount(() => {
		gameStore.initialize();
		return () => unsubscribe();
	});

	// Deterministic precedence: active in-memory ending wins; URL params (from SSR load) are fallback.
	$: activeEnding = ending ?? data.urlEnding;

	$: if (activeEnding) {
		const params = new URLSearchParams({
			type: activeEnding.endingType,
			scenes: String(activeEnding.stats.sceneCount),
			lessons: String(activeEnding.stats.lessonsCount),
			duration: String(Math.floor(activeEnding.stats.durationMs / 60_000))
		});
		shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/ending?${params.toString()}`;
	}

	// Each ending type read as a final account status. Lines mirror the ending guidance in
	// stories/no-vacancies/prompts.ts so the report says what the story meant.
	const FINAL_STATUS: Record<string, { status: string; line: string; stamp: string; stampSmall: string }> = {
		loop: {
			status: 'Revolving. Balance carried forward.',
			line: 'Nothing changes. She just loses the excuse that it might.',
			stamp: 'Renewed daily',
			stampSmall: 'Same room, same terms'
		},
		shift: {
			status: 'Dispute accepted. New charges posted.',
			line: 'One boundary lands, then the room starts looking for a new loophole.',
			stamp: 'Partial credit',
			stampSmall: 'Pending review'
		},
		exit: {
			status: 'Closed by consumer. Balance transferred to consumer.',
			line: 'She leaves this room and carries the bill, the withdrawal, and the silence with her.',
			stamp: 'Account closed',
			stampSmall: 'Debt follows the consumer'
		},
		rare: {
			status: 'Acknowledged by co-signer. Reverts within 24 hours.',
			line: 'He names the damage once, then backslides before sunset.',
			stamp: 'Acknowledged',
			stampSmall: 'Once. On record.'
		}
	};

	$: finalStatus =
		activeEnding && isNoVacancies ? (FINAL_STATUS[activeEnding.endingType] ?? null) : null;

	function formatDuration(ms: number): string {
		const seconds = Math.round(ms / 1000);
		if (seconds < 60) return `${seconds}s`;
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}m ${remainingSeconds}s`;
	}

	async function playAgain(): Promise<void> {
		await gameStore.startGame();
		await goto('/play');
	}

	async function copyShareUrl(): Promise<void> {
		shareCopied = false;
		shareFailed = false;
		shareUrlVisible = false;

		try {
			await navigator.clipboard.writeText(shareUrl);
			shareCopied = true;
			setTimeout(() => { shareCopied = false; }, 2000);
		} catch {
			// Clipboard unavailable or denied — show URL for manual copy
			shareFailed = true;
			shareUrlVisible = true;
		}
	}
</script>

<section class="bu-paper">
	{#if !activeEnding}
		<div>
			<header class="bu-doc-head">
				<div>
					<p class="bu-doc-kicker">File No. NV-0647 · No closing entry</p>
					<h2 class="bu-doc-title">Final Report</h2>
					<p class="bu-doc-sub">
						This file has not been closed yet. Finish a statement and the bureau will print one.
					</p>
				</div>
			</header>
			<div class="bu-statement-actions">
				<a class="bu-btn bu-btn-primary" href="/play">Go to statement</a>
				<a class="bu-btn" href="/debug">Audit log</a>
			</div>
		</div>
	{:else}
		<div>
			<header class="bu-doc-head">
				<div>
					<p class="bu-doc-kicker">File No. NV-0647 · Closing entry</p>
					<h2 class="bu-doc-title">Final Report</h2>
					<p class="bu-doc-sub">What the file shows when the bureau stops taking statements.</p>
				</div>
				{#if isNoVacancies}
					<div class="bu-doc-ids">
						<span>Consumer: Sydney, 44</span>
						<span>Address: same motel room</span>
					</div>
				{/if}
			</header>

			<div class="bu-final-status">
				<div>
					<p class="bu-final-label">Account status</p>
					<p class="ending-title">{activeEnding.endingType}</p>
					{#if finalStatus}
						<p class="bu-final-meaning">{finalStatus.status}</p>
						<p class="bu-final-line">{finalStatus.line}</p>
					{/if}
				</div>
				{#if finalStatus}
					<p class="bu-stamp bu-final-stamp" aria-hidden="true">
						{finalStatus.stamp}
						<small>{finalStatus.stampSmall}</small>
					</p>
				{/if}
			</div>

			<section class="bu-section" aria-labelledby="final-activity">
				<h3 class="bu-section-head" id="final-activity">Activity this period</h3>
				<dl class="bu-fields">
					<div>
						<dt>Statements filed</dt>
						<dd>{activeEnding.stats.sceneCount}</dd>
					</div>
					<div>
						<dt>Bureau remarks</dt>
						<dd>{activeEnding.stats.lessonsCount}</dd>
					</div>
					<div>
						<dt>Time on file</dt>
						<dd>{formatDuration(activeEnding.stats.durationMs)}</dd>
					</div>
					<div>
						<dt>Credit earned</dt>
						<dd>None reported</dd>
					</div>
				</dl>
			</section>
		</div>
		<div class="bu-statement-actions">
			<button class="bu-btn bu-btn-primary" on:click={playAgain}>Open a new period</button>
			<button class="bu-btn" on:click={copyShareUrl}>
				{#if shareCopied}Link copied{:else}Request a copy (share){/if}
			</button>
			{#if ending}
				<a class="bu-btn" href="/play">Back to statement</a>
			{/if}
			<a class="bu-btn" href="/debug">Audit log</a>
		</div>
		{#if shareFailed}
			<p class="share-status-error">The bureau could not reach your clipboard. Copy the link below:</p>
		{/if}
		{#if shareUrlVisible}
			<div class="share-fallback">
				<p class="share-fallback-label">Shareable copy of this report:</p>
				<input
					class="share-fallback-input"
					type="text"
					readonly
					aria-label="Shareable report link"
					value={shareUrl}
					on:click={(e) => (e.currentTarget as HTMLInputElement).select()}
				/>
			</div>
		{/if}
	{/if}
</section>
