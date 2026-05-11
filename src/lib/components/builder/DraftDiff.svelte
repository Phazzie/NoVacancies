<script lang="ts" context="module">
	export interface SnapshotSummary {
		id: string;
		draft_title: string;
		created_at: string;
	}

	export interface SnapshotDetail {
		id: string;
		draft_title: string;
		created_at: string;
		snapshot: import('$lib/stories/types').BuilderStoryDraft;
	}

	export type DiffEntryKind = 'string' | 'array';

	export interface StringDiffEntry {
		field: string;
		kind: 'string';
		oldValue: string;
		newValue: string;
	}

	export interface ArrayDiffEntry {
		field: string;
		kind: 'array';
		oldCount: number;
		newCount: number;
		added: string[];
		removed: string[];
	}

	export type DiffEntry = StringDiffEntry | ArrayDiffEntry;
</script>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { BuilderStoryDraft } from '$lib/stories/types';

	export let currentDraft: BuilderStoryDraft;
	export let snapshotId: string | null = null;

	type ViewState = 'idle' | 'loading' | 'ready' | 'error';
	type SaveState = 'idle' | 'saving' | 'saved' | 'error';

	const STRING_FIELDS: Array<keyof BuilderStoryDraft> = [
		'title',
		'premise',
		'setting',
		'aestheticStatement',
		'openingPrompt',
		'systemPrompt'
	];
	const TRUNCATE_AT = 120;

	const dispatch = createEventDispatcher<{
		snapshotSelected: { id: string | null };
		snapshotSaved: { id: string; createdAt: string };
	}>();

	let snapshots: SnapshotSummary[] = [];
	let listState: ViewState = 'idle';
	let listError = '';

	let detail: SnapshotDetail | null = null;
	let detailState: ViewState = 'idle';
	let detailError = '';

	let saveState: SaveState = 'idle';
	let saveError = '';

	let selectedId: string | null = snapshotId;

	$: if (snapshotId !== selectedId) {
		selectedId = snapshotId;
	}

	$: void loadSnapshotDetail(selectedId);

	$: diffEntries = detail ? computeDiff(detail.snapshot, currentDraft) : [];

	async function refreshSnapshotList(): Promise<void> {
		listState = 'loading';
		listError = '';
		try {
			const response = await fetch('/api/builder/snapshots');
			const payload = (await response.json().catch(() => ({}))) as {
				snapshots?: SnapshotSummary[];
				error?: string;
			};
			if (!response.ok) {
				throw new Error(payload.error || `Failed to load snapshots (${response.status}).`);
			}
			snapshots = payload.snapshots ?? [];
			listState = 'ready';
		} catch (error) {
			listState = 'error';
			listError = error instanceof Error ? error.message : 'Failed to load snapshots.';
		}
	}

	async function loadSnapshotDetail(id: string | null): Promise<void> {
		if (!id) {
			detail = null;
			detailState = 'idle';
			detailError = '';
			return;
		}
		detailState = 'loading';
		detailError = '';
		try {
			const response = await fetch(`/api/builder/snapshot/${encodeURIComponent(id)}`);
			const payload = (await response.json().catch(() => ({}))) as Partial<SnapshotDetail> & {
				error?: string;
			};
			if (!response.ok || !payload.snapshot) {
				throw new Error(payload.error || `Failed to load snapshot (${response.status}).`);
			}
			detail = payload as SnapshotDetail;
			detailState = 'ready';
		} catch (error) {
			detailState = 'error';
			detailError = error instanceof Error ? error.message : 'Failed to load snapshot.';
		}
	}

	async function saveSnapshot(): Promise<void> {
		saveState = 'saving';
		saveError = '';
		try {
			const response = await fetch('/api/builder/snapshot', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ draft: currentDraft })
			});
			const payload = (await response.json().catch(() => ({}))) as {
				id?: string;
				created_at?: string;
				error?: string;
			};
			if (!response.ok || !payload.id || !payload.created_at) {
				throw new Error(payload.error || `Failed to save snapshot (${response.status}).`);
			}
			saveState = 'saved';
			dispatch('snapshotSaved', { id: payload.id, createdAt: payload.created_at });
			await refreshSnapshotList();
		} catch (error) {
			saveState = 'error';
			saveError = error instanceof Error ? error.message : 'Failed to save snapshot.';
		}
	}

	function handleSelectChange(event: Event): void {
		const target = event.currentTarget as HTMLSelectElement;
		const value = target.value || null;
		selectedId = value;
		dispatch('snapshotSelected', { id: value });
	}

	function truncate(value: string): string {
		if (!value) return '';
		if (value.length <= TRUNCATE_AT) return value;
		return `${value.slice(0, TRUNCATE_AT)}…`;
	}

	function describeArrayItem(item: unknown, fieldKey: string): string {
		if (item == null) return '(empty)';
		if (typeof item === 'string') return item;
		if (typeof item !== 'object') return String(item);
		// Characters: { name, role, description }
		// Mechanics: { key, label, voiceMap }
		const typed = item as Record<string, unknown>;
		if (fieldKey === 'characters' && typeof typed.name === 'string') {
			const role = typeof typed.role === 'string' ? typed.role : '';
			return role ? `${typed.name} (${role})` : typed.name;
		}
		if (fieldKey === 'mechanics' && typeof typed.label === 'string') {
			const key = typeof typed.key === 'string' ? typed.key : '';
			return key ? `${typed.label} [${key}]` : typed.label;
		}
		// Last-resort fallback — stringify but keep it short.
		try {
			return truncate(JSON.stringify(item));
		} catch {
			return '(unprintable)';
		}
	}

	function arraySignature(item: unknown, fieldKey: string): string {
		// Identity used to compute added/removed sets. For strings that's the
		// string itself; for object arrays we use a stable canonical form.
		if (typeof item === 'string') return item;
		if (item == null) return '';
		try {
			return `${fieldKey}::${JSON.stringify(item)}`;
		} catch {
			return `${fieldKey}::unprintable`;
		}
	}

	function computeDiff(
		oldDraft: BuilderStoryDraft,
		newDraft: BuilderStoryDraft
	): DiffEntry[] {
		const entries: DiffEntry[] = [];

		for (const field of STRING_FIELDS) {
			const oldValue = (oldDraft[field] as string | undefined) ?? '';
			const newValue = (newDraft[field] as string | undefined) ?? '';
			if (oldValue !== newValue) {
				entries.push({
					field: String(field),
					kind: 'string',
					oldValue,
					newValue
				});
			}
		}

		const arrayFields: Array<keyof BuilderStoryDraft> = [
			'voiceCeilingLines',
			'characters',
			'mechanics'
		];
		for (const field of arrayFields) {
			const oldArr = Array.isArray(oldDraft[field])
				? (oldDraft[field] as unknown as readonly unknown[])
				: [];
			const newArr = Array.isArray(newDraft[field])
				? (newDraft[field] as unknown as readonly unknown[])
				: [];
			const oldSigs = oldArr.map((item) => arraySignature(item, String(field)));
			const newSigs = newArr.map((item) => arraySignature(item, String(field)));
			const oldSigSet = new Set(oldSigs);
			const newSigSet = new Set(newSigs);

			const added: string[] = [];
			const removed: string[] = [];
			newArr.forEach((item, index) => {
				if (!oldSigSet.has(newSigs[index])) {
					added.push(describeArrayItem(item, String(field)));
				}
			});
			oldArr.forEach((item, index) => {
				if (!newSigSet.has(oldSigs[index])) {
					removed.push(describeArrayItem(item, String(field)));
				}
			});

			const countChanged = oldArr.length !== newArr.length;
			if (countChanged || added.length > 0 || removed.length > 0) {
				entries.push({
					field: String(field),
					kind: 'array',
					oldCount: oldArr.length,
					newCount: newArr.length,
					added,
					removed
				});
			}
		}

		return entries;
	}

	function formatCreatedAt(value: string): string {
		try {
			const date = new Date(value);
			if (Number.isNaN(date.getTime())) return value;
			return date.toLocaleString();
		} catch {
			return value;
		}
	}

	// Eagerly fetch the snapshot list on mount so the dropdown is populated.
	refreshSnapshotList();
</script>

<section class="draft-diff" aria-label="Draft version comparison">
	<header class="diff-head">
		<div>
			<p class="diff-kicker">Draft history</p>
			<h3>Version comparison</h3>
		</div>
		<button
			type="button"
			class="diff-button"
			on:click={saveSnapshot}
			disabled={saveState === 'saving'}
			data-testid="draft-diff-save"
		>
			{saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : 'Save snapshot'}
		</button>
	</header>

	{#if saveState === 'error'}
		<p class="diff-error" role="alert">{saveError}</p>
	{/if}

	<label class="diff-picker" for="draft-diff-snapshot">
		<span>Compare against</span>
		<select
			id="draft-diff-snapshot"
			class="diff-select"
			value={selectedId ?? ''}
			on:change={handleSelectChange}
			disabled={listState === 'loading'}
			data-testid="draft-diff-select"
		>
			<option value="">— No snapshot selected —</option>
			{#each snapshots as snap (snap.id)}
				<option value={snap.id}>
					{snap.draft_title} · {formatCreatedAt(snap.created_at)}
				</option>
			{/each}
		</select>
	</label>

	{#if listState === 'error'}
		<p class="diff-error" role="alert">{listError}</p>
	{:else if listState === 'ready' && snapshots.length === 0}
		<p class="diff-empty">
			No snapshots yet. Save one before you regenerate to see what changed.
		</p>
	{/if}

	{#if !selectedId}
		<p class="diff-empty">
			Select a saved snapshot above to diff it against the current draft.
		</p>
	{:else if detailState === 'loading'}
		<p class="diff-empty" aria-live="polite">Loading snapshot…</p>
	{:else if detailState === 'error'}
		<p class="diff-error" role="alert">{detailError}</p>
	{:else if detailState === 'ready' && detail}
		<div class="diff-meta">
			<p>
				Snapshot: <strong>{detail.draft_title}</strong>
			</p>
			<p>Saved {formatCreatedAt(detail.created_at)}</p>
		</div>
		{#if diffEntries.length === 0}
			<p class="diff-empty">No differences — the current draft matches this snapshot.</p>
		{:else}
			<ul class="diff-list">
				{#each diffEntries as entry, index (index)}
					<li class="diff-entry" data-kind={entry.kind}>
						<p class="diff-entry-field"><code>{entry.field}</code></p>
						{#if entry.kind === 'string'}
							<div class="diff-string">
								<p class="diff-old">
									<span class="diff-old-label">Was</span>
									<span class="diff-old-text">{truncate(entry.oldValue) || '(empty)'}</span>
								</p>
								<p class="diff-new">
									<span class="diff-new-label">Now</span>
									<span class="diff-new-text">{truncate(entry.newValue) || '(empty)'}</span>
								</p>
							</div>
						{:else}
							<p class="diff-count">
								{entry.oldCount} item{entry.oldCount === 1 ? '' : 's'} → {entry.newCount} item{entry.newCount === 1 ? '' : 's'}
							</p>
							{#if entry.added.length > 0}
								<div class="diff-array-block diff-added">
									<p class="diff-array-label">Added</p>
									<ul>
										{#each entry.added as item, addIndex (addIndex)}
											<li>{truncate(item)}</li>
										{/each}
									</ul>
								</div>
							{/if}
							{#if entry.removed.length > 0}
								<div class="diff-array-block diff-removed">
									<p class="diff-array-label">Removed</p>
									<ul>
										{#each entry.removed as item, rmIndex (rmIndex)}
											<li>{truncate(item)}</li>
										{/each}
									</ul>
								</div>
							{/if}
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</section>

<style>
	.draft-diff {
		--diff-accent: var(--accent-bright, #6366f1);
		--diff-add: var(--sage-400, #22c55e);
		--diff-remove: var(--amber-400, #f59e0b);
		--diff-card-bg: rgba(18, 12, 9, 0.92);
		--diff-card-border: var(--line-soft, rgba(247, 241, 232, 0.12));
		--diff-card-border-strong: var(--line-strong, rgba(247, 241, 232, 0.22));
		--diff-text: var(--text-100, #f7f1e8);
		--diff-text-dim: var(--text-300, #b8aa9d);
		display: grid;
		gap: 0.85rem;
		padding: 1rem;
		border: 1px solid var(--diff-card-border);
		border-radius: 16px;
		background: linear-gradient(180deg, rgba(18, 12, 9, 0.92), rgba(10, 8, 7, 0.96));
		box-shadow: var(--shadow-md, 0 16px 36px rgba(0, 0, 0, 0.22));
		color: var(--diff-text);
	}

	.diff-head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.diff-head h3 {
		margin: 0.1rem 0 0;
		font-family: var(--font-display, serif);
		font-size: 1.1rem;
		color: var(--diff-text);
	}

	.diff-kicker {
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		font-size: 0.68rem;
		color: var(--diff-text-dim);
	}

	.diff-button {
		appearance: none;
		border: 1px solid var(--diff-card-border-strong);
		background: rgba(247, 241, 232, 0.04);
		color: var(--diff-text);
		font: inherit;
		font-size: 0.82rem;
		padding: 0.45rem 0.85rem;
		border-radius: 8px;
		cursor: pointer;
		transition: background 120ms ease-out, border-color 120ms ease-out;
	}

	.diff-button:hover:not(:disabled) {
		background: rgba(247, 241, 232, 0.08);
		border-color: var(--diff-accent);
	}

	.diff-button:disabled {
		cursor: not-allowed;
		opacity: 0.55;
	}

	.diff-picker {
		display: grid;
		gap: 0.35rem;
		font-size: 0.72rem;
		color: var(--diff-text-dim);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.diff-select {
		appearance: none;
		border: 1px solid var(--diff-card-border-strong);
		background: rgba(9, 7, 7, 0.55);
		color: var(--diff-text);
		font: inherit;
		font-size: 0.9rem;
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
		text-transform: none;
		letter-spacing: normal;
	}

	.diff-select:focus {
		outline: none;
		border-color: var(--diff-accent);
	}

	.diff-meta {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.4rem;
		font-size: 0.78rem;
		color: var(--diff-text-dim);
	}

	.diff-meta p {
		margin: 0;
	}

	.diff-meta strong {
		color: var(--diff-text);
		font-weight: 600;
	}

	.diff-empty {
		margin: 0;
		padding: 0.85rem;
		border: 1px dashed var(--diff-card-border-strong);
		border-radius: 12px;
		color: var(--diff-text-dim);
		font-size: 0.88rem;
	}

	.diff-error {
		margin: 0;
		padding: 0.85rem;
		border: 1px solid var(--diff-remove);
		border-radius: 12px;
		color: var(--diff-text);
		background: rgba(245, 158, 11, 0.08);
		font-size: 0.88rem;
	}

	.diff-list {
		list-style: none;
		display: grid;
		gap: 0.6rem;
		margin: 0;
		padding: 0;
	}

	.diff-entry {
		display: grid;
		gap: 0.4rem;
		padding: 0.7rem 0.8rem;
		border: 1px solid var(--diff-card-border-strong);
		border-left: 3px solid var(--diff-accent);
		border-radius: 10px;
		background: rgba(9, 7, 7, 0.55);
	}

	.diff-entry-field {
		margin: 0;
	}

	.diff-entry-field code {
		font-family: var(--font-mono, monospace);
		font-size: 0.78rem;
		padding: 0.1rem 0.4rem;
		border-radius: 6px;
		background: rgba(247, 241, 232, 0.08);
		color: var(--diff-text);
		letter-spacing: 0.02em;
	}

	.diff-string {
		display: grid;
		gap: 0.35rem;
	}

	.diff-old,
	.diff-new {
		margin: 0;
		display: grid;
		grid-template-columns: 3.5rem 1fr;
		align-items: baseline;
		gap: 0.5rem;
		font-size: 0.86rem;
		line-height: 1.4;
	}

	.diff-old-label,
	.diff-new-label {
		text-transform: uppercase;
		letter-spacing: 0.12em;
		font-size: 0.66rem;
		font-weight: 700;
	}

	.diff-old-label {
		color: var(--diff-remove);
	}

	.diff-new-label {
		color: var(--diff-add);
	}

	.diff-old-text {
		color: var(--diff-text-dim);
		text-decoration: line-through;
	}

	.diff-new-text {
		color: var(--diff-text);
		background: rgba(34, 197, 94, 0.08);
		padding: 0.05rem 0.3rem;
		border-radius: 4px;
	}

	.diff-count {
		margin: 0;
		font-size: 0.86rem;
		color: var(--diff-text);
	}

	.diff-array-block {
		display: grid;
		gap: 0.25rem;
		padding: 0.5rem 0.6rem;
		border-radius: 8px;
		background: rgba(247, 241, 232, 0.04);
	}

	.diff-array-block.diff-added {
		border-left: 2px solid var(--diff-add);
	}

	.diff-array-block.diff-removed {
		border-left: 2px solid var(--diff-remove);
	}

	.diff-array-label {
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		font-size: 0.66rem;
		font-weight: 700;
		color: var(--diff-text-dim);
	}

	.diff-array-block.diff-added .diff-array-label {
		color: var(--diff-add);
	}

	.diff-array-block.diff-removed .diff-array-label {
		color: var(--diff-remove);
	}

	.diff-array-block ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.2rem;
	}

	.diff-array-block li {
		font-size: 0.84rem;
		color: var(--diff-text);
		line-height: 1.35;
	}

	.diff-array-block.diff-removed li {
		color: var(--diff-text-dim);
		text-decoration: line-through;
	}
</style>
