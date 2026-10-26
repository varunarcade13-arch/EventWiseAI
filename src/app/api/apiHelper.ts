import { globalApiRateLimiter } from "@/infrastructure/security/RateLimiter";
import { NextResponse } from "next/server";

export function checkRateLimit(request: Request): NextResponse | null {
  // Use client IP or fallback identifier
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
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

  return NextResponse.json(
    {
      error: message,
      code: "AI_SERVICE_ERROR",
    },
    { status: 500 }
  );
}
