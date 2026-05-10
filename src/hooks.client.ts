/**
 * SvelteKit client-side hooks.
 *
 * Initialises Sentry in the browser for client-side error monitoring and
 * wraps the default error handler so unhandled client exceptions are
 * captured automatically.
 *
 * Required env vars (public — injected at build time):
 *   PUBLIC_SENTRY_DSN — Sentry DSN for client-side error capture.
 *                       If absent, falls back to the default console error handler.
 */
import * as Sentry from '@sentry/sveltekit';
import { handleErrorWithSentry } from '@sentry/sveltekit';
import { PUBLIC_SENTRY_DSN } from '$env/static/public';

if (PUBLIC_SENTRY_DSN) {
	Sentry.init({
		dsn: PUBLIC_SENTRY_DSN,
		environment: import.meta.env.MODE,
		tracesSampleRate: 0.1,
		// Replay recording for a sample of sessions to aid debugging.
		replaysSessionSampleRate: 0.05,
		replaysOnErrorSampleRate: 1.0,
		integrations: [Sentry.replayIntegration()]
	});
}

export const handleError = handleErrorWithSentry();
