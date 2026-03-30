export type AiRouteErrorCode =
	| 'timeout'
	| 'auth'
	| 'rate_limit'
	| 'provider_down'
	| 'invalid_response'
	| 'guardrail'
	| 'unknown'
	| 'xai_api_key'
	| 'config_missing';

export interface AiErrorDescriptor {
	code?: AiRouteErrorCode | string | null;
	status?: number | null;
	message?: string | null;
}

const CODE_TO_MESSAGE: Partial<Record<AiRouteErrorCode, string>> = {
	xai_api_key: 'AI is not configured yet. Add XAI_API_KEY to the server environment, then redeploy.',
	config_missing:
		'AI is not configured yet. Add XAI_API_KEY to the server environment, then redeploy.',
	auth: 'AI authentication failed. Check the server API key configuration.',
	rate_limit: 'AI is rate-limited right now. Wait a moment and try again.',
	timeout: 'AI timed out. Please try again.',
	provider_down: 'AI provider is unavailable right now. Please try again in a minute.',
	invalid_response: 'AI returned an invalid response. Please try again.',
	guardrail: 'Image request blocked by safety guardrails. Please revise the prompt.',
	unknown: 'Something went wrong while loading AI.'
};

const STATUS_TO_MESSAGE: Partial<Record<number, string>> = {
	400: 'AI request was invalid. Please try again.',
	401: CODE_TO_MESSAGE.auth,
	403: 'AI request is not allowed in this environment.',
	408: CODE_TO_MESSAGE.timeout,
	422: CODE_TO_MESSAGE.guardrail,
	429: CODE_TO_MESSAGE.rate_limit,
	502: CODE_TO_MESSAGE.invalid_response,
	503: CODE_TO_MESSAGE.provider_down,
	504: CODE_TO_MESSAGE.timeout
};

function mapLegacyMessage(message: string): string | null {
	const normalized = message.toLowerCase();
	if (normalized.includes('xai_api_key') || normalized.includes('required in grok-only mode')) {
		return CODE_TO_MESSAGE.xai_api_key ?? null;
	}
	if (normalized.includes('auth') || normalized.includes('unauthorized')) {
		return CODE_TO_MESSAGE.auth ?? null;
	}
	if (normalized.includes('rate_limit') || normalized.includes('rate limit') || normalized.includes('429')) {
		return CODE_TO_MESSAGE.rate_limit ?? null;
	}
	if (normalized.includes('timeout') || normalized.includes('timed out')) {
		return CODE_TO_MESSAGE.timeout ?? null;
	}
	if (normalized.includes('provider_down') || normalized.includes('service unavailable')) {
		return CODE_TO_MESSAGE.provider_down ?? null;
	}
	if (normalized.includes('guardrail')) {
		return CODE_TO_MESSAGE.guardrail ?? null;
	}
	return null;
}

export function mapAiErrorToUserMessage(error: AiErrorDescriptor): string {
	const byCode = error.code ? CODE_TO_MESSAGE[error.code as AiRouteErrorCode] : null;
	if (byCode) return byCode;

	const byStatus = typeof error.status === 'number' ? STATUS_TO_MESSAGE[error.status] : null;
	if (byStatus) return byStatus;

	if (typeof error.message === 'string' && error.message.trim()) {
		const byLegacyMessage = mapLegacyMessage(error.message);
		if (byLegacyMessage) return byLegacyMessage;
		return error.message;
	}

	return CODE_TO_MESSAGE.unknown ?? 'Something went wrong while loading AI.';
}
