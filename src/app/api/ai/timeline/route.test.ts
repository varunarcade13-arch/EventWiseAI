import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { GeminiAIPlannerService } from "@/infrastructure/ai/GeminiAIPlannerService";
import { globalApiRateLimiter } from "@/infrastructure/security/RateLimiter";
import { TimelineTask } from "@/types/event";

vi.mock("@/infrastructure/ai/GeminiAIPlannerService");

describe("/api/ai/timeline route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalApiRateLimiter.reset();
  });

  const validPayload = {
    name: "Wedding",
    type: "wedding",
    date: "2027-02-15",
    expectedGuests: 150,
  };

  it("returns 200 and tasks on valid request", async () => {
    const mockTasks: TimelineTask[] = [
      { id: "t1", title: "Task 1", dueDate: "2027-02-15", status: "not_started", priority: "medium" },
    ];

    vi.mocked(GeminiAIPlannerService.prototype.generateTimeline).mockResolvedValue(
      mockTasks
    );

    const req = new Request("http://localhost/api/ai/timeline", {
      method: "POST",
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.tasks.length).toBe(1);
  });

  it("returns 400 on invalid payload", async () => {
    const req = new Request("http://localhost/api/ai/timeline", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("handles Gemini errors", async () => {
    vi.mocked(GeminiAIPlannerService.prototype.generateTimeline).mockRejectedValue(
      new Error("Fail")
    );

    const req = new Request("http://localhost/api/ai/timeline", {
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

    const req = new Request("http://localhost/api/ai/timeline", {
      method: "POST",
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });
});
