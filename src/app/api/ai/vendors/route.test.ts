import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { GeminiAIPlannerService } from "@/infrastructure/ai/GeminiAIPlannerService";
import { globalApiRateLimiter } from "@/infrastructure/security/RateLimiter";
import { VendorItem } from "@/types/event";

vi.mock("@/infrastructure/ai/GeminiAIPlannerService");

describe("/api/ai/vendors route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalApiRateLimiter.reset();
  });

  const validPayload = {
    name: "Wedding",
    type: "wedding",
    totalBudget: 1000000,
    expectedGuests: 150,
    currency: "INR",
  };

  it("returns 200 and vendors on valid request", async () => {
    const mockVendors: VendorItem[] = [
      { id: "v1", name: "Venue Pro", category: "venue", status: "not_contacted", estimatedCost: 500000 },
    ];

    vi.mocked(GeminiAIPlannerService.prototype.generateVendors).mockResolvedValue(
      mockVendors
    );

    const req = new Request("http://localhost/api/ai/vendors", {
      method: "POST",
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.vendors.length).toBe(1);
  });

  it("returns 400 on invalid payload", async () => {
    const req = new Request("http://localhost/api/ai/vendors", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("handles Gemini errors", async () => {
    vi.mocked(GeminiAIPlannerService.prototype.generateVendors).mockRejectedValue(
      new Error("Vendor generation failed")
    );

    const req = new Request("http://localhost/api/ai/vendors", {
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

    const req = new Request("http://localhost/api/ai/vendors", {
      method: "POST",
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });
});
