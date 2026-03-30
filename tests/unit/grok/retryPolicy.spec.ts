import { expect, test } from '@playwright/test';
import { AiProviderError } from '../../../src/lib/server/ai/provider.interface';
import {
	getBackoffMs,
	isAbortError,
	isRetryableError,
	shouldRetry
} from '../../../src/lib/server/ai/providers/grok/retryPolicy';

test.describe('retryPolicy', () => {
	test('flags retryable AiProviderError values', () => {
		const retryable = new AiProviderError('retry', { code: 'provider_down', retryable: true });
		const nonRetryable = new AiProviderError('nope', { code: 'invalid_response', retryable: false });
		expect(isRetryableError(retryable)).toBe(true);
		expect(isRetryableError(nonRetryable)).toBe(false);
	});

	test('treats AbortError as retryable', () => {
		const abort = new Error('timed out');
		abort.name = 'AbortError';
		expect(isAbortError(abort)).toBe(true);
		expect(isRetryableError(abort)).toBe(true);
	});

	test('uses last backoff value when attempts exceed table', () => {
		expect(getBackoffMs(0, [100, 200])).toBe(100);
		expect(getBackoffMs(5, [100, 200])).toBe(200);
		expect(getBackoffMs(2, [])).toBe(0);
	});

	test('keeps retries bounded by max attempts', () => {
		const retryable = new AiProviderError('retry', { code: 'rate_limit', retryable: true });
		expect(shouldRetry({ error: retryable, attempt: 0, maxAttempts: 2 })).toBe(true);
		expect(shouldRetry({ error: retryable, attempt: 1, maxAttempts: 2 })).toBe(false);
	});
});
