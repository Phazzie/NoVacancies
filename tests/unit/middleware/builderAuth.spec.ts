import { expect, test } from '@playwright/test';
import { createSignedSessionCookieValue } from '../../../src/lib/server/auth';
import { builderAuth } from '../../../src/lib/server/middleware/builderAuth';

const TEST_SECRET = 'test-secret-for-builder-auth-unit-tests-only';

// Create a minimal RequestEvent mock for builderAuth
function makeEvent(pathname: string, cookieValue: string | undefined) {
    return {
        url: new URL(`https://example.com${pathname}`),
        request: new Request(`https://example.com${pathname}`),
        getClientAddress: () => '127.0.0.1',
        cookies: {
            get(name: string) {
                if (name === 'nv_session') return cookieValue;
                return undefined;
            }
        },
        locals: {} as Record<string, unknown>
    } as unknown as Parameters<typeof builderAuth>[0]['event'];
}

async function makeValidCookie(role: string): Promise<string> {
    // Override AUTH_SESSION_SECRET for the test
    const runtimeProcess = globalThis as { process?: { env?: Record<string, string | undefined> } };
    if (runtimeProcess.process?.env) {
        runtimeProcess.process.env.AUTH_SESSION_SECRET = TEST_SECRET;
    }
    return createSignedSessionCookieValue({ userId: 'test-user', role }, TEST_SECRET);
}

// Restore env after tests
test.afterEach(() => {
    const runtimeProcess = globalThis as { process?: { env?: Record<string, string | undefined> } };
    if (runtimeProcess.process?.env) {
        delete runtimeProcess.process.env.AUTH_SESSION_SECRET;
    }
});

// Helper: run the middleware and return the response or undefined (if resolve was called)
async function runMiddleware(
    pathname: string,
    cookie: string | undefined
): Promise<{ response: Response; resolveCalled: boolean }> {
    let resolveCalled = false;
    // Set AUTH_SESSION_SECRET so the middleware can verify cookies
    const runtimeProcess = globalThis as { process?: { env?: Record<string, string | undefined> } };
    if (runtimeProcess.process?.env) {
        runtimeProcess.process.env.AUTH_SESSION_SECRET = TEST_SECRET;
    }

    const response = await builderAuth({
        event: makeEvent(pathname, cookie),
        resolve: async () => {
            resolveCalled = true;
            return new Response('ok', { status: 200 });
        }
    } as unknown as Parameters<typeof builderAuth>[0]);

    return { response, resolveCalled };
}

test.describe('builderAuth — anonymous requests', () => {
    test('returns 401 auth_required when no cookie is present on /builder', async () => {
        const { response, resolveCalled } = await runMiddleware('/builder', undefined);

        expect(response.status).toBe(401);
        expect(resolveCalled).toBe(false);
        const body = (await response.json()) as { error: { code: string } };
        expect(body.error.code).toBe('auth_required');
    });

    test('returns 401 on /api/builder/* without a session', async () => {
        const { response } = await runMiddleware('/api/builder/generate-draft', undefined);
        expect(response.status).toBe(401);
    });

    test('passes through non-builder routes without a session', async () => {
        const { response, resolveCalled } = await runMiddleware('/api/story/opening', undefined);
        expect(response.status).toBe(200);
        expect(resolveCalled).toBe(true);
    });
});

test.describe('builderAuth — valid builder sessions', () => {
    test('allows author role through /builder', async () => {
        const cookie = await makeValidCookie('author');
        const { response, resolveCalled } = await runMiddleware('/builder', cookie);

        expect(response.status).toBe(200);
        expect(resolveCalled).toBe(true);
    });

    test('allows editor role through /api/builder/*', async () => {
        const cookie = await makeValidCookie('editor');
        const { response, resolveCalled } = await runMiddleware('/api/builder/evaluate-prose', cookie);

        expect(response.status).toBe(200);
        expect(resolveCalled).toBe(true);
    });
});

test.describe('builderAuth — non-builder roles', () => {
    test('returns 403 insufficient_role for a non-builder role on /builder', async () => {
        const cookie = await makeValidCookie('viewer');
        const { response, resolveCalled } = await runMiddleware('/builder', cookie);

        expect(response.status).toBe(403);
        expect(resolveCalled).toBe(false);
        const body = (await response.json()) as { error: { code: string } };
        expect(body.error.code).toBe('insufficient_role');
    });
});

test.describe('builderAuth — tampered cookies', () => {
    test('returns 401 when signature is tampered', async () => {
        const cookie = await makeValidCookie('author');
        const parts = cookie.split('.');
        const tamperedSig = parts[1].slice(0, -1) + (parts[1].at(-1) === 'a' ? 'b' : 'a');
        const tampered = `${parts[0]}.${tamperedSig}`;

        const { response, resolveCalled } = await runMiddleware('/builder', tampered);
        expect(response.status).toBe(401);
        expect(resolveCalled).toBe(false);
    });

    test('returns 401 for a malformed (non-signed) cookie value', async () => {
        const { response } = await runMiddleware('/builder', 'not-a-valid-cookie');
        expect(response.status).toBe(401);
    });
});
