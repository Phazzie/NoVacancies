import { AiProviderError } from '$lib/server/ai/provider.interface';

export function isAbortError(error: unknown): boolean {
	return error instanceof Error && error.name === 'AbortError';
}

export function isRetryableError(error: unknown): boolean {
	if (error instanceof AiProviderError) return error.retryable;
	return isAbortError(error);
}

export function getBackoffMs(attempt: number, retryBackoffMs: number[]): number {
	if (retryBackoffMs.length === 0) return 0;
	const index = Math.min(attempt, retryBackoffMs.length - 1);
	return retryBackoffMs[index] ?? 0;
}

export function shouldRetry(options: { error: unknown; attempt: number; maxAttempts: number }): boolean {
	if (!isRetryableError(options.error)) return false;
	return options.attempt < options.maxAttempts - 1;
}
