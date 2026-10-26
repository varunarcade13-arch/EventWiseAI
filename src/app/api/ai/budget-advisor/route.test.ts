import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { GeminiAIPlannerService } from "@/infrastructure/ai/GeminiAIPlannerService";
import { globalApiRateLimiter } from "@/infrastructure/security/RateLimiter";
import { BudgetAnalysis } from "@/types/ai";

vi.mock("@/infrastructure/ai/GeminiAIPlannerService");

describe("/api/ai/budget-advisor route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalApiRateLimiter.reset();
  });

  const validPayload = {
    name: "Wedding",
    type: "wedding",
    totalBudget: 1000000,
    currency: "INR",
    expectedGuests: 150,
    budgetCategories: [
      { id: "c1", name: "Venue", allocated: 500000, actual: 480000, notes: "Booked" },
    ],
  };

  it("returns 200 and analysis on valid request", async () => {
    const mockAnalysis: BudgetAnalysis = {
      summary: "Budget ok",
      healthScore: 85,
      overspendingRisk: false,
      underallocatedCategories: [],
      potentialSavings: [],
      redistributionSuggestions: [],
    };

    vi.mocked(GeminiAIPlannerService.prototype.analyzeBudget).mockResolvedValue(
      mockAnalysis
    );

    const req = new Request("http://localhost/api/ai/budget-advisor", {
      method: "POST",
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.analysis.healthScore).toBe(85);

    // Test with category without id, without notes, and default actual
    const reqSparse = new Request("http://localhost/api/ai/budget-advisor", {
      method: "POST",
      body: JSON.stringify({
        ...validPayload,
        budgetCategories: [
          { name: "Music", allocated: 10000 },
          { name: "Decor", allocated: 0, actual: 0 },
        ],
      }),
    });
    const resSparse = await POST(reqSparse);
    expect(resSparse.status).toBe(200);

    // Test with non-array budgetCategories
    const reqNonArray = new Request("http://localhost/api/ai/budget-advisor", {
      method: "POST",
      body: JSON.stringify({
        ...validPayload,
        budgetCategories: null,
      }),
    });
    const resNonArray = await POST(reqNonArray);
    expect(resNonArray.status).toBe(200);
  });

  it("returns 400 on invalid payload", async () => {
    const req = new Request("http://localhost/api/ai/budget-advisor", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("handles AI service error with 500", async () => {
    vi.mocked(GeminiAIPlannerService.prototype.analyzeBudget).mockRejectedValue(
      new Error("API timeout")
    );

    const req = new Request("http://localhost/api/ai/budget-advisor", {
      method: "POST",
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it("blocks requests when rate limit is exceeded", async () => {
    for (let i = 0; i < 30; i++) {
      globalApiRateLimiter.check("client-default");
    }

    const req = new Request("http://localhost/api/ai/budget-advisor", {
      method: "POST",
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });
});
