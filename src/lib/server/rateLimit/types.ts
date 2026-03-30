export type RateLimitCounter = {
	count: number;
	resetAt: number;
};

export interface RateLimitStore {
	increment(key: string, options: { now: number; windowMs: number }): RateLimitCounter;
}
