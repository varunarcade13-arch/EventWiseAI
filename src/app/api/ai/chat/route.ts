import { checkRateLimit, handleApiError } from "@/app/api/apiHelper";
import { GeminiAIPlannerService } from "@/infrastructure/ai/GeminiAIPlannerService";
import { Sanitizer } from "@/infrastructure/security/Sanitizer";
import { EventModel } from "@/types/event";
import { NextResponse } from "next/server";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(3000),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  context: z
    .object({
      name: z.string().optional(),
      type: z.string().optional(),
      date: z.string().optional(),
      location: z.string().optional(),
      expectedGuests: z.number().optional(),
      totalBudget: z.number().optional(),
      currency: z.string().optional(),
    })
    .optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const rawBody = await request.json();

    const sanitizedMessages = Array.isArray(rawBody.messages)
      ? rawBody.messages.map((m: { role: unknown; content: unknown }) => ({
          role: m.role,
          content: Sanitizer.sanitizeString(m.content, 3000),
        }))
      : [];

    const parseResult = RequestSchema.safeParse({
      messages: sanitizedMessages,
      context: rawBody.context,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid chat payload",
          details: parseResult.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    const planner = new GeminiAIPlannerService();
    const result = await planner.chat(
      parseResult.data.messages,
      parseResult.data.context as Partial<EventModel>
    );

    return NextResponse.json({
      success: true,
      message: result.responseText,
      suggestedPlan: result.suggestedPlan,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
