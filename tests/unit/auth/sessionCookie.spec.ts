import { expect, test } from '@playwright/test';
import {
    createSignedSessionCookieValue,
    parseSessionCookie,
    authErrorResponse,
    BUILDER_ROLES
} from '../../../src/lib/server/auth';

const TEST_SECRET = 'test-secret-for-unit-tests-only-never-use-in-production';

// Helper: build a valid signed cookie for a given user + secret
async function makeCookie(
    userId: string,
    role: string,
    secret = TEST_SECRET,
    nowOverride?: number
): Promise<string> {
    return createSignedSessionCookieValue({ userId, role }, secret, nowOverride);
}

test.describe('parseSessionCookie — valid round-trip', () => {
    test('returns user data for a correctly signed, unexpired cookie', async () => {
        const cookie = await makeCookie('user-123', 'author');
        const result = await parseSessionCookie(cookie, TEST_SECRET);

        expect(result).not.toBeNull();
        expect(result?.userId).toBe('user-123');
        expect(result?.role).toBe('author');
    });

    test('round-trips all BUILDER_ROLES correctly', async () => {
        for (const role of BUILDER_ROLES) {
            const cookie = await makeCookie('u1', role);
            const result = await parseSessionCookie(cookie, TEST_SECRET);
            expect(result?.role).toBe(role);
        }
    });
});

test.describe('parseSessionCookie — tampered signatures', () => {
    test('returns null when signature is altered by one character', async () => {
        const cookie = await makeCookie('user-1', 'author');
        // Flip the last character of the signature segment
        const parts = cookie.split('.');
        const sig = parts[1];
        const tampered = sig.slice(0, -1) + (sig.at(-1) === 'a' ? 'b' : 'a');
        const result = await parseSessionCookie(`${parts[0]}.${tampered}`, TEST_SECRET);

        expect(result).toBeNull();
    });

    test('returns null when payload is altered but signature is kept', async () => {
        const cookie = await makeCookie('user-1', 'author');
        const parts = cookie.split('.');
        // Rebuild cookie with a different (valid-looking) payload but original signature
        const differentCookie = await makeCookie('attacker', 'author');
        const differentPayload = differentCookie.split('.')[0];
        const result = await parseSessionCookie(`${differentPayload}.${parts[1]}`, TEST_SECRET);

        expect(result).toBeNull();
    });
});

test.describe('parseSessionCookie — expiry', () => {
    test('returns null for a cookie whose exp is in the past', async () => {
        // Create a cookie with a timestamp 24 hours in the past so it is already expired
        const pastNow = Math.floor(Date.now() / 1000) - 60 * 60 * 24;
        const cookie = await makeCookie('user-1', 'author', TEST_SECRET, pastNow);
        const result = await parseSessionCookie(cookie, TEST_SECRET);

        expect(result).toBeNull();
    });

    test('returns null for a missing raw cookie value', async () => {
        const result = await parseSessionCookie(undefined, TEST_SECRET);
        expect(result).toBeNull();
    });

    test('returns null for a missing secret', async () => {
        const cookie = await makeCookie('user-1', 'author');
        const result = await parseSessionCookie(cookie, undefined);
        expect(result).toBeNull();
    });
});

test.describe('parseSessionCookie — role validation', () => {
    test('returns a session for valid builder roles', async () => {
        const cookie = await makeCookie('u1', 'author');
        expect(await parseSessionCookie(cookie, TEST_SECRET)).not.toBeNull();

        const cookie2 = await makeCookie('u2', 'editor');
        expect(await parseSessionCookie(cookie2, TEST_SECRET)).not.toBeNull();
    });

    test('still returns a session for non-builder roles (role validation is middleware concern)', async () => {
        // parseSessionCookie does NOT enforce roles — it only validates structure/expiry/signature.
        // Role enforcement is done in builderAuth middleware.
        const cookie = await makeCookie('u1', 'viewer');
        const result = await parseSessionCookie(cookie, TEST_SECRET);
        expect(result).not.toBeNull();
        expect(result?.role).toBe('viewer');
    });
});

test.describe('createSignedSessionCookieValue — cache does not grow unboundedly', () => {
    test('correctly signs with multiple different secrets without error', async () => {
        // Use 6 different secrets (> MAX_CRYPTO_CACHE_SIZE=4) to exercise cache eviction.
        // We can only observe this via correct behavior (no crash, correct verification).
        const secrets = ['s1', 's2', 's3', 's4', 's5', 's6'];
        for (const secret of secrets) {
            const cookie = await makeCookie('user', 'author', secret);
            const result = await parseSessionCookie(cookie, secret);
            expect(result?.userId).toBe('user');
        }
    });

    test('earlier secrets still verify correctly after cache eviction (FIFO eviction)', async () => {
        // Build a cookie with secret s1, then exhaust the cache with s2-s5, then verify s1 still works.
        // This confirms the cache eviction does not permanently break re-used secrets.
        const s1 = 'cache-test-s1';
        const cookieS1 = await makeCookie('u1', 'author', s1);

        // Fill cache past MAX_CRYPTO_CACHE_SIZE
        for (let i = 2; i <= 6; i += 1) {
            await makeCookie('u', 'author', `cache-test-s${i}`);
        }

        // s1 was evicted; re-importing it should work correctly
        const result = await parseSessionCookie(cookieS1, s1);
        expect(result).not.toBeNull();
        expect(result?.userId).toBe('u1');
    });
});

test.describe('authErrorResponse — shape contract', () => {
    test('auth_required returns HTTP 401 with correct error shape', async () => {
        const response = authErrorResponse({
            status: 401,
            code: 'auth_required',
            message: 'You must be signed in.',
            path: '/builder'
        });

        expect(response.status).toBe(401);
        const body = (await response.json()) as {
            error: {
                code: string;
                message: string;
                status: number;
                path: string;
                requiredRoles: string[];
            };
        };
        expect(body.error.code).toBe('auth_required');
        expect(body.error.status).toBe(401);
        expect(body.error.path).toBe('/builder');
        expect(body.error.message).toBeTruthy();
        expect(Array.isArray(body.error.requiredRoles)).toBe(true);
        expect(body.error.requiredRoles).toEqual([...BUILDER_ROLES]);
    });

    test('insufficient_role returns HTTP 403 with correct error shape', async () => {
        const response = authErrorResponse({
            status: 403,
            code: 'insufficient_role',
            message: 'Requires author or editor role.',
            path: '/api/builder/generate-draft'
        });

        expect(response.status).toBe(403);
        const body = (await response.json()) as { error: { code: string; status: number } };
        expect(body.error.code).toBe('insufficient_role');
        expect(body.error.status).toBe(403);
    });
});
