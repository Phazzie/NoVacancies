/**
 * Minimal telemetry hook for AI pipeline reliability and verification.
 * Emits structured console logs and browser events for test observability.
 *
 * @param {string} stage
 * @param {Object} [payload]
 * @returns {{stage: string, timestamp: string, payload: Object}}
 */
export function emitAiTelemetry(stage, payload = {}) {
    const event = {
        stage,
        timestamp: new Date().toISOString(),
        payload
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
