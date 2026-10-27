import { globalApiRateLimiter } from "@/infrastructure/security/RateLimiter";
import { NextResponse } from "next/server";

// --- Explicit Gemini Error Classes for Structured Error Handling ---
export class ConfigurationError extends Error {
  readonly code = "CONFIG_ERROR";
  readonly status = 503;
  constructor(message: string = "Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable in your Vercel project settings or .env.local file.") {
    super(message);
    this.name = "ConfigurationError";
  }
}

export class AuthenticationError extends Error {
  readonly code = "AUTH_ERROR";
  readonly status = 401;
  constructor(message: string = "Gemini API authentication failed. Please verify your GEMINI_API_KEY.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class ValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  readonly status = 400;
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class RateLimitError extends Error {
  readonly code = "RATE_LIMIT_ERROR";
  readonly status = 429;
  constructor(message: string = "Gemini API rate limit or quota exceeded. Please wait a moment and try again.") {
    super(message);
    this.name = "RateLimitError";
  }
}

export class TimeoutError extends Error {
  readonly code = "TIMEOUT_ERROR";
  readonly status = 504;
  constructor(message: string = "The Gemini AI request timed out. Please try again.") {
    super(message);
    this.name = "TimeoutError";
  }
}

export class GeminiApiError extends Error {
  readonly code = "GEMINI_API_ERROR";
  readonly status: number;
  constructor(message: string, status: number = 502) {
    super(message);
    this.name = "GeminiApiError";
    this.status = status;
  }
}

export class ResponseParsingError extends Error {
  readonly code = "RESPONSE_PARSING_ERROR";
  readonly status = 502;
  constructor(message: string = "Unable to parse structured AI output from Gemini. Please retry.") {
    super(message);
    this.name = "ResponseParsingError";
  }
}

/**
 * Strips any potential secret tokens or long credential hashes from log/error messages.
 */
function sanitizeErrorMessage(msg: string): string {
  return msg
    .replace(/AIza[0-9A-Za-z-_]{35}/g, "[REDACTED_API_KEY]")
    .replace(/(bearer|token|key)[:=]\s*["']?[^"'\s]+/gi, "$1=[REDACTED]");
}

export function checkRateLimit(request: Request): NextResponse | null {
  // Check payload size if provided to prevent resource exhaustion attacks
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 100_000) {
    return NextResponse.json(
      { error: "Payload too large. Maximum allowed size is 100KB." },
      { status: 413 }
    );
  }

  // Cross-origin request validation (CSRF & unauthorized cross-origin invocation mitigation)
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
      if (host && originHost !== host) {
        return NextResponse.json(
          { error: "Cross-origin requests are not permitted." },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Malformed origin header." },
        { status: 400 }
      );
    }
  }

  // Use client IP or fallback identifier
  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "client-default";

  const result = globalApiRateLimiter.check(ip);
  if (!result.allowed) {
    const retrySeconds = Math.ceil((result.resetTime - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Please wait a moment before sending more AI requests.",
        retryAfter: retrySeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retrySeconds),
        },
      }
    );
  }
  return null;
}

export function handleApiError(error: unknown): NextResponse {
  const errorObj = error as {
    name?: string;
    message?: string;
    status?: number;
    statusText?: string;
    code?: string;
  };

  const rawMessage =
    error instanceof Error ? error.message : "An unexpected error occurred.";
  const safeMessage = sanitizeErrorMessage(rawMessage);
  const statusNumber = typeof errorObj?.status === "number" ? errorObj.status : 500;

  // Safe server-side diagnostic logging (never reveals API keys or secrets)
  console.error("[Gemini Request Failed]", {
    timestamp: new Date().toISOString(),
    errorType: error instanceof Error ? error.constructor.name : typeof error,
    status: statusNumber,
    message: safeMessage,
  });

  // 1. Missing or unconfigured API key
  if (
    error instanceof ConfigurationError ||
    safeMessage.includes("GEMINI_API_KEY") ||
    safeMessage.includes("API key is not configured")
  ) {
    return NextResponse.json(
      {
        error:
          "Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable in your Vercel project settings or .env.local file.",
        code: "CONFIG_ERROR",
      },
      { status: 503 }
    );
  }

  // 2. Authentication failure (Invalid API key / 401 / 403)
  if (
    error instanceof AuthenticationError ||
    statusNumber === 401 ||
    statusNumber === 403 ||
    safeMessage.includes("API_KEY_INVALID") ||
    safeMessage.includes("API key not valid") ||
    safeMessage.includes("unauthorized")
  ) {
    return NextResponse.json(
      {
        error: "Gemini API authentication failed. Please verify your GEMINI_API_KEY.",
        code: "AUTH_ERROR",
      },
      { status: 401 }
    );
  }

  // 3. Request validation or input error (400)
  if (
    error instanceof ValidationError ||
    statusNumber === 400 ||
    safeMessage.includes("validation failed") ||
    safeMessage.includes("Invalid request") ||
    safeMessage.includes("exceeds maximum")
  ) {
    return NextResponse.json(
      {
        error: safeMessage,
        code: "VALIDATION_ERROR",
      },
      { status: 400 }
    );
  }

  // 4. Rate limit or quota exceeded (429)
  if (
    error instanceof RateLimitError ||
    statusNumber === 429 ||
    safeMessage.includes("quota") ||
    safeMessage.includes("Resource has been exhausted")
  ) {
    return NextResponse.json(
      {
        error: "Gemini API rate limit or quota exceeded. Please wait a moment and try again.",
        code: "RATE_LIMIT_ERROR",
      },
      { status: 429, headers: { "Retry-After": "10" } }
    );
  }

  // 5. Request timeout (504)
  if (
    error instanceof TimeoutError ||
    errorObj?.name === "AbortError" ||
    errorObj?.name === "GoogleGenerativeAIAbortError" ||
    safeMessage.includes("timed out") ||
    safeMessage.includes("aborted")
  ) {
    return NextResponse.json(
      {
        error: "The Gemini AI request timed out. Please try again.",
        code: "TIMEOUT_ERROR",
      },
      { status: 504 }
    );
  }

  // 6. Response parsing or schema error (502)
  if (
    error instanceof ResponseParsingError ||
    safeMessage.includes("Failed to parse") ||
    safeMessage.includes("schema validation failed")
  ) {
    return NextResponse.json(
      {
        error: "Unable to parse structured AI output from Gemini. Please retry.",
        code: "RESPONSE_PARSING_ERROR",
      },
      { status: 502 }
    );
  }

  // 7. High demand / Service unavailable (503)
  if (
    statusNumber === 503 ||
    safeMessage.includes("high demand") ||
    safeMessage.includes("Service Unavailable")
  ) {
    return NextResponse.json(
      {
        error: "Gemini AI service is currently experiencing high demand. Please try again shortly.",
        code: "SERVICE_UNAVAILABLE",
      },
      { status: 503 }
    );
  }

  // 8. General AI service error (500)
  return NextResponse.json(
    {
      error: "Unable to process your request at this time. Please try again.",
      code: "AI_SERVICE_ERROR",
    },
    { status: 500 }
  );
}
