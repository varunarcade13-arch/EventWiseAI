import { describe, expect, it } from "vitest";
import { AssessRisksUseCase } from "./AssessRisksUseCase";
import { MockAIPlannerService } from "@/infrastructure/ai/MockAIPlannerService";
import { InMemoryEventRepository } from "@/infrastructure/repositories/InMemoryEventRepository";
import { EventModel } from "@/types/event";

describe("AssessRisksUseCase", () => {
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

  it("assesses risks without saving to event", async () => {
    const ai = new MockAIPlannerService();
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new AssessRisksUseCase(ai, repo);

    const result = await useCase.execute("evt_1", false);
    expect(result.risks.length).toBeGreaterThan(0);

    const unchanged = await repo.getById("evt_1");
    expect(unchanged?.risks.length).toBe(0);
  });

  it("assesses and applies risks when applyToEvent is true", async () => {
    const ai = new MockAIPlannerService();
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new AssessRisksUseCase(ai, repo);

    const result = await useCase.execute("evt_1", true);
    expect(result.risks.length).toBeGreaterThan(0);

    const updated = await repo.getById("evt_1");
    expect(updated?.risks.length).toBe(result.risks.length);
  });

  it("throws error when event is not found", async () => {
    const ai = new MockAIPlannerService();
    const repo = new InMemoryEventRepository([]);
    const useCase = new AssessRisksUseCase(ai, repo);

    await expect(useCase.execute("missing")).rejects.toThrow(
      'Event with ID "missing" not found.'
    );
  });
});
