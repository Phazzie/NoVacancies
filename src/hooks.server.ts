import { sequence } from '@sveltejs/kit/hooks';

import { aiRateLimit } from '$lib/server/middleware/aiRateLimit';
import { securityHeaders } from '$lib/server/middleware/securityHeaders';
import { builderAuth } from '$lib/server/middleware/builderAuth';

// securityHeaders is listed first so it wraps all subsequent handlers — this ensures
// that even 429 rate-limit and 401/403 auth responses receive the baseline security headers.
export const handle = sequence(securityHeaders, builderAuth, aiRateLimit);
