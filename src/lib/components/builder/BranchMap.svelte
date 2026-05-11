<script lang="ts" context="module">
	export interface BranchMapChoice {
		targetId: string;
		label?: string;
	}

	export interface BranchMapNode {
		id: string;
		title: string;
		choices: BranchMapChoice[];
		isEnding?: boolean;
	}

	export interface BranchMapSelectDetail {
		nodeId: string;
	}
</script>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let nodes: BranchMapNode[] = [];
	export let activeNodeId: string | null = null;
	export let title: string = 'Branch map';

	const dispatch = createEventDispatcher<{ selectNode: BranchMapSelectDetail }>();

	// ── Layout constants ────────────────────────────────────────────────────
	const NODE_WIDTH = 168;
	const NODE_HEIGHT = 56;
	const HORIZONTAL_GAP = 24;
	const VERTICAL_GAP = 84;
	const MARGIN_X = 32;
	const MARGIN_Y = 24;
	const TITLE_TRUNCATE = 30;

	type Positioned = {
		node: BranchMapNode;
		depth: number;
		x: number;
		y: number;
	};

	type LayoutEdge = {
		from: Positioned;
		to: Positioned;
		path: string;
	};

	type Layout = {
		positioned: Map<string, Positioned>;
		edges: LayoutEdge[];
		width: number;
		height: number;
	};

	function truncate(value: string, limit: number): string {
		if (!value) return '(untitled)';
		if (value.length <= limit) return value;
		return `${value.slice(0, Math.max(0, limit - 1))}…`;
	}

	function curvePath(from: Positioned, to: Positioned): string {
		const x1 = from.x + NODE_WIDTH / 2;
		const y1 = from.y + NODE_HEIGHT;
		const x2 = to.x + NODE_WIDTH / 2;
		const y2 = to.y;
		const midY = (y1 + y2) / 2;
		return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
	}

	/**
	 * BFS layout assigning x/y to every reachable node. Each node is rendered
	 * once at its shallowest depth (diamond / merge tolerant). Unreachable
	 * nodes (no path from any root) are appended after the reachable ones at a
	 * synthetic "orphan" depth so the user can still see + click them.
	 */
	function computeLayout(input: BranchMapNode[]): Layout {
		const byId = new Map<string, BranchMapNode>();
		for (const node of input) {
			if (node && typeof node.id === 'string') byId.set(node.id, node);
		}

		// Find roots: nodes that are not targeted by any other node's choice.
		const targeted = new Set<string>();
		for (const node of input) {
			for (const choice of node?.choices ?? []) {
				if (choice && typeof choice.targetId === 'string') targeted.add(choice.targetId);
			}
		}
		const roots = input.filter((node) => node && !targeted.has(node.id));
		// Fallback root: if every node is targeted (cycle through every node), pick the first.
		if (roots.length === 0 && input.length > 0) {
			roots.push(input[0]);
		}

		// BFS to assign shallowest depth to each reachable node.
		const depths = new Map<string, number>();
		const queue: Array<{ id: string; depth: number }> = roots.map((node) => ({
			id: node.id,
			depth: 0
		}));
		while (queue.length > 0) {
			const { id, depth } = queue.shift()!;
			const previous = depths.get(id);
			if (previous !== undefined && previous <= depth) continue;
			depths.set(id, depth);
			const node = byId.get(id);
			if (!node) continue;
			for (const choice of node.choices ?? []) {
				if (!choice || typeof choice.targetId !== 'string') continue;
				if (!byId.has(choice.targetId)) continue;
				queue.push({ id: choice.targetId, depth: depth + 1 });
			}
		}

		// Bucket reachable nodes by depth, preserving original input order for stability.
		const reachableIds = new Set(depths.keys());
		const buckets: BranchMapNode[][] = [];
		for (const node of input) {
			if (!reachableIds.has(node.id)) continue;
			const depth = depths.get(node.id)!;
			while (buckets.length <= depth) buckets.push([]);
			buckets[depth].push(node);
		}

		// Append orphans (nodes never reached) as an extra trailing level so they are visible.
		const orphans = input.filter((node) => node && !reachableIds.has(node.id));
		if (orphans.length > 0) {
			buckets.push(orphans);
			for (const orphan of orphans) {
				depths.set(orphan.id, buckets.length - 1);
			}
		}

		// Compute level widths to centre-align each level under the widest one.
		const levelWidths = buckets.map(
			(level) => level.length * NODE_WIDTH + Math.max(0, level.length - 1) * HORIZONTAL_GAP
		);
		const maxWidth = Math.max(NODE_WIDTH, ...levelWidths);

		const positioned = new Map<string, Positioned>();
		buckets.forEach((level, depth) => {
			const width = levelWidths[depth];
			const offset = MARGIN_X + (maxWidth - width) / 2;
			level.forEach((node, index) => {
				const x = offset + index * (NODE_WIDTH + HORIZONTAL_GAP);
				const y = MARGIN_Y + depth * (NODE_HEIGHT + VERTICAL_GAP);
				positioned.set(node.id, { node, depth, x, y });
			});
		});

		// Build edges only for connections that land in the laid-out set.
		const edges: LayoutEdge[] = [];
		for (const node of input) {
			const from = positioned.get(node.id);
			if (!from) continue;
			for (const choice of node.choices ?? []) {
				if (!choice || typeof choice.targetId !== 'string') continue;
				const to = positioned.get(choice.targetId);
				if (!to) continue;
				edges.push({ from, to, path: curvePath(from, to) });
			}
		}

		const totalWidth = MARGIN_X * 2 + maxWidth;
		const totalHeight =
			MARGIN_Y * 2 +
			Math.max(NODE_HEIGHT, buckets.length * NODE_HEIGHT + Math.max(0, buckets.length - 1) * VERTICAL_GAP);

		return { positioned, edges, width: totalWidth, height: totalHeight };
	}

	function classify(node: BranchMapNode): 'ending' | 'dead-end' | 'normal' {
		if (node.isEnding) return 'ending';
		const choices = node.choices ?? [];
		if (choices.length === 0) return 'dead-end';
		return 'normal';
	}

	function handleSelect(nodeId: string): void {
		dispatch('selectNode', { nodeId });
	}

	function handleKeydown(event: KeyboardEvent, nodeId: string): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleSelect(nodeId);
		}
	}

	$: layout = computeLayout(nodes);
	$: positionedNodes = Array.from(layout.positioned.values());
	$: deadEndCount = positionedNodes.filter(({ node }) => classify(node) === 'dead-end').length;
	$: endingCount = positionedNodes.filter(({ node }) => classify(node) === 'ending').length;
</script>

<section class="branch-map" aria-label={title}>
	<header class="branch-map-head">
		<div>
			<p class="branch-map-kicker">Structure overview</p>
			<h3>{title}</h3>
		</div>
		<dl class="branch-map-legend" aria-label="Legend">
			<div>
				<dt><span class="branch-map-swatch is-active" aria-hidden="true"></span></dt>
				<dd>Active</dd>
			</div>
			<div>
				<dt><span class="branch-map-swatch is-dead-end" aria-hidden="true"></span></dt>
				<dd>Dead end ({deadEndCount})</dd>
			</div>
			<div>
				<dt><span class="branch-map-swatch is-ending" aria-hidden="true"></span></dt>
				<dd>Ending ({endingCount})</dd>
			</div>
		</dl>
	</header>

	{#if positionedNodes.length === 0}
		<p class="branch-map-empty">
			No nodes to map yet. The branch map will render as soon as the draft has structure.
		</p>
	{:else}
		<div class="branch-map-scroll" role="group" aria-label="{title} graph">
			<svg
				class="branch-map-svg"
				viewBox="0 0 {layout.width} {layout.height}"
				width={layout.width}
				height={layout.height}
				role="img"
				aria-label="Story branch graph with {positionedNodes.length} nodes"
			>
				<g class="branch-map-edges" aria-hidden="true">
					{#each layout.edges as edge (edge.from.node.id + '->' + edge.to.node.id)}
						<path d={edge.path} class="branch-map-edge" fill="none" />
					{/each}
				</g>
				<g class="branch-map-nodes">
					{#each positionedNodes as { node, x, y } (node.id)}
						{@const kind = classify(node)}
						{@const isActive = activeNodeId === node.id}
						{@const choiceCount = (node.choices ?? []).length}
						<g
							class="branch-map-node"
							class:is-active={isActive}
							class:is-dead-end={kind === 'dead-end'}
							class:is-ending={kind === 'ending'}
							transform="translate({x} {y})"
							role="button"
							tabindex="0"
							aria-label={`${node.title || 'Untitled node'} — ${
								kind === 'ending'
									? 'ending'
									: kind === 'dead-end'
										? 'dead end, no choices'
										: `${choiceCount} ${choiceCount === 1 ? 'choice' : 'choices'}`
							}${isActive ? ', currently selected' : ''}`}
							aria-pressed={isActive}
							on:click={() => handleSelect(node.id)}
							on:keydown={(event) => handleKeydown(event, node.id)}
						>
							<rect
								class="branch-map-card"
								width={NODE_WIDTH}
								height={NODE_HEIGHT}
								rx="10"
								ry="10"
							/>
							<text class="branch-map-title" x="12" y="22">
								{truncate(node.title || '(untitled)', TITLE_TRUNCATE)}
							</text>
							<g class="branch-map-badge" transform="translate({NODE_WIDTH - 38} {NODE_HEIGHT - 22})">
								<rect width="28" height="16" rx="8" ry="8" />
								<text x="14" y="11">{kind === 'ending' ? 'END' : choiceCount}</text>
							</g>
							<text class="branch-map-meta" x="12" y="44">
								{kind === 'ending'
									? 'ending'
									: kind === 'dead-end'
										? 'no choices'
										: `${choiceCount} ${choiceCount === 1 ? 'choice' : 'choices'}`}
							</text>
						</g>
					{/each}
				</g>
			</svg>
		</div>
	{/if}
</section>

<style>
	.branch-map {
		--branch-map-accent: var(--accent-bright, #6366f1);
		--branch-map-dead-end: var(--amber-400, #f59e0b);
		--branch-map-ending: var(--sage-400, #22c55e);
		--branch-map-card-bg: rgba(18, 12, 9, 0.92);
		--branch-map-card-border: var(--line-soft, rgba(247, 241, 232, 0.12));
		--branch-map-card-border-strong: var(--line-strong, rgba(247, 241, 232, 0.22));
		--branch-map-text: var(--text-100, #f7f1e8);
		--branch-map-text-dim: var(--text-300, #b8aa9d);
		--branch-map-edge: rgba(247, 241, 232, 0.18);
		display: grid;
		gap: 0.85rem;
		padding: 1rem;
		border: 1px solid var(--branch-map-card-border);
		border-radius: 16px;
		background: linear-gradient(180deg, rgba(18, 12, 9, 0.92), rgba(10, 8, 7, 0.96));
		box-shadow: var(--shadow-md, 0 16px 36px rgba(0, 0, 0, 0.22));
		color: var(--branch-map-text);
	}

	.branch-map-head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.branch-map-head h3 {
		margin: 0.1rem 0 0;
		font-family: var(--font-display, serif);
		font-size: 1.1rem;
		color: var(--branch-map-text);
	}

	.branch-map-kicker {
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		font-size: 0.68rem;
		color: var(--branch-map-text-dim);
	}

	.branch-map-legend {
		display: grid;
		grid-template-columns: repeat(3, auto);
		gap: 0.35rem 0.8rem;
		margin: 0;
		font-size: 0.75rem;
		color: var(--branch-map-text-dim);
	}

	.branch-map-legend > div {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}

	.branch-map-legend dt,
	.branch-map-legend dd {
		margin: 0;
	}

	.branch-map-swatch {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 3px;
		border: 1.5px solid currentColor;
		background: transparent;
	}

	.branch-map-swatch.is-active {
		color: var(--branch-map-accent);
	}

	.branch-map-swatch.is-dead-end {
		color: var(--branch-map-dead-end);
	}

	.branch-map-swatch.is-ending {
		color: var(--branch-map-ending);
	}

	.branch-map-empty {
		margin: 0;
		padding: 0.85rem;
		border: 1px dashed var(--branch-map-card-border-strong);
		border-radius: 12px;
		color: var(--branch-map-text-dim);
		font-size: 0.9rem;
	}

	.branch-map-scroll {
		max-height: 520px;
		overflow: auto;
		border-radius: 12px;
		background: rgba(9, 7, 7, 0.55);
		border: 1px solid var(--branch-map-card-border);
	}

	.branch-map-svg {
		display: block;
		min-width: 100%;
	}

	.branch-map-edge {
		stroke: var(--branch-map-edge);
		stroke-width: 1.5;
		stroke-linecap: round;
	}

	.branch-map-node {
		cursor: pointer;
		outline: none;
	}

	.branch-map-node:focus-visible .branch-map-card {
		stroke: var(--branch-map-accent);
		stroke-width: 2.5;
	}

	.branch-map-card {
		fill: var(--branch-map-card-bg);
		stroke: var(--branch-map-card-border-strong);
		stroke-width: 1.25;
		transition: stroke 120ms ease-out, fill 120ms ease-out;
	}

	.branch-map-node:hover .branch-map-card {
		fill: rgba(28, 22, 20, 0.96);
	}

	.branch-map-node.is-dead-end .branch-map-card {
		stroke: var(--branch-map-dead-end);
		stroke-width: 2;
	}

	.branch-map-node.is-ending .branch-map-card {
		stroke: var(--branch-map-ending);
		stroke-width: 2;
	}

	.branch-map-node.is-active .branch-map-card {
		stroke: var(--branch-map-accent);
		stroke-width: 2.5;
	}

	.branch-map-title {
		fill: var(--branch-map-text);
		font-family: var(--font-body, sans-serif);
		font-size: 13px;
		font-weight: 600;
		dominant-baseline: middle;
	}

	.branch-map-meta {
		fill: var(--branch-map-text-dim);
		font-family: var(--font-body, sans-serif);
		font-size: 11px;
		letter-spacing: 0.04em;
	}

	.branch-map-badge rect {
		fill: rgba(247, 241, 232, 0.08);
		stroke: var(--branch-map-card-border-strong);
		stroke-width: 1;
	}

	.branch-map-node.is-ending .branch-map-badge rect {
		fill: rgba(122, 149, 116, 0.18);
		stroke: var(--branch-map-ending);
	}

	.branch-map-node.is-dead-end .branch-map-badge rect {
		fill: rgba(237, 178, 110, 0.16);
		stroke: var(--branch-map-dead-end);
	}

	.branch-map-badge text {
		fill: var(--branch-map-text);
		font-family: var(--font-mono, monospace);
		font-size: 10px;
		font-weight: 700;
		text-anchor: middle;
		dominant-baseline: middle;
	}
</style>
