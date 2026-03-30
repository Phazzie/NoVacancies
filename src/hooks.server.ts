import { sequence } from '@sveltejs/kit/hooks';

import { aiRateLimit } from '$lib/server/middleware/aiRateLimit';
import { securityHeaders } from '$lib/server/middleware/securityHeaders';

export const handle = sequence(securityHeaders, aiRateLimit);
