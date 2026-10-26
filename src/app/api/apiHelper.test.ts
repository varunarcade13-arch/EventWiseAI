import { describe, expect, it } from "vitest";
import { checkRateLimit, handleApiError } from "./apiHelper";
import { globalApiRateLimiter } from "@/infrastructure/security/RateLimiter";

describe("apiHelper", () => {
  it("allows requests under the rate limit", () => {
    globalApiRateLimiter.reset();
    const req = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "192.168.1.1" },
    });
    const res = checkRateLimit(req);
    expect(res).toBeNull();
  });

  it("returns 429 when rate limit is exceeded", () => {
    globalApiRateLimiter.reset();
    const req = new Request("http://localhost/api/test", {
      headers: { "x-real-ip": "10.0.0.99" },
    });
    // Trigger 30 requests
    for (let i = 0; i < 30; i++) {
      checkRateLimit(req);
    }
    const blockedRes = checkRateLimit(req);
    expect(blockedRes).not.toBeNull();
    expect(blockedRes?.status).toBe(429);
  });

  it("extracts fallback ip when headers are absent", () => {
    globalApiRateLimiter.reset();
    const req = new Request("http://localhost/api/test");
    const res = checkRateLimit(req);
    expect(res).toBeNull();
  });

  it("handles GEMINI_API_KEY error with 503 status and friendly message", async () => {
    const err = new Error("GEMINI_API_KEY is not configured");
    const response = handleApiError(err);
    expect(response.status).toBe(503);
    const json = await response.json();
    expect(json.code).toBe("CONFIG_ERROR");
  });

  it("handles standard errors with 500 status", async () => {
    const err = new Error("Database timeout");
    const response = handleApiError(err);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("Database timeout");
  });

  it("handles non-Error objects safely", async () => {
    const response = handleApiError("string exception");
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("An unexpected error occurred while processing your request.");
  });
});
