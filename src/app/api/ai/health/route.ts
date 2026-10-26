import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handleDiagnostic();
}

export async function POST() {
  return handleDiagnostic();
}

async function handleDiagnostic(): Promise<NextResponse> {
  const rawKey = process.env.GEMINI_API_KEY;
  const isConfigured = Boolean(rawKey && rawKey.trim().length > 0);

  if (!isConfigured) {
    return NextResponse.json(
      {
        status: "error",
        step: "environment_check",
        apiKeyConfigured: false,
        error: "GEMINI_API_KEY environment variable is not defined in process.env",
      },
      { status: 503 }
    );
  }

  // Check key formatting safely (never reveal key)
  const cleanedKey = (rawKey || "").replace(/^["']|["']$/g, "").trim();
  const keyLength = cleanedKey.length;
  const startsWithAIza = cleanedKey.startsWith("AIza");
  const hasWhitespace = /\s/.test(cleanedKey);

  const keyMeta = {
    configured: true,
    length: keyLength,
    startsWithAIza,
    hasWhitespace,
  };

  const modelsToTest = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
  const results: Record<string, { success: boolean; response?: string; error?: Record<string, unknown> }> = {};

  const genAI = new GoogleGenerativeAI(cleanedKey);

  for (const modelName of modelsToTest) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          maxOutputTokens: 20,
          temperature: 0.1,
        },
      });

      const response = await model.generateContent("Respond with the word OK.", {
        signal: controller.signal,
      });

      const text = response.response.text();
      results[modelName] = {
        success: true,
        response: text.trim(),
      };
    } catch (err: unknown) {
      const errorObj = err as {
        name?: string;
        message?: string;
        status?: number;
        statusText?: string;
        errorDetails?: unknown;
      };

      // Sanitize error message to ensure no accidental key exposure
      const safeMessage = (errorObj.message || "Unknown error").replace(
        cleanedKey,
        "[REDACTED_API_KEY]"
      );

      console.error(`[Gemini Health Check] Model ${modelName} failed:`, {
        name: errorObj.name,
        status: errorObj.status,
        statusText: errorObj.statusText,
        message: safeMessage,
      });

      results[modelName] = {
        success: false,
        error: {
          name: errorObj.name || "Error",
          status: errorObj.status || 500,
          statusText: errorObj.statusText || "",
          message: safeMessage,
          details: errorObj.errorDetails,
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  const anySuccess = Object.values(results).some((r) => r.success);

  return NextResponse.json(
    {
      status: anySuccess ? "ok" : "error",
      keyMeta,
      models: results,
      timestamp: new Date().toISOString(),
    },
    { status: anySuccess ? 200 : 502 }
  );
}
