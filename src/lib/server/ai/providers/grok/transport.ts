import { getBackoffMs, isAbortError, shouldRetry } from '$lib/server/ai/providers/grok/retryPolicy';

export interface RequestExecutionOptions<TResult> {
	fetchImpl: typeof fetch;
	url: string;
	requestInit: RequestInit;
	timeoutMs: number;
	maxRetries: number;
	retryBackoffMs: number[];
	execute: (response: Response) => Promise<TResult>;
	timeoutError: () => Error;
	fallbackError: () => Error;
}

export interface RequestExecutionResult<TResult> {
	result: TResult;
	retryCount: number;
	latencyMs: number;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeRequestWithTimeoutAndRetry<TResult>(
	options: RequestExecutionOptions<TResult>
): Promise<RequestExecutionResult<TResult>> {
	let attempt = 0;
	const maxAttempts = options.maxRetries + 1;
	let lastError: unknown = null;

	while (attempt < maxAttempts) {
		const started = Date.now();
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
		try {
			const response = await options.fetchImpl(options.url, {
				...options.requestInit,
				signal: controller.signal
			});
			const result = await options.execute(response);
			return {
				result,
				retryCount: attempt,
				latencyMs: Date.now() - started
			};
		} catch (error) {
			lastError = error;
			if (!shouldRetry({ error, attempt, maxAttempts })) break;
			await sleep(getBackoffMs(attempt, options.retryBackoffMs));
		} finally {
			clearTimeout(timeout);
		}
		attempt += 1;
	}

	if (isAbortError(lastError)) throw options.timeoutError();
	if (lastError instanceof Error) throw lastError;
	throw options.fallbackError();
}
