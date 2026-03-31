import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { securityHeaders } from '$lib/server/middleware/securityHeaders';
import { aiRateLimit } from '$lib/server/middleware/aiRateLimit';

export const handle: Handle = sequence(securityHeaders, aiRateLimit);
