import { describe, expect, it } from "vitest";
import {
  AuthenticationError,
  checkRateLimit,
  ConfigurationError,
  GeminiApiError,
  handleApiError,
  RateLimitError,
  ResponseParsingError,
  TimeoutError,
  ValidationError,
} from "./apiHelper";
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

  it("handles authentication error with 401 status", async () => {
    const err = new Error("API_KEY_INVALID: API key not valid");
    const response = handleApiError(err);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.code).toBe("AUTH_ERROR");
  });

  it("handles rate limit error with 429 status and Retry-After header", async () => {
    const err = new Error("Resource has been exhausted (quota limit reached)");
    const response = handleApiError(err);
    expect(response.status).toBe(429);
    const json = await response.json();
    expect(json.code).toBe("RATE_LIMIT_ERROR");
    expect(response.headers.get("Retry-After")).toBe("10");
  });

  it("handles timeout error with 504 status", async () => {
    const err = new Error("The request timed out");
    const response = handleApiError(err);
    expect(response.status).toBe(504);
    const json = await response.json();
    expect(json.code).toBe("TIMEOUT_ERROR");
  });

  it("handles parsing error with 502 status", async () => {
    const err = new Error("Failed to parse JSON response");
    const response = handleApiError(err);
    expect(response.status).toBe(502);
    const json = await response.json();
    expect(json.code).toBe("RESPONSE_PARSING_ERROR");
  });

  it("handles high demand 503 status", async () => {
    const err = new Error("This model is currently experiencing high demand");
    const response = handleApiError(err);
    expect(response.status).toBe(503);
    const json = await response.json();
    expect(json.code).toBe("SERVICE_UNAVAILABLE");
  });

  describe("Custom Error Classes", () => {
    it("instantiates ConfigurationError with default and custom messages", () => {
      const errDefault = new ConfigurationError();
      expect(errDefault.code).toBe("CONFIG_ERROR");
      expect(errDefault.status).toBe(503);
      expect(errDefault.name).toBe("ConfigurationError");
      expect(errDefault.message).toContain("GEMINI_API_KEY");

      const errCustom = new ConfigurationError("Custom config error");
      expect(errCustom.message).toBe("Custom config error");

      const res = handleApiError(errCustom);
      expect(res.status).toBe(503);
    });

    it("instantiates AuthenticationError with default and custom messages", () => {
      const errDefault = new AuthenticationError();
      expect(errDefault.code).toBe("AUTH_ERROR");
      expect(errDefault.status).toBe(401);
      expect(errDefault.name).toBe("AuthenticationError");

      const errCustom = new AuthenticationError("Custom auth failure");
      expect(errCustom.message).toBe("Custom auth failure");

      const res = handleApiError(errCustom);
      expect(res.status).toBe(401);
    });

    it("instantiates ValidationError with custom message", () => {
      const err = new ValidationError("Invalid field");
      expect(err.code).toBe("VALIDATION_ERROR");
      expect(err.status).toBe(400);
      expect(err.name).toBe("ValidationError");

      const res = handleApiError(err);
      expect(res.status).toBe(400);
    });

    it("instantiates RateLimitError with default and custom messages", () => {
      const errDefault = new RateLimitError();
      expect(errDefault.code).toBe("RATE_LIMIT_ERROR");
      expect(errDefault.status).toBe(429);
      expect(errDefault.name).toBe("RateLimitError");

      const errCustom = new RateLimitError("Custom quota exceeded");
      expect(errCustom.message).toBe("Custom quota exceeded");

      const res = handleApiError(errCustom);
      expect(res.status).toBe(429);
    });

    it("instantiates TimeoutError with default and custom messages", () => {
      const errDefault = new TimeoutError();
      expect(errDefault.code).toBe("TIMEOUT_ERROR");
      expect(errDefault.status).toBe(504);
      expect(errDefault.name).toBe("TimeoutError");

      const errCustom = new TimeoutError("Custom timeout");
      expect(errCustom.message).toBe("Custom timeout");

      const res = handleApiError(errCustom);
      expect(res.status).toBe(504);
    });

    it("instantiates GeminiApiError with default and custom statuses", () => {
      const errDefault = new GeminiApiError("API failure");
      expect(errDefault.code).toBe("GEMINI_API_ERROR");
      expect(errDefault.status).toBe(502);
      expect(errDefault.name).toBe("GeminiApiError");

      const errCustom = new GeminiApiError("Bad Gateway", 502);
      expect(errCustom.status).toBe(502);
    });

    it("instantiates ResponseParsingError with default and custom messages", () => {
      const errDefault = new ResponseParsingError();
      expect(errDefault.code).toBe("RESPONSE_PARSING_ERROR");
      expect(errDefault.status).toBe(502);
      expect(errDefault.name).toBe("ResponseParsingError");

      const errCustom = new ResponseParsingError("Failed schema");
      expect(errCustom.message).toBe("Failed schema");

      const res = handleApiError(errCustom);
      expect(res.status).toBe(502);
    });
  });

  describe("handleApiError error redaction and branches", () => {
    it("redacts API keys and auth tokens from error message logging", () => {
      const err = new Error("Failed connecting with AIzaSyExampleRealLookingKey123456789 and token: secret_token_xyz");
      const res = handleApiError(err);
      expect(res.status).toBe(500);
    });

    it("handles AbortError name gracefully", async () => {
      const err = { name: "AbortError", message: "aborted" };
      const res = handleApiError(err);
      expect(res.status).toBe(504);
      const json = await res.json();
      expect(json.code).toBe("TIMEOUT_ERROR");
    });

    it("handles statusNumber 403 as auth error", async () => {
      const err = { status: 403, message: "Forbidden" };
      const res = handleApiError(err);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.code).toBe("AUTH_ERROR");
    });

    it("handles statusNumber 503 as service unavailable", async () => {
      const err = { status: 503, message: "Backend overloaded" };
      const res = handleApiError(err);
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.code).toBe("SERVICE_UNAVAILABLE");
    });

    it("handles SyntaxError as malformed JSON with 400 status", async () => {
      const err = new SyntaxError("Unexpected token < in JSON at position 0");
      const res = handleApiError(err);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("VALIDATION_ERROR");
      expect(json.error).toBe("Invalid or malformed JSON payload in request.");
    });
  });

  describe("API Security Gates in checkRateLimit", () => {
    it("rejects unsupported HTTP methods with 405 Method Not Allowed", () => {
      const req = new Request("http://localhost/api/test", {
        method: "DELETE",
      });
      const res = checkRateLimit(req);
      expect(res).not.toBeNull();
      expect(res?.status).toBe(405);
    });

    it("rejects invalid content-length header with 400 Bad Request", () => {
      const req = new Request("http://localhost/api/test", {
        method: "POST",
        headers: { "content-length": "-10" },
      });
      const res = checkRateLimit(req);
      expect(res).not.toBeNull();
      expect(res?.status).toBe(400);
    });

    it("rejects non-numeric content-length header with 400 Bad Request", () => {
      const req = new Request("http://localhost/api/test", {
        method: "POST",
        headers: { "content-length": "invalid-num" },
      });
      const res = checkRateLimit(req);
      expect(res).not.toBeNull();
      expect(res?.status).toBe(400);
    });

    it("rejects POST requests with non-JSON content-type with 415 Unsupported Media Type", () => {
      const req = new Request("http://localhost/api/test", {
        method: "POST",
        headers: {
          "content-length": "50",
          "content-type": "text/html",
        },
      });
      const res = checkRateLimit(req);
      expect(res).not.toBeNull();
      expect(res?.status).toBe(415);
    });

    it("accepts valid POST request with application/json", () => {
      const req = new Request("http://localhost/api/test", {
        method: "POST",
        headers: {
          "content-length": "50",
          "content-type": "application/json",
          "x-real-ip": "10.10.10.10",
        },
      });
      const res = checkRateLimit(req);
      expect(res).toBeNull();
    });

    it("rejects cross-site requests via sec-fetch-site header with 403 Forbidden", () => {
      const req = new Request("http://localhost/api/test", {
        method: "POST",
        headers: {
          "sec-fetch-site": "cross-site",
          "content-length": "50",
          "content-type": "application/json",
        },
      });
      const res = checkRateLimit(req);
      expect(res).not.toBeNull();
      expect(res?.status).toBe(403);
    });
  });

  describe("apiSuccess", () => {
    it("returns NextResponse with security and cache-control headers", async () => {
      const { apiSuccess } = await import("./apiHelper");
      const res = apiSuccess({ data: "ok" }, 201);
      expect(res.status).toBe(201);
      expect(res.headers.get("Cache-Control")).toBe("no-store, max-age=0, must-revalidate");
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(res.headers.get("X-Frame-Options")).toBe("DENY");
      const json = await res.json();
      expect(json.data).toBe("ok");
    });
  });

});
