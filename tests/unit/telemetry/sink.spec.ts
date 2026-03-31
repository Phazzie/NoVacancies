import { test, expect } from '@playwright/test';
import { emitAiServerTelemetry, resetAiTelemetrySink, setAiTelemetrySink } from '../../../src/lib/server/ai/telemetry';
import type { TelemetrySink } from '../../../src/lib/server/ai/telemetrySink';

class RecordingSink implements TelemetrySink {
	public records: Array<{ stage: string; payload: Record<string, unknown> }> = [];

	emit(stage: string, payload: Record<string, unknown>): void {
		this.records.push({ stage, payload });
	}
}

test.describe('AI telemetry sink abstraction', () => {
	test.afterEach(() => {
		resetAiTelemetrySink();
	});

	test('uses the configured sink for emission', () => {
		const sink = new RecordingSink();
		setAiTelemetrySink(sink);

		const event = emitAiServerTelemetry('sink_swap', { value: 42 });

		expect(event.stage).toBe('sink_swap');
		expect(sink.records).toEqual([{ stage: 'sink_swap', payload: { value: 42 } }]);
	});

	test('returns emitted event metadata regardless of sink implementation', () => {
		const sink = new RecordingSink();
		setAiTelemetrySink(sink);

		const event = emitAiServerTelemetry('metadata', { tokenValue: 'top-secret' });

		expect(event.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T/);
		expect(event.payload).toEqual({ tokenValue: '[REDACTED]' });
		expect(sink.records[0]?.payload).toEqual({ tokenValue: '[REDACTED]' });
	});
});
