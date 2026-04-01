export interface TelemetrySink {
	emit(stage: string, payload: Record<string, unknown>): void;
}

export class ConsoleTelemetrySink implements TelemetrySink {
	emit(stage: string, payload: Record<string, unknown>): void {
		console.info(`[AI_SERVER][${stage}] ${JSON.stringify(payload)}`);
	}
}
