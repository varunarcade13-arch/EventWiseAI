import { apiSuccess, API_SECURITY_HEADERS, checkRateLimit, handleApiError } from "@/app/api/apiHelper";
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
      name: z.string().max(200).optional(),
      type: z.string().max(50).optional(),
      date: z.string().max(50).optional(),
      location: z.string().max(200).optional(),
      expectedGuests: z.number().int().positive().max(1000000).optional(),
      totalBudget: z.number().nonnegative().max(10000000000).optional(),
      currency: z.string().max(10).optional(),
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

    const parseResult = RequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid chat payload",
          details: parseResult.error.issues.map((i) => i.message),
        },
        { status: 400, headers: API_SECURITY_HEADERS }
      );
    }

    const { messages, context } = parseResult.data;
    const sanitizedMessages = messages.map((m) => ({
      role: m.role,
      content: Sanitizer.sanitizeString(m.content, 3000),
    }));

    const sanitizedContext = context
      ? {
          ...context,
          name: context.name ? Sanitizer.sanitizeString(context.name, 200) : undefined,
          location: context.location ? Sanitizer.sanitizeString(context.location, 200) : undefined,
        }
      : undefined;

    const planner = new GeminiAIPlannerService();
    const result = await planner.chat(
      sanitizedMessages,
      sanitizedContext as Partial<EventModel>
    );

    return apiSuccess({
      success: true,
      message: result.responseText,
      suggestedPlan: result.suggestedPlan,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

