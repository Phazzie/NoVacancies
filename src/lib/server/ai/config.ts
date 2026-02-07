import type { AiProviderName } from '$lib/server/ai/provider.interface';

export type AiOutageMode = 'mock_fallback' | 'hard_fail';

const runtimeEnv: Record<string, string | undefined> =
	(globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

export interface AiConfig {
	provider: AiProviderName;
	enableGrokText: boolean;
	enableGrokImages: boolean;
	enableProviderProbe: boolean;
	outageMode: AiOutageMode;
	xaiApiKey: string;
	grokTextModel: string;
	grokImageModel: string;
	maxOutputTokens: number;
	requestTimeoutMs: number;
	maxRetries: number;
	retryBackoffMs: number[];
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
	if (typeof value !== 'string') return fallback;
	const normalized = value.trim().toLowerCase();
	if (['1', 'true', 'on', 'yes', 'enabled'].includes(normalized)) return true;
	if (['0', 'false', 'off', 'no', 'disabled'].includes(normalized)) return false;
	return fallback;
}

function parseIntInRange(value: string | undefined, fallback: number, min: number, max: number): number {
	if (typeof value !== 'string' || value.trim().length === 0) return fallback;
	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.min(max, Math.max(min, parsed));
}

function parseProvider(value: string | undefined): AiProviderName {
	return value === 'grok' ? 'grok' : 'mock';
}

function parseOutageMode(value: string | undefined): AiOutageMode | null {
	if (value === 'mock_fallback' || value === 'hard_fail') return value;
	return null;
}

function isProdLikeEnv(env: Record<string, string | undefined>): boolean {
	const vercelEnv = env.VERCEL_ENV?.toLowerCase();
	if (vercelEnv === 'preview' || vercelEnv === 'production') return true;
	return env.NODE_ENV === 'production';
}

export function loadAiConfig(env: Record<string, string | undefined> = runtimeEnv): AiConfig {
	const provider = parseProvider(env.AI_PROVIDER);
	const prodLike = isProdLikeEnv(env);
	const defaultOutageMode: AiOutageMode = 'mock_fallback';
	const parsedOutageMode = parseOutageMode(env.AI_OUTAGE_MODE);

	if (prodLike && !parsedOutageMode) {
		throw new Error('AI_OUTAGE_MODE must be set in preview/production');
	}

	const outageMode = parsedOutageMode ?? defaultOutageMode;
	const enableGrokText = parseBoolean(env.ENABLE_GROK_TEXT, provider === 'grok');
	const enableGrokImages = parseBoolean(env.ENABLE_GROK_IMAGES, provider === 'grok');
	const enableProviderProbe = parseBoolean(env.ENABLE_PROVIDER_PROBE, false);
	const xaiApiKey = (env.XAI_API_KEY ?? '').trim();

	if ((provider === 'grok' || enableGrokText || enableGrokImages || enableProviderProbe) && !xaiApiKey) {
		if (prodLike || outageMode === 'hard_fail') {
			throw new Error('XAI_API_KEY is required when Grok/provider probe is enabled');
		}
	}

	return {
		provider,
		enableGrokText,
		enableGrokImages,
		enableProviderProbe,
		outageMode,
		xaiApiKey,
		grokTextModel: (env.GROK_TEXT_MODEL ?? 'grok-4-1-fast-reasoning').trim(),
		grokImageModel: (env.GROK_IMAGE_MODEL ?? 'grok-imagine-image').trim(),
		maxOutputTokens: parseIntInRange(env.AI_MAX_OUTPUT_TOKENS, 1800, 200, 3200),
		requestTimeoutMs: parseIntInRange(env.AI_REQUEST_TIMEOUT_MS, 20_000, 5_000, 60_000),
		maxRetries: parseIntInRange(env.AI_MAX_RETRIES, 2, 0, 5),
		retryBackoffMs: [400, 1200]
	};
}
