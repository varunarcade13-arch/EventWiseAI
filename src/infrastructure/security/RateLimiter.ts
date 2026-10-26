export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(options: RateLimiterOptions = { windowMs: 60_000, maxRequests: 30 }) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
  }

  /**
   * Checks if an identifier (e.g. client IP or session key) is within rate limit.
   * Returns true if allowed, false if limit exceeded.
   */
  public check(identifier: string, now: number = Date.now()): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    // Proactively clean up if tracking many clients to prevent memory growth
    if (this.requests.size > 500) {
      this.cleanup(now);
      if (this.requests.size > 1000) {
        const oldestKey = this.requests.keys().next().value;
        if (oldestKey) this.requests.delete(oldestKey);
      }
    }

    const windowStart = now - this.windowMs;
    const timestamps = this.requests.get(identifier) ?? [];

    // Filter out expired timestamps
    const activeTimestamps = timestamps.filter((t) => t > windowStart);

    if (activeTimestamps.length >= this.maxRequests) {
      const oldestActive = activeTimestamps[0] ?? now;
      return {
        allowed: false,
        remaining: 0,
        resetTime: oldestActive + this.windowMs,
      };
    }

    activeTimestamps.push(now);
    this.requests.set(identifier, activeTimestamps);

    return {
      allowed: true,
      remaining: this.maxRequests - activeTimestamps.length,
      resetTime: now + this.windowMs,
    };
  }

  /**
   * Cleans up expired entries across all keys to prevent memory growth.
   */
  public cleanup(now: number = Date.now()): void {
    const windowStart = now - this.windowMs;
    for (const [key, timestamps] of this.requests.entries()) {
      const active = timestamps.filter((t) => t > windowStart);
      if (active.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, active);
      }
    }
  }

  /**
   * Resets rate limit records for all or a specific key (useful for tests).
   */
  public reset(key?: string): void {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

// Global singleton for API routes
export const globalApiRateLimiter = new RateLimiter({
  windowMs: 60_000,
  maxRequests: 30,
});
