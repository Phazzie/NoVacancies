import { expect, test } from '@playwright/test';
import { AiProviderError } from '../../../src/lib/server/ai/provider.interface';
import { executeWithRetry, getRetryBackoff, getRetryDecision } from '../../../src/lib/server/ai/providers/grok/retryPolicy';

test.describe('retryPolicy', () => {
	test('uses clamped backoff index', () => {
		expect(getRetryBackoff(0, [100, 400])).toBe(100);
		expect(getRetryBackoff(3, [100, 400])).toBe(400);
	});

	test('retries retryable provider errors within budget', () => {
		const error = new AiProviderError('temp', { code: 'provider_down', retryable: true, status: 503 });
		expect(getRetryDecision(error, 0, { maxRetries: 2, retryBackoffMs: [10, 20] })).toEqual({
			shouldRetry: true,
			backoffMs: 10
		});
		expect(getRetryDecision(error, 2, { maxRetries: 2, retryBackoffMs: [10, 20] })).toEqual({
			shouldRetry: false,
			backoffMs: 0
		});
	});

	test('executeWithRetry returns retryCount after eventual success', async () => {
		let attempts = 0;
		const sleepCalls: number[] = [];
		const result = await executeWithRetry(
			async () => {
				attempts += 1;
				if (attempts < 3) {
					throw new AiProviderError('temp', { code: 'rate_limit', retryable: true, status: 429 });
				}
				return 'ok';
			},
			{ maxRetries: 3, retryBackoffMs: [5, 15] },
			async (ms) => {
				sleepCalls.push(ms);
			}
		);

		expect(result.value).toBe('ok');
		expect(result.retryCount).toBe(2);
		expect(sleepCalls).toEqual([5, 15]);
	});
});
