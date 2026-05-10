/**
 * Client-side PostHog analytics integration.
 *
 * Required env var (SvelteKit public env, replace at build time):
 *   PUBLIC_POSTHOG_API_KEY — Project API key from your PostHog project settings.
 *                            If absent or empty, all functions are no-ops.
 *
 * Usage:
 *   import { initPosthog, capturePageview, captureEvent } from '$lib/client/analytics/posthog';
 *   // Call initPosthog once in +layout.svelte onMount
 *   // Call capturePageview on $page store changes
 */
import posthog from 'posthog-js';
import type { PostHog } from 'posthog-js';

let instance: PostHog | null = null;

/**
 * Initialize PostHog. Safe to call multiple times — subsequent calls are no-ops.
 * No-op when apiKey is absent/empty, or when called outside a browser context.
 */
export function initPosthog(apiKey: string | undefined): void {
	if (instance !== null) return;
	if (!apiKey || typeof window === 'undefined') return;

	posthog.init(apiKey, {
		api_host: 'https://us.i.posthog.com',
		// We capture pageviews manually to align with SvelteKit's client-side routing.
		capture_pageview: false,
		// Track sessions without cookies where possible.
		persistence: 'localStorage+cookie',
		// Respect Do Not Track headers.
		respect_dnt: true,
		// Boot fast; load feature flags in the background.
		bootstrap: {}
	});
	instance = posthog;
}

/**
 * Capture a custom event. No-op when PostHog is not initialised.
 */
export function captureEvent(event: string, properties?: Record<string, unknown>): void {
	instance?.capture(event, properties);
}

/**
 * Capture a pageview for the current route. Call this on each client-side
 * navigation (react to $page.url.pathname changes in the layout).
 */
export function capturePageview(path: string): void {
	instance?.capture('$pageview', {
		$current_url: typeof window !== 'undefined' ? window.location.href : path
	});
}

/**
 * Identify the current user. Call this after sign-in when a userId is known.
 */
export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
	instance?.identify(userId, traits);
}

/**
 * Reset the PostHog identity. Call this on sign-out.
 */
export function resetPosthog(): void {
	instance?.reset();
}
