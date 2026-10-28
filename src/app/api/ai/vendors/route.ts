import { apiSuccess, checkRateLimit, handleApiError } from "@/app/api/apiHelper";
import { GeminiAIPlannerService } from "@/infrastructure/ai/GeminiAIPlannerService";
import { Sanitizer } from "@/infrastructure/security/Sanitizer";
import { CurrencyCode, EventType } from "@/types/event";
import { NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["wedding", "birthday", "community", "other"]),
  totalBudget: z.number().nonnegative().max(10000000000),
  expectedGuests: z.number().int().positive().max(1000000),
  currency: z.enum(["INR", "USD", "EUR", "GBP"]),
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
      totalBudget: Number(rawBody.totalBudget),
      expectedGuests: Number(rawBody.expectedGuests),
      currency: rawBody.currency,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data for vendor generation",
          details: parseResult.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    const planner = new GeminiAIPlannerService();
    const vendors = await planner.generateVendors({
      name: parseResult.data.name,
      type: parseResult.data.type as EventType,
      totalBudget: parseResult.data.totalBudget,
      expectedGuests: parseResult.data.expectedGuests,
      currency: parseResult.data.currency as CurrencyCode,
    });

    return apiSuccess({ success: true, vendors });
  } catch (error) {
    return handleApiError(error);
  }
}
