export interface RateLimitDecision {
	allowed: boolean;
	retryAfterSeconds: number;
}

export interface RateLimitStore {
	consume(key: string, now?: number): RateLimitDecision;
}

export interface RateLimitOptions {
	maxRequests: number;
	windowMs: number;
}
