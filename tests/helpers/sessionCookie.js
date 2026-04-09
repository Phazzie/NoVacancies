const SESSION_COOKIE_NAME = 'nv_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function bytesToBase64Url(bytes) {
    return Buffer.from(bytes)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

export async function createSignedSessionCookieValue({
    userId = 'test-author',
    role = 'author',
    secret
} = {}) {
    if (!secret) {
        throw new Error('AUTH_SESSION_SECRET is required for signed test session cookies');
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const payload = {
        userId,
        role,
        iat: nowSeconds,
        exp: nowSeconds + SESSION_TTL_SECONDS
    };
    const encodedPayload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(encodedPayload));
    const signature = bytesToBase64Url(new Uint8Array(signatureBuffer));
    return `${encodedPayload}.${signature}`;
}

export { SESSION_COOKIE_NAME };
