import type { AiTelemetryEvent } from '$lib/server/ai/telemetry';

export interface TelemetrySink {
	emit(event: AiTelemetryEvent): void;
}

export class ConsoleTelemetrySink implements TelemetrySink {
	emit(event: AiTelemetryEvent): void {
		console.info(`[AI_SERVER][${event.stage}] ${JSON.stringify(event.payload)}`);
	}
}
