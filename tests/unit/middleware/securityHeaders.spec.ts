import { expect, test } from '@playwright/test';

import { applySecurityHeaders, securityHeaders } from '../../../src/lib/server/middleware/securityHeaders';

function createEvent(pathname: string, protocol: 'http:' | 'https:' = 'http:', forwardedProto?: string) {
	const headers = new Headers();
	if (forwardedProto) {
		headers.set('x-forwarded-proto', forwardedProto);
	}

	const request = new Request(`${protocol}//example.com${pathname}`, { headers });
	return {
		url: new URL(request.url),
		request,
		getClientAddress: () => '203.0.113.9'
	} as any;
}

test.describe('securityHeaders middleware', () => {
	test('applies baseline headers and hsts for https requests', async () => {
		const response = new Response('ok');
		const result = await securityHeaders({
			event: createEvent('/api/story/opening', 'https:'),
			resolve: async () => response
		} as any);

		expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff');
		expect(result.headers.get('X-Frame-Options')).toBe('DENY');
		expect(result.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
		expect(result.headers.get('Strict-Transport-Security')).toBe('max-age=15552000; includeSubDomains');
	});

	test('applies hsts when request is forwarded as https', async () => {
		const result = await securityHeaders({
			event: createEvent('/health', 'http:', 'https'),
			resolve: async () => new Response('ok')
		} as any);

		expect(result.headers.get('Strict-Transport-Security')).toBe('max-age=15552000; includeSubDomains');
	});

	test('does not overwrite existing security-related headers', () => {
		const response = new Response('ok', {
			headers: {
				'X-Frame-Options': 'SAMEORIGIN',
				'Strict-Transport-Security': 'max-age=1'
			}
		});

		applySecurityHeaders(response, true);

		expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
		expect(response.headers.get('Strict-Transport-Security')).toBe('max-age=1');
	});
});
