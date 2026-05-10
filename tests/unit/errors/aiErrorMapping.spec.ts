import { expect, test } from '@playwright/test';
import { mapAiErrorToUserMessage } from '../../../src/lib/errors/aiErrorMapping';

test.describe('aiErrorMapping', () => {
	test('maps provider error codes to stable user messages', () => {
		expect(mapAiErrorToUserMessage({ code: 'auth', message: 'Unauthorized' })).toBe(
			'AI authentication failed. Check the server API key configuration.'
		);
		expect(mapAiErrorToUserMessage({ code: 'rate_limit', message: 'Too many requests' })).toBe(
			'AI is rate-limited right now. Wait a moment and try again.'
		);
		expect(mapAiErrorToUserMessage({ code: 'provider_down', message: 'Down' })).toBe(
			'AI provider is unavailable right now. Please try again in a minute.'
		);
	});

	test('maps route-level config and status signals when code is absent', () => {
		expect(
			mapAiErrorToUserMessage({
				status: 500,
				message: 'XAI_API_KEY is required in Grok-only mode'
			})
		).toBe('AI is not configured yet. Add XAI_API_KEY to the server environment, then redeploy.');
		expect(mapAiErrorToUserMessage({ status: 504, message: 'Gateway timeout' })).toBe(
			'AI timed out. Please try again.'
		);
		expect(mapAiErrorToUserMessage({ status: 422, message: 'guardrail reject' })).toBe(
			'This request violated a content guardrail. Please adjust the input and try again.'
		);
	});

	test('falls back to unknown for unclassified values', () => {
		expect(mapAiErrorToUserMessage({ code: 'not_real', status: 418, message: 'weird' })).toBe(
			'Something went wrong while loading AI.'
		);
	});

	test('maps specific safe diagnostics when metadata is available', () => {
		expect(
			mapAiErrorToUserMessage({
				code: 'rate_limit',
				status: 429,
				retryAfterSeconds: 170
			})
		).toBe('AI is rate-limited right now. Try again in 3 minutes.');
		expect(
			mapAiErrorToUserMessage({
				code: 'timeout',
				status: 504,
				requestDurationMs: 65123
			})
		).toBe('AI request timed out after 65s. Please try again.');
		expect(mapAiErrorToUserMessage({ code: 'provider_down', status: 503 })).toBe(
			'AI provider is unavailable right now (HTTP 503). Please try again soon.'
		);
	});
});
