/**
 * Server-side Sentry integration.
 *
 * Required env vars:
 *   SENTRY_DSN  — Data Source Name from your Sentry project settings.
 *                 If absent, all functions are no-ops; the app runs normally.
 *
 * Usage:
 *   import { initSentry, captureServerException } from '$lib/server/observability/sentry';
 *   initSentry();  // call once, early in hooks.server.ts
 */
import * as Sentry from '@sentry/sveltekit';

let initialized = false;

function getSentryDsn(): string | undefined {
	const runtimeProcess = globalThis as {
		process?: { env?: Record<string, string | undefined> };
	};
	return runtimeProcess.process?.env?.SENTRY_DSN;
}

function getSentryEnv(): string {
	const runtimeProcess = globalThis as {
		process?: { env?: Record<string, string | undefined> };
	};
	return runtimeProcess.process?.env?.VERCEL_ENV ?? 'development';
}

/**
 * Initialize Sentry once per server cold start. Safe to call multiple times —
 * subsequent calls are no-ops. No-op when SENTRY_DSN is absent.
 */
export function initSentry(): void {
	if (initialized) return;
	const dsn = getSentryDsn();
	if (!dsn) {
		initialized = true; // Mark so we don't keep trying
		return;
	}
	Sentry.init({
		dsn,
		environment: getSentryEnv(),
		// Capture 10% of requests for performance tracing. Raise in production
		// once you understand your volume.
		tracesSampleRate: 0.1,
		// Do not send personally identifiable information in breadcrumbs.
		sendDefaultPii: false,
		integrations: [],
		enabled: true
	});
	initialized = true;
}

/**
 * Capture a server-side exception with optional context. No-op when Sentry is
 * not initialised (SENTRY_DSN absent).
 */
export function captureServerException(
	error: unknown,
	context?: Record<string, unknown>
): string | undefined {
	if (!getSentryDsn()) return undefined;
	return Sentry.captureException(error, context ? { extra: context } : undefined);
}

export { Sentry };
