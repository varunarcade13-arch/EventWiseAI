import { describe, expect, it, vi } from "vitest";
import { GenerateTimelineUseCase } from "./GenerateTimelineUseCase";
import { MockAIPlannerService } from "@/infrastructure/ai/MockAIPlannerService";
import { InMemoryEventRepository } from "@/infrastructure/repositories/InMemoryEventRepository";
import { EventModel } from "@/types/event";

describe("GenerateTimelineUseCase", () => {
  const sampleEvent: EventModel = {
    id: "evt_1",
    name: "Wedding",
    type: "wedding",
    date: "2027-01-01",
    location: "Hall",
    expectedGuests: 150,
    currency: "INR",
    totalBudget: 1000000,
    budgetCategories: [],
    timeline: [],
    vendors: [],
    recommendations: [],
    risks: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };

  it("generates timeline tasks without applying to event", async () => {
    const ai = new MockAIPlannerService();
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new GenerateTimelineUseCase(ai, repo);

    const tasks = await useCase.execute("evt_1", false);
    expect(tasks.length).toBeGreaterThan(0);

    const unchanged = await repo.getById("evt_1");
    expect(unchanged?.timeline.length).toBe(0);
  });

  it("generates and saves timeline tasks when applyToEvent is true", async () => {
    const ai = new MockAIPlannerService();
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new GenerateTimelineUseCase(ai, repo);

    const tasks = await useCase.execute("evt_1", true);
    expect(tasks.length).toBeGreaterThan(0);

    const updated = await repo.getById("evt_1");
    expect(updated?.timeline.length).toBe(tasks.length);
  });

  it("throws error when event is not found", async () => {
    const ai = new MockAIPlannerService();
    const repo = new InMemoryEventRepository([]);
    const useCase = new GenerateTimelineUseCase(ai, repo);

    await expect(useCase.execute("missing")).rejects.toThrow(
      'Event with ID "missing" not found.'
    );
  });

  it("handles tasks with missing optional fields and uses fallbacks", async () => {
    const ai = new MockAIPlannerService();
    vi.spyOn(ai, "generateTimeline").mockResolvedValueOnce([
      { title: "Raw task", dueDate: "2027-01-01" },
    ] as unknown as import("@/types/event").TimelineTask[]);
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new GenerateTimelineUseCase(ai, repo);

    const tasks = await useCase.execute("evt_1");
    expect(tasks[0]?.status).toBe("not_started");
    expect(tasks[0]?.priority).toBe("medium");
    expect(tasks[0]?.category).toBe("General");
    expect(tasks[0]?.assignedTo).toBe("");
  });
});
