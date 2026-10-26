import { checkRateLimit, handleApiError } from "@/app/api/apiHelper";
import { GeminiAIPlannerService } from "@/infrastructure/ai/GeminiAIPlannerService";
import { Sanitizer } from "@/infrastructure/security/Sanitizer";
import { EventType } from "@/types/event";
import { NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["wedding", "birthday", "community", "other"]),
  date: z.string().min(1),
  expectedGuests: z.number().int().positive(),
});

export async function POST(request: Request) {
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const rawBody = await request.json();
    const parseResult = RequestSchema.safeParse({
      name: Sanitizer.sanitizeString(rawBody.name, 200),
      type: rawBody.type,
      date: Sanitizer.sanitizeString(rawBody.date, 50),
      expectedGuests: Number(rawBody.expectedGuests),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data for timeline generation",
          details: parseResult.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    const planner = new GeminiAIPlannerService();
    const tasks = await planner.generateTimeline({
      name: parseResult.data.name,
      type: parseResult.data.type as EventType,
      date: parseResult.data.date,
      expectedGuests: parseResult.data.expectedGuests,
    });

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    return handleApiError(error);
  }
}
