import { globalApiRateLimiter } from "@/infrastructure/security/RateLimiter";
import { NextResponse } from "next/server";

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
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Please wait a moment before sending more AI requests.",
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }
  return null;
}

export function handleApiError(error: unknown): NextResponse {
  const message =
    error instanceof Error
      ? error.message
      : "An unexpected error occurred while processing your request.";

  // Safe user-friendly message for missing API key
  if (message.includes("GEMINI_API_KEY") || message.includes("API key")) {
    return NextResponse.json(
      {
        error:
          "Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable in your Vercel project settings or .env.local file.",
        code: "CONFIG_ERROR",
      },
      { status: 503 }
    );
  }

  // Known validation errors from schema or length bounds
  if (
    message.includes("validation failed") ||
    message.includes("Invalid request") ||
    message.includes("exceeds maximum")
  ) {
    return NextResponse.json(
      {
        error: message,
        code: "VALIDATION_ERROR",
      },
      { status: 400 }
    );
  }

  // Mask internal server errors to prevent leaking internal database, path, or network details
  return NextResponse.json(
    {
      error: "Unable to process your request at this time. Please try again.",
      code: "AI_SERVICE_ERROR",
    },
    { status: 500 }
  );
}
