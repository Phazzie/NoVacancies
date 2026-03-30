import { MemoryRateLimitStore } from './memoryStore';
import type { RateLimitStore } from './types';

const runtimeEnv =
	(globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

const sharedMemoryStore = new MemoryRateLimitStore();

function normalizeStoreName(raw: string | undefined): string {
	return (raw ?? 'memory').trim().toLowerCase();
}

export function createRateLimitStore(
	env: Record<string, string | undefined> = runtimeEnv
): RateLimitStore {
	const storeName = normalizeStoreName(env.RATE_LIMIT_STORE);

	switch (storeName) {
		case 'memory':
			return sharedMemoryStore;
		// Placeholder for future distributed implementations.
		case 'redis':
		case 'kv':
		default:
			return sharedMemoryStore;
	}
}
