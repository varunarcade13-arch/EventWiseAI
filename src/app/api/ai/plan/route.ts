import { apiSuccess, checkRateLimit, handleApiError } from "@/app/api/apiHelper";
import { GeminiAIPlannerService } from "@/infrastructure/ai/GeminiAIPlannerService";
import { Sanitizer } from "@/infrastructure/security/Sanitizer";
import { CurrencyCode, EventType } from "@/types/event";
import { NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  eventName: z.string().min(1).max(200),
  eventType: z.enum(["wedding", "birthday", "community", "other"]),
  eventDate: z.string().min(1),
  location: z.string().min(1).max(200),
  expectedGuests: z.number().int().positive().max(1000000),
  totalBudget: z.number().nonnegative().max(10000000000),
  currency: z.enum(["INR", "USD", "EUR", "GBP"]),
  specialRequirements: z.string().max(2000).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const rawBody = await request.json();
    const parseResult = RequestSchema.safeParse({
      eventName: Sanitizer.sanitizeString(rawBody.eventName, 200),
      eventType: rawBody.eventType,
      eventDate: Sanitizer.sanitizeString(rawBody.eventDate, 50),
      location: Sanitizer.sanitizeString(rawBody.location, 200),
      expectedGuests: Number(rawBody.expectedGuests),
      totalBudget: Number(rawBody.totalBudget),
      currency: rawBody.currency,
      specialRequirements: rawBody.specialRequirements
        ? Sanitizer.sanitizeString(rawBody.specialRequirements, 2000)
        : undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: parseResult.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    const planner = new GeminiAIPlannerService();
    const plan = await planner.generateEventPlan({
      eventName: parseResult.data.eventName,
      eventType: parseResult.data.eventType as EventType,
      eventDate: parseResult.data.eventDate,
      location: parseResult.data.location,
      expectedGuests: parseResult.data.expectedGuests,
      totalBudget: parseResult.data.totalBudget,
      currency: parseResult.data.currency as CurrencyCode,
      specialRequirements: parseResult.data.specialRequirements,
    });

    return apiSuccess({ success: true, plan });
  } catch (error) {
    return handleApiError(error);
  }
}
