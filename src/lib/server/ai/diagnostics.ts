import type { AiErrorCode } from '$lib/server/ai/provider.interface';

export interface CartridgeDescriptor {
	id: string;
	title: string;
	version: string;
}

export interface ImageGenerationDiagnosticsSnapshot {
	attempts: number;
	successes: number;
	failures: number;
	averageLatencyMs: number | null;
	topRecentFailureCategories: Array<{ category: string; count: number }>;
}

interface ImageGenerationDiagnosticsState {
	attempts: number;
	successes: number;
	failures: number;
	totalLatencyMs: number;
	latencySamples: number;
	recentFailureCategories: string[];
}

const MAX_RECENT_FAILURES = 50;

const imageState: ImageGenerationDiagnosticsState = {
	attempts: 0,
	successes: 0,
	failures: 0,
	totalLatencyMs: 0,
	latencySamples: 0,
	recentFailureCategories: []
};

function toSafeCategory(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9_.-]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, 60);
}

function pushFailureCategory(category: string): void {
	if (!category) return;
	imageState.recentFailureCategories.unshift(category);
	if (imageState.recentFailureCategories.length > MAX_RECENT_FAILURES) {
		imageState.recentFailureCategories = imageState.recentFailureCategories.slice(0, MAX_RECENT_FAILURES);
	}
}

export function recordImageGenerationSuccess(latencyMs: number): void {
	imageState.attempts += 1;
	imageState.successes += 1;
	if (Number.isFinite(latencyMs) && latencyMs >= 0) {
		imageState.totalLatencyMs += latencyMs;
		imageState.latencySamples += 1;
	}
}

export function recordImageGenerationFailure(input: {
	latencyMs: number;
	code?: AiErrorCode | null;
	status?: number | null;
	message?: string | null;
}): void {
	imageState.attempts += 1;
	imageState.failures += 1;
	if (Number.isFinite(input.latencyMs) && input.latencyMs >= 0) {
		imageState.totalLatencyMs += input.latencyMs;
		imageState.latencySamples += 1;
	}

	const primary = toSafeCategory(String(input.code ?? '').trim());
	if (primary) {
		pushFailureCategory(primary);
		return;
	}

	if (typeof input.status === 'number' && Number.isFinite(input.status) && input.status > 0) {
		pushFailureCategory(`http_${Math.trunc(input.status)}`);
		return;
	}

	pushFailureCategory('unknown');
}

export function getImageGenerationDiagnostics(): ImageGenerationDiagnosticsSnapshot {
	const avgLatency =
		imageState.latencySamples > 0
			? Math.round(imageState.totalLatencyMs / imageState.latencySamples)
			: null;

	const counts = new Map<string, number>();
	for (const category of imageState.recentFailureCategories) {
		counts.set(category, (counts.get(category) ?? 0) + 1);
	}

	const topRecentFailureCategories = [...counts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([category, count]) => ({ category, count }));

	return {
		attempts: imageState.attempts,
		successes: imageState.successes,
		failures: imageState.failures,
		averageLatencyMs: avgLatency,
		topRecentFailureCategories
	};
}

export function formatImageDiagnosticsSummary(snapshot: ImageGenerationDiagnosticsSnapshot): string[] {
	const lines: string[] = [];
	const avg = snapshot.averageLatencyMs === null ? 'n/a (no samples yet)' : `${snapshot.averageLatencyMs}ms`;
	lines.push(
		`Image generation attempts: ${snapshot.attempts} (success ${snapshot.successes}, failed ${snapshot.failures}).`
	);
	lines.push(`Average image generation latency: ${avg}.`);
	if (snapshot.topRecentFailureCategories.length === 0) {
		lines.push('Recent failure categories: none recorded.');
	} else {
		const rendered = snapshot.topRecentFailureCategories
			.map((item) => `${item.category} (${item.count})`)
			.join(', ');
		lines.push(`Recent failure categories: ${rendered}.`);
	}
	return lines;
}
