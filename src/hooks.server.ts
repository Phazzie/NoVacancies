import { sequence } from '@sveltejs/kit/hooks';
import { sentryHandle, handleErrorWithSentry } from '@sentry/sveltekit';

import { initSentry } from '$lib/server/observability/sentry';
import { aiRateLimit } from '$lib/server/middleware/aiRateLimit';
import { securityHeaders } from '$lib/server/middleware/securityHeaders';
import { builderAuth } from '$lib/server/middleware/builderAuth';

// Initialize Sentry as early as possible — before any request handling begins.
// No-op when SENTRY_DSN is absent so local dev works without credentials.
initSentry();

// sentryHandle() is listed first so that every request receives a Sentry trace
// context header, enabling end-to-end distributed tracing from client to server.
// securityHeaders wraps all subsequent handlers so even Sentry-emitted error
// responses carry the baseline security headers.
export const handle = sequence(sentryHandle(), securityHeaders, builderAuth, aiRateLimit);

// Capture any unhandled server errors in Sentry and pass a sanitised error id
// back to the client. Falls back to the default handler when Sentry is absent.
export const handleError = handleErrorWithSentry();
