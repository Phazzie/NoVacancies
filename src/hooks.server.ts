import { sequence } from '@sveltejs/kit/hooks';

import { aiRateLimit } from '$lib/server/middleware/aiRateLimit';
import { securityHeaders } from '$lib/server/middleware/securityHeaders';

// securityHeaders is listed first so it wraps aiRateLimit — this ensures
// that even 429 rate-limit responses receive the baseline security headers.
export const handle = sequence(securityHeaders, aiRateLimit);
