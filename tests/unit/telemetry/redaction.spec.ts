import { expect, test } from '@playwright/test';
import { emitAiServerTelemetry } from '../../../src/lib/server/ai/telemetry';

test.describe('AI telemetry redaction', () => {
	test('redacts sensitive keys recursively while preserving non-sensitive values', () => {
		const event = emitAiServerTelemetry(
			'redaction_test',
			{
				apiKey: 'abc123',
				nested: {
					authorization: 'Bearer 123',
					safe: 'still-visible'
				},
				list: [{ token: 'secret-token', ok: true }],
				message: 'hello'
			},
			{ emit: () => {} }
		);

		expect(event.payload).toEqual({
			apiKey: '[REDACTED]',
			nested: {
				authorization: '[REDACTED]',
				safe: 'still-visible'
			},
			list: [{ token: '[REDACTED]', ok: true }],
			message: 'hello'
		});
	});

	test('preserves structure for primitive payload values', () => {
		const event = emitAiServerTelemetry(
			'primitive_values',
			{
				nullValue: null,
				numberValue: 7,
				boolValue: false,
				arrayValue: [1, 'two', null]
			},
			{ emit: () => {} }
		);

		expect(event.payload).toEqual({
			nullValue: null,
			numberValue: 7,
			boolValue: false,
			arrayValue: [1, 'two', null]
		});
	});
});
