import { json, type RequestHandler } from '@sveltejs/kit';
import { loadAiConfig } from '$lib/server/ai/config';
import { createProviderRegistry } from '$lib/server/ai/providers';
import { getActiveStoryCartridge } from '$lib/stories';

type CheckId =
	| 'config_valid'
	| 'provider_grok'
	| 'text_enabled'
	| 'api_key_present'
	| 'outage_hard_fail'
	| 'auth_bypass_disabled'
	| 'image_mode_static_default'
	| 'provider_probe';

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
	updatedAt: string;
}

function summarize(payload: ReadinessPayload): string {
	const missing = payload.checks.filter((check) => !check.ok).map((check) => check.label);
	if (payload.status === 'ready') return 'Ready to demo Grok mode.';
	if (!missing.length) return 'Almost ready. Run one full playthrough check.';
	return `Blocked by: ${missing.join(', ')}.`;
}

function buildConfigFailurePayload(errorMessage: string): ReadinessPayload {
	return {
		score: 0,
		status: 'blocked',
		summary: 'Blocked by: AI runtime config is invalid.',
		activeStory: { id: 'unknown', title: 'unknown' },
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
			id: 'provider_grok',
			label: 'Grok provider selected',
			ok: config.provider === 'grok',
			details: `provider=${config.provider}`,
			weight: 20
		},
		{
			id: 'text_enabled',
			label: 'Grok text generation enabled',
			ok: config.enableGrokText,
			details: `ENABLE_GROK_TEXT=${config.enableGrokText ? '1' : '0'}`,
			weight: 15
		},
		{
			id: 'api_key_present',
			label: 'XAI_API_KEY is configured',
			ok: config.xaiApiKey.length > 0,
			details: config.xaiApiKey.length > 0 ? 'present' : 'missing',
			weight: 35
		},
		{
			id: 'outage_hard_fail',
			label: 'Outage mode is hard fail',
			ok: config.outageMode === 'hard_fail',
			details: `AI_OUTAGE_MODE=${config.outageMode}`,
			weight: 10
		},
		{
			id: 'auth_bypass_disabled',
			label: 'Auth bypass disabled',
			ok: !config.aiAuthBypass,
			details: `AI_AUTH_BYPASS=${config.aiAuthBypass ? '1' : '0'}`,
			weight: 10
		},
		{
			id: 'image_mode_static_default',
			label: 'Images default to pre-generated/static',
			ok: !config.enableGrokImages,
			details: config.enableGrokImages ? 'Grok image mode enabled' : 'static image default',
			weight: 5
		}
	];

	if (config.enableProviderProbe) {
		checks.push({
			id: 'provider_probe',
			label: 'Provider probe enabled',
			ok: true,
			details: 'ENABLE_PROVIDER_PROBE=1',
			weight: 5
		});
	} else {
		checks.push({
			id: 'provider_probe',
			label: 'Provider probe enabled',
			ok: false,
			details: 'ENABLE_PROVIDER_PROBE=0 (optional but recommended before demo)',
			weight: 5
		});
	}

	const score = checks.reduce((sum, check) => sum + (check.ok ? check.weight : 0), 0);
	const criticalReady =
		checks.find((c) => c.id === 'provider_grok')?.ok &&
		checks.find((c) => c.id === 'text_enabled')?.ok &&
		checks.find((c) => c.id === 'api_key_present')?.ok &&
		checks.find((c) => c.id === 'outage_hard_fail')?.ok &&
		checks.find((c) => c.id === 'auth_bypass_disabled')?.ok;

	const status: ReadinessPayload['status'] = criticalReady
		? score >= 90
			? 'ready'
			: 'almost'
		: 'blocked';

	const activeStory = getActiveStoryCartridge();
	const payload: ReadinessPayload = {
		score,
		status,
		summary: '',
		checks,
		activeStory: { id: activeStory.id, title: activeStory.title },
		updatedAt: new Date().toISOString()
	};
	payload.summary = summarize(payload);
	return payload;
}

export const GET: RequestHandler = async (event) => {
	try {
		const payload = buildPayload();

		// Optional live probe enrichment for extra confidence without exposing secrets.
		if (payload.checks.find((check) => check.id === 'provider_probe')?.ok) {
			const config = loadAiConfig();
			const providers = createProviderRegistry(config);
			const probe = await providers.grok.probe?.();
			if (probe) {
				const probeOk = Boolean(probe.authValid && probe.modelAvailable);
				const existing = payload.checks.find((check) => check.id === 'provider_probe');
				if (existing) {
					existing.ok = probeOk;
					existing.details = probeOk
						? `probe ok (${probe.latencyMs}ms)`
						: `probe failed (auth=${probe.authValid}, model=${probe.modelAvailable})`;
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
