import { expect, test } from '@playwright/test';
import {
	BASELINE_SECURITY_HEADERS,
	securityHeaders
} from '../../../src/lib/server/middleware/securityHeaders';

function createEvent(url: string, forwardedProto: string | null = null) {
	const headers = new Headers();
	if (forwardedProto) headers.set('x-forwarded-proto', forwardedProto);

	return {
		url: new URL(url),
		request: new Request(url, { headers })
	} as any;
}

test.describe('securityHeaders middleware', () => {
	test('adds baseline headers and HSTS for HTTPS requests', async () => {
		const response = new Response('ok');
		const result = await securityHeaders({
			event: createEvent('https://example.test/api/story/opening'),
			resolve: async () => response
		} as any);

		for (const [name, value] of Object.entries(BASELINE_SECURITY_HEADERS)) {
			expect(result.headers.get(name)).toBe(value);
		}
		expect(result.headers.get('Strict-Transport-Security')).toBe(
			'max-age=15552000; includeSubDomains'
		);
	});

	test('respects existing headers and does not overwrite explicit values', async () => {
		const response = new Response('ok', {
			headers: {
				'X-Frame-Options': 'SAMEORIGIN',
				'Content-Security-Policy': "default-src 'none'",
				'Strict-Transport-Security': 'max-age=1'
			}
		});

		const result = await securityHeaders({
			event: createEvent('https://example.test/play'),
			resolve: async () => response
		} as any);

		expect(result.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
		expect(result.headers.get('Content-Security-Policy')).toBe("default-src 'none'");
		expect(result.headers.get('Strict-Transport-Security')).toBe('max-age=1');
	});

	test('adds HSTS when forwarded proto indicates HTTPS behind a proxy', async () => {
		const response = new Response('ok');
		const result = await securityHeaders({
			event: createEvent('http://example.test/play', 'https'),
			resolve: async () => response
		} as any);

		expect(result.headers.get('Strict-Transport-Security')).toBe(
			'max-age=15552000; includeSubDomains'
		);
	});

	test('does not add HSTS for plain HTTP requests', async () => {
		const response = new Response('ok');
		const result = await securityHeaders({
			event: createEvent('http://example.test/play'),
			resolve: async () => response
		} as any);

		expect(result.headers.get('Strict-Transport-Security')).toBeNull();
	});
});
