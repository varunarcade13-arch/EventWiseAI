import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { GeminiAIPlannerService } from "@/infrastructure/ai/GeminiAIPlannerService";
import { globalApiRateLimiter } from "@/infrastructure/security/RateLimiter";
import { RiskAnalysis } from "@/types/ai";

vi.mock("@/infrastructure/ai/GeminiAIPlannerService");

describe("/api/ai/risks route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalApiRateLimiter.reset();
  });

  const validPayload = {
    name: "Wedding",
    type: "wedding",
    date: "2027-02-15",
    location: "Lawn",
    expectedGuests: 200,
    totalBudget: 1500000,
  };

  it("returns 200 and risks on valid request", async () => {
    const mockRisks: RiskAnalysis = {
      summary: "Risks overview",
      risks: [{ risk: "Rain", impact: "high", mitigation: "Waterproof marquee" }],
    };

    vi.mocked(GeminiAIPlannerService.prototype.assessRisks).mockResolvedValue(
      mockRisks
    );

    const req = new Request("http://localhost/api/ai/risks", {
      method: "POST",
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.risks.risks.length).toBe(1);
  });

  it("returns 400 on invalid payload", async () => {
    const req = new Request("http://localhost/api/ai/risks", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("handles Gemini errors", async () => {
    vi.mocked(GeminiAIPlannerService.prototype.assessRisks).mockRejectedValue(
      new Error("Risk error")
    );

    const req = new Request("http://localhost/api/ai/risks", {
      method: "POST",
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it("enforces rate limiting", async () => {
    for (let i = 0; i < 30; i++) {
      globalApiRateLimiter.check("client-default");
    }

    const req = new Request("http://localhost/api/ai/risks", {
      method: "POST",
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });
});
