<!--
  ShareCard — floating share panel for the story reader.

  Props:
    storyId   (required) — story identifier, used to build the canonical URL
    title     (optional) — human-readable story title shown in the card and
                           passed through to the OG image endpoint
    sceneId   (optional) — current scene label forwarded to the OG image
    beatCount (optional) — current beat count forwarded to the OG image
    role      (optional) — player's infrastructure role (forwarded to OG)

  Emits nothing (self-contained).

  Usage:
    <ShareCard storyId={data.storyId} title="No Vacancies" role={gameState.role} />
-->
<script lang="ts">
	import { browser } from '$app/environment';

	// ─── Props ─────────────────────────────────────────────────────────────────

	export let storyId: string;
	export let title = 'No Vacancies';
	export let sceneId: string | null = null;
	export let beatCount: number | null = null;
	export let role: string | null = null;

	// ─── State ─────────────────────────────────────────────────────────────────

	let copied = false;
	let open = false;
	let copyTimeout: ReturnType<typeof setTimeout> | null = null;

	// ─── Derived ───────────────────────────────────────────────────────────────

	$: canonicalUrl = browser
		? `${window.location.origin}/story/${encodeURIComponent(storyId)}`
		: `/story/${encodeURIComponent(storyId)}`;

	$: ogImageUrl = (() => {
		const params = new URLSearchParams({ title });
		if (sceneId) params.set('scene', sceneId);
		if (role) params.set('role', role);
		if (beatCount !== null) params.set('beat', String(beatCount));
		return `/api/og?${params.toString()}`;
	})();

	// ─── Actions ───────────────────────────────────────────────────────────────

	async function share() {
		if (browser && navigator.share) {
			try {
				await navigator.share({
					title,
					text: 'I just became infrastructure. Play No Vacancies.',
					url: canonicalUrl
				});
				return;
			} catch {
				// User cancelled or API unavailable — fall through to copy.
			}
		}
		await copyToClipboard();
	}

	async function copyToClipboard() {
		if (!browser) return;
		try {
			await navigator.clipboard.writeText(canonicalUrl);
		} catch {
			// Fallback for insecure contexts / older browsers.
			const el = document.createElement('textarea');
			el.value = canonicalUrl;
			el.style.position = 'fixed';
			el.style.opacity = '0';
			document.body.appendChild(el);
			el.select();
			document.execCommand('copy');
			document.body.removeChild(el);
		}
		copied = true;
		if (copyTimeout) clearTimeout(copyTimeout);
		copyTimeout = setTimeout(() => {
			copied = false;
		}, 2500);
	}

	function togglePanel() {
		open = !open;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Trigger button -->
<button
	class="share-trigger"
	aria-label="Share this story"
	aria-expanded={open}
	on:click={togglePanel}
>
	<svg class="share-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<circle cx="18" cy="5" r="3" stroke="currentColor" stroke-width="2"/>
		<circle cx="6" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
		<circle cx="18" cy="19" r="3" stroke="currentColor" stroke-width="2"/>
		<line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" stroke-width="2"/>
		<line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" stroke-width="2"/>
	</svg>
	Share
</button>

<!-- Dropdown panel -->
{#if open}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="backdrop" on:click={() => (open = false)} aria-hidden="true"/>

	<div class="panel" role="dialog" aria-modal="true" aria-label="Share story">
		<!-- OG image preview -->
		<div class="preview-wrap">
			<img
				src={ogImageUrl}
				alt="Story share preview"
				class="preview-img"
				width="1200"
				height="630"
				loading="lazy"
			/>
		</div>

		<!-- URL field + copy -->
		<div class="url-row">
			<span class="url-text" title={canonicalUrl}>{canonicalUrl}</span>
			<button class="copy-btn" on:click={copyToClipboard} aria-label="Copy link">
				{#if copied}
					<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
					</svg>
					Copied!
				{:else}
					<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
						<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2"/>
					</svg>
					Copy link
				{/if}
			</button>
		</div>

		<!-- Native share -->
		{#if browser && 'share' in navigator}
			<button class="native-share-btn" on:click={share}>
				Share via…
			</button>
		{/if}
	</div>
{/if}

<style>
	/* ── Trigger ──────────────────────────────────────────────────────────────── */

	.share-trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.45rem 1rem;
		border: 1px solid var(--color-border, #2a4060);
		border-radius: 6px;
		background: transparent;
		color: var(--color-muted, #94a3b8);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s, background 0.15s;
		position: relative;
	}

	.share-trigger:hover {
		color: var(--color-text, #f1f5f9);
		border-color: var(--color-accent, #f59e0b);
		background: rgba(245, 158, 11, 0.06);
	}

	.share-icon {
		width: 1rem;
		height: 1rem;
	}

	/* ── Backdrop ─────────────────────────────────────────────────────────────── */

	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 40;
		background: transparent;
	}

	/* ── Panel ────────────────────────────────────────────────────────────────── */

	.panel {
		position: absolute;
		z-index: 50;
		top: calc(100% + 8px);
		right: 0;
		width: clamp(300px, 90vw, 420px);
		background: var(--color-surface, #0d1a2e);
		border: 1px solid var(--color-border, #1e3a5f);
		border-radius: 10px;
		box-shadow:
			0 4px 24px rgba(0, 0, 0, 0.6),
			0 0 0 1px rgba(245, 158, 11, 0.08);
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	/* ── Preview ──────────────────────────────────────────────────────────────── */

	.preview-wrap {
		border-radius: 6px;
		overflow: hidden;
		border: 1px solid var(--color-border, #1e3a5f);
		background: #070c14;
		aspect-ratio: 1200 / 630;
	}

	.preview-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	/* ── URL row ──────────────────────────────────────────────────────────────── */

	.url-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--color-inset, #070c14);
		border: 1px solid var(--color-border, #1e3a5f);
		border-radius: 6px;
		padding: 0.4rem 0.5rem 0.4rem 0.75rem;
	}

	.url-text {
		flex: 1;
		font-family: 'Courier New', monospace;
		font-size: 0.78rem;
		color: var(--color-muted, #94a3b8);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.copy-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		flex-shrink: 0;
		padding: 0.3rem 0.65rem;
		border: 1px solid var(--color-accent, #f59e0b);
		border-radius: 5px;
		background: transparent;
		color: var(--color-accent, #f59e0b);
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
		white-space: nowrap;
	}

	.copy-btn:hover {
		background: rgba(245, 158, 11, 0.12);
	}

	.copy-btn svg {
		width: 0.9rem;
		height: 0.9rem;
	}

	/* ── Native share ─────────────────────────────────────────────────────────── */

	.native-share-btn {
		width: 100%;
		padding: 0.55rem;
		border: 1px solid var(--color-border, #1e3a5f);
		border-radius: 6px;
		background: transparent;
		color: var(--color-muted, #94a3b8);
		font-size: 0.875rem;
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s;
	}

	.native-share-btn:hover {
		color: var(--color-text, #f1f5f9);
		border-color: var(--color-muted, #64748b);
	}
</style>
