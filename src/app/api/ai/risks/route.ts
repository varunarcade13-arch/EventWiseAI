import { apiSuccess, checkRateLimit, handleApiError } from "@/app/api/apiHelper";
import { GeminiAIPlannerService } from "@/infrastructure/ai/GeminiAIPlannerService";
import { Sanitizer } from "@/infrastructure/security/Sanitizer";
import { EventType } from "@/types/event";
import { NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["wedding", "birthday", "community", "other"]),
  date: z.string().min(1).max(50),
  location: z.string().min(1).max(200),
  expectedGuests: z.number().int().positive().max(1000000),
  totalBudget: z.number().nonnegative().max(10000000000),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const rawBody = await request.json();
    const parseResult = RequestSchema.safeParse({
      name: Sanitizer.sanitizeString(rawBody.name, 200),
      type: rawBody.type,
      date: Sanitizer.sanitizeString(rawBody.date, 50),
      location: Sanitizer.sanitizeString(rawBody.location, 200),
      expectedGuests: Number(rawBody.expectedGuests),
      totalBudget: Number(rawBody.totalBudget),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data for risk assessment",
          details: parseResult.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    const planner = new GeminiAIPlannerService();
    const risks = await planner.assessRisks({
      name: parseResult.data.name,
      type: parseResult.data.type as EventType,
      date: parseResult.data.date,
      location: parseResult.data.location,
      expectedGuests: parseResult.data.expectedGuests,
      totalBudget: parseResult.data.totalBudget,
    });

    return apiSuccess({ success: true, risks });
  } catch (error) {
    return handleApiError(error);
  }
}
