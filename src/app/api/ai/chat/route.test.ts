import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { GeminiAIPlannerService } from "@/infrastructure/ai/GeminiAIPlannerService";
import { globalApiRateLimiter } from "@/infrastructure/security/RateLimiter";

vi.mock("@/infrastructure/ai/GeminiAIPlannerService");

describe("/api/ai/chat route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalApiRateLimiter.reset();
  });

  const validPayload = {
    messages: [{ role: "user", content: "How to budget for 150 guests?" }],
    context: {
      name: "Wedding",
      type: "wedding",
      totalBudget: 1500000,
      currency: "INR",
    },
  };

  it("returns 200 and AI response on valid request", async () => {
    vi.mocked(GeminiAIPlannerService.prototype.chat).mockResolvedValue({
      responseText: "Here is your budget allocation breakdown...",
      suggestedPlan: undefined,
    });

    const req = new Request("http://localhost/api/ai/chat", {
      method: "POST",
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toContain("budget allocation");
  });

  it("handles request with context including location and without context", async () => {
    vi.mocked(GeminiAIPlannerService.prototype.chat).mockResolvedValue({
      responseText: "General suggestions",
      suggestedPlan: undefined,
    });

    const reqWithLocation = new Request("http://localhost/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Venue ideas?" }],
        context: { name: "Reception", location: "Downtown Hall" },
      }),
    });
    const res1 = await POST(reqWithLocation);
    expect(res1.status).toBe(200);

    const reqLocationOnly = new Request("http://localhost/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Venue ideas?" }],
        context: { location: "Downtown Hall" },
      }),
    });
    const resLocationOnly = await POST(reqLocationOnly);
    expect(resLocationOnly.status).toBe(200);

    const reqNoContext = new Request("http://localhost/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "General question" }],
      }),
    });
    const res2 = await POST(reqNoContext);
    expect(res2.status).toBe(200);
  });

  it("returns 400 on empty or invalid messages", async () => {
    const req = new Request("http://localhost/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const reqNonArray = new Request("http://localhost/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ messages: "not-an-array" }),
    });
    const resNonArray = await POST(reqNonArray);
    expect(resNonArray.status).toBe(400);
  });

  it("handles Gemini errors", async () => {
    vi.mocked(GeminiAIPlannerService.prototype.chat).mockRejectedValue(
      new Error("Chat service unavailable")
    );

    const req = new Request("http://localhost/api/ai/chat", {
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

    const req = new Request("http://localhost/api/ai/chat", {
      method: "POST",
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });
});
