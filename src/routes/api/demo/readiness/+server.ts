import { json, type RequestHandler } from '@sveltejs/kit';
import { loadAiConfig } from '$lib/server/ai/config';
import { createProviderRegistry, selectProbeProvider } from '$lib/server/ai/providers';
import { getActiveStoryCartridge } from '$lib/stories';
import { getImageGenerationDiagnostics, formatImageDiagnosticsSummary } from '$lib/server/ai/diagnostics';
import { NARRATIVE_CARTRIDGE } from '$lib/server/ai/narrative';
import { getImagePipeline } from '$lib/server/ai/imagePipeline';

type CheckId =
	| 'config_valid'
	| 'ai_provider'
	| 'text_generation'
	| 'api_key_status'
	| 'outage_policy'
	| 'security_mode'
	| 'image_generation'
	| 'image_pipeline_status'
	| 'connectivity_probe';

interface ReadinessCheck {
	id: CheckId;
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
	activeStory: { id: string; title: string };
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

interface ProbeResult {
	authValid: boolean;
	modelAvailable: boolean;
	latencyMs: number;
}

function summarize(payload: ReadinessPayload): string {
	const missing = payload.checks.filter((check) => !check.ok).map((check) => check.label);
	if (payload.status === 'ready') return 'Ready to demo AI mode.';
	if (!missing.length) return 'Almost ready. Run one full playthrough check.';
	return `Blocked by: ${missing.join(', ')}.`;
}

function buildConfigFailurePayload(errorMessage: string): ReadinessPayload {
	const imageGeneration = getImageGenerationDiagnostics();
	return {
		score: 0,
		status: 'blocked',
		summary: 'Blocked by: AI runtime config is invalid.',
		activeStory: { id: 'unknown', title: 'unknown' },
		activeCartridge: NARRATIVE_CARTRIDGE,
		imageGeneration: {
			...imageGeneration,
			humanDiagnostics: formatImageDiagnosticsSummary(imageGeneration)
		},
		updatedAt: new Date().toISOString(),
		checks: [
			{
				id: 'config_valid',
				label: 'AI runtime config is valid',
				ok: false,
				details: errorMessage,
				weight: 100
			}
		]
	};
}

function computeStatus(score: number, criticalReady: boolean): ReadinessPayload['status'] {
	// Probe enrichment can add confidence, but it must never upgrade a build that failed a critical gate.
	if (!criticalReady) return 'blocked';
	return score >= 90 ? 'ready' : 'almost';
}

function deriveReadinessStatus(
	score: number,
	checks: ReadinessCheck[]
): ReadinessPayload['status'] {
	const criticalReady =
		Boolean(checks.find((c) => c.id === 'ai_provider')?.ok) &&
		Boolean(checks.find((c) => c.id === 'text_generation')?.ok) &&
		Boolean(checks.find((c) => c.id === 'api_key_status')?.ok) &&
		Boolean(checks.find((c) => c.id === 'outage_policy')?.ok) &&
		Boolean(checks.find((c) => c.id === 'security_mode')?.ok);
	return computeStatus(score, criticalReady);
}

function applyProbeEnrichment(
	payload: ReadinessPayload,
	probe: ProbeResult | null | undefined
): ReadinessPayload {
	if (!probe) {
		return payload;
	}

	const enriched = structuredClone(payload);
	const probeOk = Boolean(probe.authValid && probe.modelAvailable);
	const existing = enriched.checks.find((check) => check.id === 'connectivity_probe');
	if (existing) {
		existing.ok = probeOk;
		existing.details = probeOk
			? `Probe succeeded (${probe.latencyMs}ms)`
			: 'Probe failed (provider check failed)';
	}

	enriched.score = enriched.checks.reduce((sum, check) => sum + (check.ok ? check.weight : 0), 0);
	enriched.status = deriveReadinessStatus(enriched.score, enriched.checks);
	enriched.summary = summarize(enriched);
	return enriched;
}

function buildPayload(): ReadinessPayload {
	const config = loadAiConfig();
	const checks: ReadinessCheck[] = [
		{
			id: 'ai_provider',
			label: 'AI Provider Configured',
			ok: config.provider === 'grok',
			details: 'Standard provider active',
			weight: 20
		},
		{
			id: 'text_generation',
			label: 'Text Generation Enabled',
			ok: config.enableGrokText,
			details: config.enableGrokText ? 'Generation active' : 'Generation disabled',
			weight: 15
		},
		{
			id: 'api_key_status',
			label: 'API Key Configured',
			ok: config.xaiApiKey.length > 0,
			details: config.xaiApiKey.length > 0 ? 'Key present' : 'Key missing',
			weight: 35
		},
		{
			id: 'outage_policy',
			label: 'Outage Policy Set',
			ok: config.outageMode === 'hard_fail',
			details: 'Strict outage handling',
			weight: 10
		},
		{
			id: 'security_mode',
			label: 'Security Mode Active',
			ok: !config.aiAuthBypass,
			details: !config.aiAuthBypass ? 'Security controls active' : 'Bypass enabled (Warning)',
			weight: 10
		},
		{
			id: 'image_generation',
			label: 'Image Generation Mode',
			ok: !config.enableGrokImages,
			details: config.enableGrokImages ? 'Dynamic generation' : 'Static defaults',
			weight: 4
		},
		{
			id: 'image_pipeline_status',
			label: 'Image pipeline instrumentation available',
			ok: true,
			details: 'status endpoint active',
			weight: 1
		}
	];

	if (config.enableProviderProbe) {
		checks.push({
			id: 'connectivity_probe',
			label: 'Connectivity Probe',
			ok: true,
			details: 'Probe enabled',
			weight: 5
		});
	} else {
		checks.push({
			id: 'connectivity_probe',
			label: 'Connectivity Probe',
			ok: false,
			details: 'Probe disabled',
			weight: 5
		});
	}

	const score = checks.reduce((sum, check) => sum + (check.ok ? check.weight : 0), 0);
	const activeStory = getActiveStoryCartridge();
	const imageGeneration = getImageGenerationDiagnostics();

	const pipeline = getImagePipeline().summary(5);
	const pipelineCheck = checks.find((check) => check.id === 'image_pipeline_status');
	if (pipelineCheck) {
		pipelineCheck.details = `inFlight=${pipeline.inFlight}, cache=${pipeline.cacheEntries}, total=${pipeline.totalRequests}`;
		if (pipeline.configError) {
			pipelineCheck.ok = false;
			pipelineCheck.details = `config_error=${pipeline.configError}`;
		}
	}

	const payload: ReadinessPayload = {
		score,
		status: deriveReadinessStatus(score, checks),
		summary: '',
		checks,
		activeStory: { id: activeStory.id, title: activeStory.title },
		activeCartridge: NARRATIVE_CARTRIDGE,
		imageGeneration: {
			...imageGeneration,
			humanDiagnostics: formatImageDiagnosticsSummary(imageGeneration)
		},
		updatedAt: new Date().toISOString()
	};
	payload.summary = summarize(payload);
	return payload;
}

export const GET: RequestHandler = async (event) => {
	try {
		let payload = buildPayload();

		// Optional live probe enrichment for extra confidence without exposing secrets.
		// Errors here must NOT replace the already-built readiness checklist —
		// only the connectivity_probe check should be downgraded on failure.
		if (payload.checks.find((check) => check.id === 'connectivity_probe')?.ok) {
			try {
				const config = loadAiConfig();
				const providers = createProviderRegistry(config);
				const probeProvider = selectProbeProvider(config, providers);
				const probe = await probeProvider.probe();
				payload = applyProbeEnrichment(payload, probe);
			} catch (probeError) {
				const probeCheck = payload.checks.find((c) => c.id === 'connectivity_probe');
				if (probeCheck) {
					probeCheck.ok = false;
					probeCheck.details =
						probeError instanceof Error ? probeError.message : 'Probe provider unavailable';
				}
				payload.score = payload.checks.reduce((sum, c) => sum + (c.ok ? c.weight : 0), 0);
				payload.status = deriveReadinessStatus(payload.score, payload.checks);
				payload.summary = summarize(payload);
			}
		}

		return json(payload);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Failed to load AI runtime config';
		return json(buildConfigFailurePayload(errorMessage));
	}
};
