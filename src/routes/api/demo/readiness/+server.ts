import { json, type RequestHandler } from '@sveltejs/kit';
import { loadAiConfig } from '$lib/server/ai/config';
import { createProviderRegistry } from '$lib/server/ai/providers';

type CheckId =
	| 'config_valid'
	| 'ai_provider'
	| 'text_generation'
	| 'api_key_status'
	| 'outage_policy'
	| 'security_mode'
	| 'image_generation'
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
	updatedAt: string;
}

function summarize(payload: ReadinessPayload): string {
	const missing = payload.checks.filter((check) => !check.ok).map((check) => check.label);
	if (payload.status === 'ready') return 'Ready to demo AI mode.';
	if (!missing.length) return 'Almost ready. Run one full playthrough check.';
	return `Blocked by: ${missing.join(', ')}.`;
}

function buildConfigFailurePayload(errorMessage: string): ReadinessPayload {
	return {
		score: 0,
		status: 'blocked',
		summary: 'Blocked by: AI runtime config is invalid.',
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
			weight: 5
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
	const criticalReady =
		checks.find((c) => c.id === 'ai_provider')?.ok &&
		checks.find((c) => c.id === 'text_generation')?.ok &&
		checks.find((c) => c.id === 'api_key_status')?.ok &&
		checks.find((c) => c.id === 'outage_policy')?.ok &&
		checks.find((c) => c.id === 'security_mode')?.ok;

	const status: ReadinessPayload['status'] = criticalReady
		? score >= 90
			? 'ready'
			: 'almost'
		: 'blocked';

	const payload: ReadinessPayload = {
		score,
		status,
		summary: '',
		checks,
		updatedAt: new Date().toISOString()
	};
	payload.summary = summarize(payload);
	return payload;
}

export const GET: RequestHandler = async (event) => {
	try {
		const payload = buildPayload();

		// Optional live probe enrichment for extra confidence without exposing secrets.
		if (payload.checks.find((check) => check.id === 'connectivity_probe')?.ok) {
			const config = loadAiConfig();
			const providers = createProviderRegistry(config);
			const probe = await providers.grok.probe?.();
			if (probe) {
				const probeOk = Boolean(probe.authValid && probe.modelAvailable);
				const existing = payload.checks.find((check) => check.id === 'connectivity_probe');
				if (existing) {
					existing.ok = probeOk;
					existing.details = probeOk
						? `Probe succeeded (${probe.latencyMs}ms)`
						: `Probe failed (Auth=${probe.authValid}, Model=${probe.modelAvailable})`;
				}
				payload.score = payload.checks.reduce(
					(sum, check) => sum + (check.ok ? check.weight : 0),
					0
				);
				payload.status = payload.score >= 90 ? 'ready' : payload.score >= 70 ? 'almost' : 'blocked';
				payload.summary = summarize(payload);
			}
		}

		return json(payload);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Failed to load AI runtime config';
		return json(buildConfigFailurePayload(errorMessage));
	}
};
