import { test, expect } from '@playwright/test';
import { emitAiServerTelemetry, resetAiTelemetrySink, setAiTelemetrySink } from '../../../src/lib/server/ai/telemetry';
import type { TelemetrySink } from '../../../src/lib/server/ai/telemetrySink';

class RecordingSink implements TelemetrySink {
	public records: Array<{ stage: string; payload: Record<string, unknown> }> = [];

	emit(stage: string, payload: Record<string, unknown>): void {
		this.records.push({ stage, payload });
	}
}

test.describe('AI telemetry redaction', () => {
	test.afterEach(() => {
		resetAiTelemetrySink();
	});

	test('redacts sensitive keys recursively while preserving other payload values', () => {
		const sink = new RecordingSink();
		setAiTelemetrySink(sink);

		emitAiServerTelemetry('redaction_case', {
			apiKey: 'abc123',
			nested: {
				authorization: 'Bearer token',
				ok: true,
				items: [{ password: 'pw' }, { value: 'keep-me' }]
			}
		});

		expect(sink.records).toHaveLength(1);
		expect(sink.records[0]).toEqual({
			stage: 'redaction_case',
			payload: {
				apiKey: '[REDACTED]',
				nested: {
					authorization: '[REDACTED]',
					ok: true,
					items: [{ password: '[REDACTED]' }, { value: 'keep-me' }]
				}
			}
		});
	});
});
