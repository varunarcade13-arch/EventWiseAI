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

  it("rejects payloads exceeding 100KB with 413", () => {
    const req = new Request("http://localhost/api/test", {
      headers: { "content-length": "100001" },
    });
    const res = checkRateLimit(req);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(413);
  });

  it("permits same-origin requests", () => {
    globalApiRateLimiter.reset();
    const req = new Request("http://localhost/api/test", {
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
    });
    const res = checkRateLimit(req);
    expect(res).toBeNull();
  });

  it("rejects cross-origin requests with 403", () => {
    const req = new Request("http://localhost/api/test", {
      headers: {
        host: "localhost:3000",
        origin: "http://malicious-website.com",
      },
    });
    const res = checkRateLimit(req);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(403);
  });

  it("rejects malformed origin headers with 400", () => {
    const req = new Request("http://localhost/api/test", {
      headers: {
        host: "localhost:3000",
        origin: "not a valid url",
      },
    });
    const res = checkRateLimit(req);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(400);
  });

  it("handles GEMINI_API_KEY error with 503 status and friendly message", async () => {
    const err = new Error("GEMINI_API_KEY is not configured");
    const response = handleApiError(err);
    expect(response.status).toBe(503);
    const json = await response.json();
    expect(json.code).toBe("CONFIG_ERROR");
  });

  it("handles validation error with 400 status", async () => {
    const err = new Error("AI plan schema validation failed");
    const response = handleApiError(err);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.code).toBe("VALIDATION_ERROR");
  });

  it("masks internal server errors with safe 500 message", async () => {
    const err = new Error("Database timeout at /var/www/internal.db:5432");
    const response = handleApiError(err);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("Unable to process your request at this time. Please try again.");
    expect(json.error).not.toContain("internal.db");
  });

  it("handles non-Error objects safely", async () => {
    const response = handleApiError("string exception");
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("Unable to process your request at this time. Please try again.");
  });
});
