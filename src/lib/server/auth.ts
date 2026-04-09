import { json, type RequestEvent } from '@sveltejs/kit';

export const BUILDER_ROLES = ['author', 'editor'] as const;
export const SESSION_COOKIE_NAME = 'nv_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

const encoder = new TextEncoder();
// Keep this small and bounded: normal runtime uses one active secret, but rotation overlap
// can require validating a few signatures at once. Four entries comfortably covers common
// rollover windows (current + prior keys) without allowing unbounded growth.
const MAX_CRYPTO_CACHE_SIZE = 4;
const cryptoKeyCache = new Map<string, CryptoKey>();

async function getOrImportKey(secret: string): Promise<CryptoKey> {
	const cached = cryptoKeyCache.get(secret);
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
		const firstInsertedSecret = cryptoKeyCache.keys().next().value;
		if (firstInsertedSecret) {
			cryptoKeyCache.delete(firstInsertedSecret);
		}
	}
	cryptoKeyCache.set(secret, key);
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
		typeof payload.role === 'string' &&
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

export async function parseSessionCookie(
	rawCookie: string | undefined,
	secret: string | undefined
): Promise<SessionUser | null> {
	if (!rawCookie || !secret) return null;
	const [encodedPayload, signature] = rawCookie.split('.');
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
	const runtimeProcess = globalThis as { process?: { env?: Record<string, string | undefined> } };
	return runtimeProcess.process?.env?.AUTH_SESSION_SECRET;
}

export async function getSessionUser(event: RequestEvent): Promise<SessionUser | null> {
	return parseSessionCookie(event.cookies.get(SESSION_COOKIE_NAME), getAuthSessionSecret());
}
