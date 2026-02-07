const SENSITIVE_KEY_PATTERN = /(api.?key|secret|token|authorization|password)/i;

function redactUnknown(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(redactUnknown);
	if (!value || typeof value !== 'object') return value;

	const source = value as Record<string, unknown>;
	const result: Record<string, unknown> = {};
	for (const [key, nestedValue] of Object.entries(source)) {
		if (SENSITIVE_KEY_PATTERN.test(key)) {
			result[key] = '[REDACTED]';
			continue;
		}
		result[key] = redactUnknown(nestedValue);
	}
	return result;
}

export interface AiTelemetryEvent {
	stage: string;
	timestamp: string;
	payload: Record<string, unknown>;
}

export function emitAiServerTelemetry(stage: string, payload: Record<string, unknown>): AiTelemetryEvent {
	const event: AiTelemetryEvent = {
		stage,
		timestamp: new Date().toISOString(),
		payload: redactUnknown(payload) as Record<string, unknown>
	};
	console.info(`[AI_SERVER][${event.stage}] ${JSON.stringify(event.payload)}`);
	return event;
}

export function sanitizeForErrorMessage(error: unknown): string {
	const raw = error instanceof Error ? error.message : String(error ?? 'Unknown error');
	return raw.replace(/[A-Za-z0-9_-]{20,}/g, '[REDACTED]');
}

