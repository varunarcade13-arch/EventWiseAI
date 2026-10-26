import { describe, expect, it } from "vitest";
import { RateLimiter } from "./RateLimiter";

describe("RateLimiter", () => {
  it("allows requests within rate limits and blocks when exceeded", () => {
    const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 3 });
    const now = 100000;

    const r1 = limiter.check("user-1", now);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = limiter.check("user-1", now + 100);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = limiter.check("user-1", now + 200);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);

    const r4 = limiter.check("user-1", now + 300);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it("resets capacity after the sliding window expires", () => {
    const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 2 });
    const now = 200000;

    limiter.check("user-2", now);
    limiter.check("user-2", now + 500);

    const blocked = limiter.check("user-2", now + 600);
    expect(blocked.allowed).toBe(false);

    // After 1000ms window passes
    const afterExpiry = limiter.check("user-2", now + 1100);
    expect(afterExpiry.allowed).toBe(true);
  });

  it("cleans up expired records across keys", () => {
    const limiter = new RateLimiter({ windowMs: 500, maxRequests: 5 });
    const now = 300000;

    limiter.check("user-a", now);
    limiter.check("user-b", now + 100);

    limiter.cleanup(now + 600);
    // At now + 600, both user-a and user-b are older than 500ms
    const r = limiter.check("user-a", now + 650);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(4);
  });

  it("resets state on demand", () => {
    const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 1 });
    limiter.check("user-x", 1000);
    expect(limiter.check("user-x", 1050).allowed).toBe(false);

    limiter.reset("user-x");
    expect(limiter.check("user-x", 1100).allowed).toBe(true);

    limiter.check("user-y", 1100);
    limiter.reset();
    expect(limiter.check("user-y", 1150).allowed).toBe(true);
  });

  it("handles default constructor options and default now parameter", () => {
    const defaultLimiter = new RateLimiter();
    const result = defaultLimiter.check("default-user");
    expect(result.allowed).toBe(true);
    defaultLimiter.cleanup();
  });

  it("retains active entries while removing expired ones in cleanup", () => {
    const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 5 });
    const now = 500000;
    // user-1 has one expired timestamp and one active timestamp
    limiter.check("user-1", now);
    limiter.check("user-1", now + 600);

    // at now + 1100, now is expired (diff 1100 > 1000), but now+600 is active (diff 500 < 1000)
    limiter.cleanup(now + 1100);

    // user-1 should still have 1 active timestamp, so remaining should be maxRequests - 2 after checking
    const r = limiter.check("user-1", now + 1200);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(3); // 5 - (1 active + 1 new) = 3
  });

  it("handles maxRequests 0 edge case", () => {
    const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 0 });
    const res = limiter.check("blocked-user");
    expect(res.allowed).toBe(false);
    expect(res.remaining).toBe(0);
  });
});
