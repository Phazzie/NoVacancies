import { expect, test } from '@playwright/test';
import { ConsoleTelemetrySink, type TelemetrySink } from '../../../src/lib/server/ai/telemetrySink';
import { emitAiServerTelemetry } from '../../../src/lib/server/ai/telemetry';

test.describe('AI telemetry sink', () => {
	test('emits through an injected sink', () => {
		const events = [] as Array<{ stage: string; payload: Record<string, unknown> }>;
		const sink: TelemetrySink = {
			emit(event) {
				events.push({ stage: event.stage, payload: event.payload });
			}
		};

		emitAiServerTelemetry('custom_sink', { status: 'ok' }, sink);

		expect(events).toHaveLength(1);
		expect(events[0]).toEqual({ stage: 'custom_sink', payload: { status: 'ok' } });
	});

	test('console sink writes structured server telemetry log line', () => {
		const originalInfo = console.info;
		const captured: string[] = [];
		console.info = (line?: unknown) => {
			captured.push(String(line));
		};

		try {
			const sink = new ConsoleTelemetrySink();
			emitAiServerTelemetry('console_sink', { key: 'value' }, sink);
		} finally {
			console.info = originalInfo;
		}

		expect(captured).toHaveLength(1);
		expect(captured[0]).toContain('[AI_SERVER][console_sink]');
		expect(captured[0]).toContain('"key":"value"');
	});
});
