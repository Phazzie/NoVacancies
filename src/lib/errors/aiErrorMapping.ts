import type { AiErrorCode } from '$lib/server/ai/provider.interface';

export type RouteAiErrorCode = 'missing_api_key' | 'network' | 'http_error' | 'unknown';

export type UserFacingAiErrorCode = AiErrorCode | RouteAiErrorCode;

export interface AiErrorMappingInput {
	code?: string | null;
	status?: number | null;
	retryAfterSeconds?: number | null;
	requestDurationMs?: number | null;
	message?: string | null;
}

const CODE_TO_USER_MESSAGE: Record<UserFacingAiErrorCode, string> = {
	missing_api_key: 'AI is not configured yet. Add XAI_API_KEY to the server environment, then redeploy.',
	auth: 'AI authentication failed. Check the server API key configuration.',
	rate_limit: 'AI is rate-limited right now. Wait a moment and try again.',
	timeout: 'AI timed out. Please try again.',
	provider_down: 'AI provider is unavailable right now. Please try again in a minute.',
	invalid_response: 'AI returned an invalid response. Please try again.',
	guardrail: 'This request violated a content guardrail. Please adjust the input and try again.',
	network: 'Could not reach AI services. Check your connection and try again.',
	http_error: 'AI request failed. Please try again.',
	unknown: 'Something went wrong while loading AI.'
};

function deriveErrorCode(input: AiErrorMappingInput): UserFacingAiErrorCode {
	const normalizedMessage = String(input.message ?? '').toLowerCase();
	const normalizedCode = String(input.code ?? '').toLowerCase();

	if (normalizedCode && normalizedCode in CODE_TO_USER_MESSAGE) {
		return normalizedCode as UserFacingAiErrorCode;
	}
	if (normalizedMessage.includes('xai_api_key') || normalizedMessage.includes('grok-only mode')) {
		return 'missing_api_key';
	}
	if (input.status === 401 || input.status === 403) return 'auth';
	if (input.status === 408 || input.status === 504) return 'timeout';
	if (input.status === 429) return 'rate_limit';
	if (input.status === 502 || input.status === 503) return 'provider_down';
	if (input.status === 422) return 'guardrail';
	if (input.status && input.status >= 500) return 'http_error';
	return 'unknown';
}

function formatDurationSeconds(ms: number): number {
	if (!Number.isFinite(ms) || ms <= 0) return 0;
	return Math.max(1, Math.round(ms / 1000));
}

function formatRetryDelay(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds <= 0) return 'a moment';
	if (seconds < 60) return `${Math.ceil(seconds)} seconds`;
	const minutes = Math.ceil(seconds / 60);
	return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

export function mapAiErrorToUserMessage(input: AiErrorMappingInput): string {
	const code = deriveErrorCode(input);
	if (code === 'rate_limit' && typeof input.retryAfterSeconds === 'number') {
		return `AI is rate-limited right now. Try again in ${formatRetryDelay(input.retryAfterSeconds)}.`;
	}
	if (code === 'timeout' && typeof input.requestDurationMs === 'number') {
		return `AI request timed out after ${formatDurationSeconds(input.requestDurationMs)}s. Please try again.`;
	}
	if (code === 'provider_down' && typeof input.status === 'number') {
		return `AI provider is unavailable right now (HTTP ${input.status}). Please try again soon.`;
	}
	if ((code === 'auth' || code === 'invalid_response') && typeof input.status === 'number') {
		const base =
			code === 'auth'
				? 'AI authentication failed. Check the server API key configuration.'
				: 'AI returned an invalid response. Please try again.';
		return `${base} (HTTP ${input.status})`;
	}
	return CODE_TO_USER_MESSAGE[code] ?? CODE_TO_USER_MESSAGE.unknown;
}
