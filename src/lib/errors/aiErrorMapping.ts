import type { AiErrorCode } from '$lib/server/ai/provider.interface';

export type RouteAiErrorCode = 'missing_api_key' | 'network' | 'http_error' | 'unknown';

export type UserFacingAiErrorCode = AiErrorCode | RouteAiErrorCode;

export interface AiErrorMappingInput {
	code?: string | null;
	status?: number | null;
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

export function mapAiErrorToUserMessage(input: AiErrorMappingInput): string {
	const code = deriveErrorCode(input);
	return CODE_TO_USER_MESSAGE[code] ?? CODE_TO_USER_MESSAGE.unknown;
}
