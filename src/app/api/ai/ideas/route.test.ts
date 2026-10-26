import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { GeminiAIPlannerService } from "@/infrastructure/ai/GeminiAIPlannerService";
import { globalApiRateLimiter } from "@/infrastructure/security/RateLimiter";
import { IdeasPlan } from "@/types/ai";

vi.mock("@/infrastructure/ai/GeminiAIPlannerService");

describe("/api/ai/ideas route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalApiRateLimiter.reset();
  });

  const validPayload = {
    name: "Birthday Party",
    type: "birthday",
    location: "City Park",
    expectedGuests: 50,
  };

  it("returns 200 and ideas on valid request", async () => {
    const mockIdeas: IdeasPlan = {
      summary: "Creative ideas",
      themes: ["Space Adventure"],
      activities: ["Rocket launch"],
      decorationIdeas: ["Stars and planets"],
      foodIdeas: ["Galaxy cupcakes"],
      entertainment: ["Science show"],
      guestExperiences: ["Astronaut badges"],
    };

    vi.mocked(GeminiAIPlannerService.prototype.generateIdeas).mockResolvedValue(
      mockIdeas
    );

    const req = new Request("http://localhost/api/ai/ideas", {
      method: "POST",
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.ideas.themes[0]).toBe("Space Adventure");
  });

  it("returns 400 on invalid payload", async () => {
    const req = new Request("http://localhost/api/ai/ideas", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("handles Gemini errors", async () => {
    vi.mocked(GeminiAIPlannerService.prototype.generateIdeas).mockRejectedValue(
      new Error("Gemini down")
    );

    const req = new Request("http://localhost/api/ai/ideas", {
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

    const req = new Request("http://localhost/api/ai/ideas", {
      method: "POST",
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });
});
