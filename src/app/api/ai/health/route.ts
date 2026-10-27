import { GEMINI_CONFIG } from "@/infrastructure/ai/geminiConfig";
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

  const cleanedKey = rawKey!.replace(/^["']|["']$/g, "").trim();
  const keyMeta = {
    configured: true,
    length: cleanedKey.length,
    startsWithAIza: cleanedKey.startsWith("AIza"),
    hasWhitespace: /\s/.test(cleanedKey),
  };

  const genAI = new GoogleGenerativeAI(cleanedKey);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_CONFIG.primaryModel,
      generationConfig: {
        maxOutputTokens: 20,
        temperature: 0.1,
      },
    });

    const response = await model.generateContent("Respond with the word OK.", {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = response.response.text();
    return NextResponse.json(
      {
        status: "ok",
        model: GEMINI_CONFIG.primaryModel,
        response: text.trim(),
        keyMeta,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    clearTimeout(timeout);
    const errRecord = err && typeof err === "object" ? (err as Record<string, unknown>) : {};
    const errorName = typeof errRecord.name === "string" ? errRecord.name : "Error";
    const errorStatus = typeof errRecord.status === "number" ? errRecord.status : 500;
    const errorStatusText = typeof errRecord.statusText === "string" ? errRecord.statusText : "";
    const rawMessage = typeof errRecord.message === "string" ? errRecord.message : "Unknown error";
    const safeMessage = rawMessage.replace(cleanedKey, "[REDACTED_API_KEY]");

    console.error(`[Gemini Health Check] Model ${GEMINI_CONFIG.primaryModel} failed:`, {
      name: errorName,
      status: errorStatus,
      statusText: errorStatusText,
      message: safeMessage,
    });

    return NextResponse.json(
      {
        status: "error",
        model: GEMINI_CONFIG.primaryModel,
        keyMeta,
        error: {
          name: errorName,
          status: errorStatus,
          statusText: errorStatusText,
          message: safeMessage,
          details: errRecord.errorDetails,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 502 }
    );
  }
}
