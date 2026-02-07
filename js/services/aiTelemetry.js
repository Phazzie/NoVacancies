/**
 * Minimal telemetry hook for AI pipeline reliability and verification.
 * Emits structured console logs and browser events for test observability.
 *
 * @param {string} stage
 * @param {Object} [payload]
 * @returns {{stage: string, timestamp: string, payload: Object}}
 */
const REDACTED = '[REDACTED]';
const API_KEY_PATTERN = /^AIza[A-Za-z0-9_-]{20,120}$/;
const SENSITIVE_KEY_PATTERN = /(api.?key|secret|token|authorization|password)/i;

function sanitizeTelemetryPayload(value, parentKey = '') {
    if (value === null || value === undefined) return value;

    if (typeof value === 'string') {
        if (SENSITIVE_KEY_PATTERN.test(parentKey) || API_KEY_PATTERN.test(value)) {
            return REDACTED;
        }
        if (value.length > 500) {
            return `${value.slice(0, 500)}...`;
        }
        return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map((item) => sanitizeTelemetryPayload(item, parentKey));
    }

    if (typeof value === 'object') {
        const sanitized = {};
        Object.entries(value).forEach(([key, nestedValue]) => {
            if (SENSITIVE_KEY_PATTERN.test(key)) {
                sanitized[key] = REDACTED;
                return;
            }
            sanitized[key] = sanitizeTelemetryPayload(nestedValue, key);
        });
        return sanitized;
    }

    return String(value);
}

export function emitAiTelemetry(stage, payload = {}) {
    const event = {
        stage,
        timestamp: new Date().toISOString(),
        payload: sanitizeTelemetryPayload(payload)
    };

    try {
        console.log('[AIPipeline]', JSON.stringify(event));
    } catch {
        console.log('[AIPipeline]', stage);
    }

    if (typeof window !== 'undefined') {
        if (!Array.isArray(window.__sydneyAiTelemetry)) {
            window.__sydneyAiTelemetry = [];
        }

        window.__sydneyAiTelemetry.push(event);

        if (typeof window.dispatchEvent === 'function' && typeof window.CustomEvent === 'function') {
            window.dispatchEvent(
                new window.CustomEvent('sydney:ai-pipeline', {
                    detail: event
                })
            );
        }
    }

    return event;
}
