import { json, type RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

export const BUILDER_ROLES = ['author', 'editor'] as const;
export const SESSION_COOKIE_NAME = 'nv_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

const encoder = new TextEncoder();
// Keep this small and bounded: normal runtime uses one active secret, but rotation overlap
// can require validating a few signatures at once. Four entries comfortably covers common
// rollover windows (current + prior keys) without allowing unbounded growth.
const MAX_CRYPTO_CACHE_SIZE = 4;
// The cache is keyed on a SHA-256 fingerprint of the secret rather than the raw secret
// string, so the plaintext secret never lives as a Map key in memory.
const cryptoKeyCache = new Map<string, CryptoKey>();

async function secretFingerprint(secret: string): Promise<string> {
	const buf = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
	return Array.from(new Uint8Array(buf))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

async function getOrImportKey(secret: string): Promise<CryptoKey> {
	const fingerprint = await secretFingerprint(secret);
	const cached = cryptoKeyCache.get(fingerprint);
	if (cached) return cached;
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	if (cryptoKeyCache.size >= MAX_CRYPTO_CACHE_SIZE) {
		// Map iteration order is insertion order; evict the first inserted key (FIFO).
		const firstInsertedFingerprint = cryptoKeyCache.keys().next().value;
		if (firstInsertedFingerprint) {
			cryptoKeyCache.delete(firstInsertedFingerprint);
		}
	}
	cryptoKeyCache.set(fingerprint, key);
	return key;
}

export function isBuilderRole(role: string): role is (typeof BUILDER_ROLES)[number] {
	return BUILDER_ROLES.includes(role as (typeof BUILDER_ROLES)[number]);
}

export interface SessionUser {
	userId: string;
	role: string;
}

interface SessionEnvelope {
	userId?: string;
	role?: string;
	iat?: number;
	exp?: number;
}

function bytesToBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value: string): Uint8Array {
	const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
	const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

function base64UrlEncode(value: string): string {
	return bytesToBase64Url(encoder.encode(value));
}

function base64UrlDecode(value: string): string {
	return new TextDecoder().decode(base64UrlToBytes(value));
}

async function signPayload(encodedPayload: string, secret: string): Promise<string> {
	const key = await getOrImportKey(secret);
	const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(encodedPayload));
	return bytesToBase64Url(new Uint8Array(signatureBuffer));
}

function constantTimeEquals(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i += 1) {
		diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return diff === 0;
}

function isValidSessionEnvelope(payload: SessionEnvelope, nowSeconds: number): payload is Required<SessionEnvelope> {
	return (
		typeof payload.userId === 'string' &&
		payload.userId.length > 0 &&
		typeof payload.role === 'string' &&
		payload.role.length > 0 &&
		typeof payload.iat === 'number' &&
		typeof payload.exp === 'number' &&
		payload.iat > 0 &&
		payload.exp > nowSeconds &&
		payload.exp >= payload.iat
	);
}

export async function createSignedSessionCookieValue(
	user: SessionUser,
	secret: string,
	nowSeconds = Math.floor(Date.now() / 1000)
): Promise<string> {
	const envelope: Required<SessionEnvelope> = {
		userId: user.userId,
		role: user.role,
		iat: nowSeconds,
		exp: nowSeconds + SESSION_MAX_AGE_SECONDS
	};
	const encodedPayload = base64UrlEncode(JSON.stringify(envelope));
	const signature = await signPayload(encodedPayload, secret);
	return `${encodedPayload}.${signature}`;
}

/**
 * Parse and verify a signed session cookie.
 *
 * SECURITY: A non-null return value is the ONLY trustworthy signal that a request
 * carries a valid, server-issued identity. The HMAC-SHA256 signature is verified
 * against the configured `AUTH_SESSION_SECRET` using a constant-time comparison
 * before any field of the payload is consumed. If the secret is unset, every
 * cookie is treated as unauthenticated — we never accept an unverified envelope.
 *
 * Callers (e.g. `getSessionUser` and the `builderAuth` middleware) must treat a
 * `null` return as "no authenticated session" and refuse to fall back to any
 * client-supplied identity hint (headers, body fields, query params, etc.).
 */
export async function parseSessionCookie(
	rawCookie: string | undefined,
	secret: string | undefined
): Promise<SessionUser | null> {
	if (!rawCookie || !secret) return null;
	// A well-formed cookie has exactly two `.`-separated segments: payload.signature.
	// Reject anything else outright to keep the verification path unambiguous.
	const segments = rawCookie.split('.');
	if (segments.length !== 2) return null;
	const [encodedPayload, signature] = segments;
	if (!encodedPayload || !signature) return null;

	try {
		const expectedSignature = await signPayload(encodedPayload, secret);
		if (!constantTimeEquals(signature, expectedSignature)) return null;

		const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionEnvelope;
		const nowSeconds = Math.floor(Date.now() / 1000);
		if (!isValidSessionEnvelope(payload, nowSeconds)) return null;
		return {
			userId: payload.userId,
			role: payload.role
		};
	} catch {
		return null;
	}
}

interface AuthErrorOptions {
	status: 401 | 403;
	code: 'auth_required' | 'insufficient_role';
	message: string;
	path: string;
}

export function authErrorResponse({ status, code, message, path }: AuthErrorOptions): Response {
	return json(
		{
			error: {
				code,
				message,
				status,
				path,
				requiredRoles: [...BUILDER_ROLES]
			}
		},
		{ status }
	);
}

export function getAuthSessionSecret(): string | undefined {
	// Use SvelteKit's `$env/dynamic/private`, which is the only env accessor that
	// resolves correctly across all adapters — including edge runtimes
	// (Cloudflare Workers, Vercel Edge) where `globalThis.process` is undefined.
	const value = env.AUTH_SESSION_SECRET;
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/**
 * Resolve the authenticated session user for the current request, if any.
 *
 * This is the single entry point protected routes should use to learn who the
 * caller is. It delegates to `parseSessionCookie`, which enforces HMAC signature
 * verification, so any non-null result is a server-issued identity.
 */
export async function getSessionUser(event: RequestEvent): Promise<SessionUser | null> {
	return parseSessionCookie(event.cookies.get(SESSION_COOKIE_NAME), getAuthSessionSecret());
}

export function useSecureCookies(url: URL): boolean {
	if (url.protocol === 'https:') return true;
	return !dev;
}

export function isDemoAuthEnabled(): boolean {
	// Use SvelteKit's `$env/dynamic/private` so this works in edge runtimes where
	// `globalThis.process` is undefined.
	return env.DEMO_AUTH_ENABLED === '1';
}
