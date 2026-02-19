import { test, expect } from '@playwright/test';
import { ImagePipeline } from '../../src/lib/server/ai/imagePipeline';
import { AiProviderError } from '../../src/lib/server/ai/provider.interface';

const baseConfig = {
	provider: 'grok' as const,
	enableGrokText: true,
	enableGrokImages: true,
	enableProviderProbe: false,
	aiAuthBypass: false,
	outageMode: 'hard_fail' as const,
	xaiApiKey: 'test',
	grokTextModel: 'text-model',
	grokImageModel: 'image-model',
	maxOutputTokens: 1000,
	requestTimeoutMs: 5000,
	maxRetries: 2,
	retryBackoffMs: [1, 1]
};

test('reuses cache for same prompt on generate action', async () => {
	let calls = 0;
	const pipeline = new ImagePipeline({
		config: baseConfig,
		generateImage: async () => {
			calls += 1;
			return { url: `https://example.com/${calls}.png` };
		}
	});

	const first = await pipeline.generate('Sydney at motel window', 'generate');
	expect(first.status).toBe('success');
	expect(first.cacheHit).toBeFalsy();

	const second = await pipeline.generate('Sydney at motel window', 'generate');
	expect(second.status).toBe('success');
	expect(second.cacheHit).toBeTruthy();
	expect(second.result?.url).toBe(first.result?.url);
	expect(calls).toBe(1);
});

test('bounded retries capture reason codes and eventually succeed', async () => {
	let calls = 0;
	const pipeline = new ImagePipeline({
		config: { ...baseConfig, maxRetries: 2 },
		generateImage: async () => {
			calls += 1;
			if (calls < 3) {
				throw new AiProviderError('rate limited', {
					code: 'rate_limit',
					retryable: true,
					status: 429
				});
			}
			return { b64: 'abc123' };
		}
	});

	const result = await pipeline.generate('Late night convenience store', 'generate');
	expect(result.status).toBe('success');
	expect(result.retry.attemptCount).toBe(3);
	expect(result.retry.reasons).toHaveLength(2);
	expect(result.retry.reasons[0].reasonCode).toBe('rate_limit');
	expect(result.retry.reasons[1].reasonCode).toBe('rate_limit');
});

test('creator decisions update request records', async () => {
	const pipeline = new ImagePipeline({
		config: baseConfig,
		generateImage: async () => ({ url: 'https://example.com/success.png' })
	});

	const request = await pipeline.generate('Sydney checking phones in dim motel room', 'generate');
	const decided = pipeline.applyDecision(request.requestId, 'accepted');
	expect(decided?.decision).toBe('accepted');

	const fallback = pipeline.applyDecision(request.requestId, 'fallback_to_static');
	expect(fallback?.decision).toBe('fallback_to_static');
});
