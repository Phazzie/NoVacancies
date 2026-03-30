import { expect, test } from '@playwright/test';
import { mapAiErrorToUserMessage } from '../../../src/lib/errors/aiErrorMapping';

test.describe('AI error mapping', () => {
	test('maps provider and route codes to stable user copy', () => {
		expect(mapAiErrorToUserMessage({ code: 'xai_api_key' })).toContain('not configured yet');
		expect(mapAiErrorToUserMessage({ code: 'auth' })).toContain('authentication failed');
		expect(mapAiErrorToUserMessage({ code: 'rate_limit' })).toContain('rate-limited');
		expect(mapAiErrorToUserMessage({ code: 'timeout' })).toContain('timed out');
		expect(mapAiErrorToUserMessage({ code: 'provider_down' })).toContain('unavailable');
		expect(mapAiErrorToUserMessage({ code: 'guardrail' })).toContain('guardrails');
	});

	test('falls back to status mapping when code is missing', () => {
		expect(mapAiErrorToUserMessage({ status: 429, message: 'request failed' })).toContain(
			'rate-limited'
		);
		expect(mapAiErrorToUserMessage({ status: 422, message: 'request failed' })).toContain(
			'guardrails'
		);
	});

	test('uses legacy message matching for backward compatibility', () => {
		expect(
			mapAiErrorToUserMessage({
				message: 'XAI_API_KEY is required in grok-only mode'
			})
		).toContain('not configured yet');
		expect(mapAiErrorToUserMessage({ message: 'service unavailable from provider' })).toContain(
			'unavailable'
		);
	});

	test('returns unknown fallback for empty payload', () => {
		expect(mapAiErrorToUserMessage({})).toContain('Something went wrong while loading AI');
	});
});
