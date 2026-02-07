import { browser } from '$app/environment';

const LOCALHOST_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

function isSecureOrigin(): boolean {
	if (!browser) return false;
	if (window.location.protocol === 'https:') return true;
	return LOCALHOST_HOSTS.has(window.location.hostname);
}

/**
 * Registers the root-scoped service worker in safe client contexts.
 * Returns null when registration is unsupported or blocked.
 */
export async function registerPwaServiceWorker(): Promise<ServiceWorkerRegistration | null> {
	if (!browser || !('serviceWorker' in navigator)) {
		return null;
	}

	if (!isSecureOrigin()) {
		console.warn('[PWA] Service worker skipped on insecure origin');
		return null;
	}

	try {
		const registration = await navigator.serviceWorker.register('/service-worker.js', {
			scope: '/'
		});
		return registration;
	} catch (error) {
		console.warn('[PWA] Service worker registration failed:', error);
		return null;
	}
}
