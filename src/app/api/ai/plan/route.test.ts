import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { GeminiAIPlannerService } from "@/infrastructure/ai/GeminiAIPlannerService";
import { globalApiRateLimiter } from "@/infrastructure/security/RateLimiter";
import { EventPlan } from "@/types/ai";

vi.mock("@/infrastructure/ai/GeminiAIPlannerService");

describe("/api/ai/plan route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalApiRateLimiter.reset();
  });

  const validPayload = {
    eventName: "Grand Wedding",
    eventType: "wedding",
    eventDate: "2027-02-15",
    location: "Bangalore",
    expectedGuests: 200,
    totalBudget: 1500000,
    currency: "INR",
    specialRequirements: "Vegetarian only",
  };

  it("returns 200 and plan on valid request", async () => {
    const mockPlan: EventPlan = {
      summary: "Sample plan",
      estimatedBudget: [],
      timeline: [],
      vendors: [],
      recommendations: [],
      risks: [],
    };

    vi.mocked(GeminiAIPlannerService.prototype.generateEventPlan).mockResolvedValue(
      mockPlan
    );

    const req = new Request("http://localhost/api/ai/plan", {
      method: "POST",
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.plan.summary).toBe("Sample plan");
  });

  it("returns 400 on invalid payload", async () => {
    const req = new Request("http://localhost/api/ai/plan", {
      method: "POST",
      body: JSON.stringify({ eventName: "" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid request data");
  });

  it("handles Gemini failure with 500 error", async () => {
    vi.mocked(GeminiAIPlannerService.prototype.generateEventPlan).mockRejectedValue(
      new Error("Gemini quota exceeded")
    );

    const req = new Request("http://localhost/api/ai/plan", {
      method: "POST",
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Gemini quota exceeded");
  });

  it("blocks requests when rate limit is exceeded", async () => {
    // Fill quota
    for (let i = 0; i < 30; i++) {
      globalApiRateLimiter.check("client-default");
    }

    const req = new Request("http://localhost/api/ai/plan", {
      method: "POST",
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });
});
