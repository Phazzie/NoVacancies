/**
 * Supabase server-side client (service-role key).
 *
 * Required env vars (server-only — never expose to the browser):
 *   SUPABASE_URL              — Project URL, e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY — Service-role key (bypasses RLS on the server)
 *
 * When either var is absent the factory returns null and every repository
 * function becomes a no-op, so the app runs normally without a database
 * during local development.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './schema';

type NVClient = SupabaseClient<Database>;

function getRuntimeEnv(key: string): string | undefined {
	const runtimeProcess = globalThis as {
		process?: { env?: Record<string, string | undefined> };
	};
	return runtimeProcess.process?.env?.[key];
}

let cached: NVClient | null = null;
let unavailable = false; // set once we know the env vars are absent

/**
 * Returns the Supabase client, creating it lazily on first call.
 * Returns null when SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are missing.
 */
export function getSupabaseClient(): NVClient | null {
	if (cached) return cached;
	if (unavailable) return null;

	const url = getRuntimeEnv('SUPABASE_URL');
	const key = getRuntimeEnv('SUPABASE_SERVICE_ROLE_KEY');

	if (!url || !key) {
		unavailable = true;
		return null;
	}

	cached = createClient<Database>(url, key, {
		auth: {
			// Never persist the service-role session in memory — it does not
			// represent a user and must not appear in cookie/storage.
			persistSession: false,
			autoRefreshToken: false
		}
	});
	return cached;
}

/** Reset the cached client (useful in test teardown). */
export function resetSupabaseClient(): void {
	cached = null;
	unavailable = false;
}
