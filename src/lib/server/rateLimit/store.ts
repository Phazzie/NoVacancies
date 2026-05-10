/**
 * Abstract rate-limit store interface.
 *
 * Implementations must be safe to call concurrently — each call to
 * `increment` is atomic within the window.
 */

export interface RateLimitEntry {
	/** Number of requests seen so far in the current window (including this one). */
	count: number;
	/** Epoch milliseconds when the current window resets. */
	resetAt: number;
}

export interface RateLimitStore {
	/**
	 * Atomically increment the counter for `key` within a sliding window of
	 * `windowMs` milliseconds.  Returns the updated entry.
	 */
	increment(key: string, windowMs: number): Promise<RateLimitEntry>;

	/** Reset the counter for `key` immediately (e.g. after an admin unlock). */
	reset(key: string): Promise<void>;
}
