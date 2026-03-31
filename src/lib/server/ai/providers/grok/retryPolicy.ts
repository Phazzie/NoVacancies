import { AiProviderError } from '$lib/server/ai/provider.interface';

export interface RetryPolicyOptions {
	maxRetries: number;
	retryBackoffMs: number[];
}

export interface RetryDecision {
	shouldRetry: boolean;
	backoffMs: number;
}

export function isRetryableError(error: unknown): boolean {
	if (error instanceof AiProviderError) {
		return error.retryable;
	}
	return error instanceof Error && error.name === 'AbortError';
}

export function getRetryBackoff(attempt: number, retryBackoffMs: number[]): number {
	if (retryBackoffMs.length === 0) return 0;
	const index = Math.min(attempt, retryBackoffMs.length - 1);
	return retryBackoffMs[index] ?? 0;
}

export function getRetryDecision(
	error: unknown,
	attempt: number,
	policy: RetryPolicyOptions
): RetryDecision {
	const retryBudget = policy.maxRetries + 1;
	const shouldRetry = isRetryableError(error) && attempt < retryBudget - 1;
	return {
		shouldRetry,
		backoffMs: shouldRetry ? getRetryBackoff(attempt, policy.retryBackoffMs) : 0
	};
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeWithRetry<T>(
	operation: (attempt: number) => Promise<T>,
	policy: RetryPolicyOptions,
	sleepImpl: (ms: number) => Promise<void> = sleep
): Promise<{ value: T; retryCount: number }> {
	let attempt = 0;
	let lastError: unknown = null;
	const maxAttempts = policy.maxRetries + 1;

	while (attempt < maxAttempts) {
		try {
			const value = await operation(attempt);
			return { value, retryCount: attempt };
		} catch (error) {
			lastError = error;
			const decision = getRetryDecision(error, attempt, policy);
			if (!decision.shouldRetry) break;
			await sleepImpl(decision.backoffMs);
		}
		attempt += 1;
	}

	throw lastError;
}
