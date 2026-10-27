import { checkRateLimit, handleApiError } from "@/app/api/apiHelper";
import { GeminiAIPlannerService } from "@/infrastructure/ai/GeminiAIPlannerService";
import { Sanitizer } from "@/infrastructure/security/Sanitizer";
import { CurrencyCode, EventType } from "@/types/event";
import { NextResponse } from "next/server";
import { z } from "zod";

const CategoryInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  allocated: z.number().nonnegative(),
  actual: z.number().nonnegative().optional().default(0),
  notes: z.string().optional(),
});

const RequestSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["wedding", "birthday", "community", "other"]),
  totalBudget: z.number().nonnegative(),
  currency: z.enum(["INR", "USD", "EUR", "GBP"]),
  expectedGuests: z.number().int().positive().max(1000000),
  budgetCategories: z.array(CategoryInputSchema).max(100),
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
      currency: rawBody.currency,
      expectedGuests: Number(rawBody.expectedGuests),
      budgetCategories: Array.isArray(rawBody.budgetCategories)
        ? rawBody.budgetCategories.map((c: { name?: unknown; allocated?: unknown; actual?: unknown; notes?: unknown }) => ({
            name: Sanitizer.sanitizeString(c.name, 100),
            allocated: Math.max(0, Number(c.allocated) || 0),
            actual: Math.max(0, Number(c.actual) || 0),
            notes: c.notes ? Sanitizer.sanitizeString(c.notes, 500) : "",
          }))
        : [],
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid budget data for advisor",
          details: parseResult.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    const planner = new GeminiAIPlannerService();
    const categoriesWithIds = parseResult.data.budgetCategories.map(
      (c, idx) => ({
        ...c,
        id: c.id || `cat_adv_${idx}`,
      })
    );
    const analysis = await planner.analyzeBudget({
      name: parseResult.data.name,
      type: parseResult.data.type as EventType,
      totalBudget: parseResult.data.totalBudget,
      currency: parseResult.data.currency as CurrencyCode,
      expectedGuests: parseResult.data.expectedGuests,
      budgetCategories: categoriesWithIds,
    });

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    return handleApiError(error);
  }
}
