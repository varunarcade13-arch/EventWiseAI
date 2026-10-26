import { describe, expect, it } from "vitest";
import { AnalyzeBudgetUseCase } from "./AnalyzeBudgetUseCase";
import { MockAIPlannerService } from "@/infrastructure/ai/MockAIPlannerService";
import { InMemoryEventRepository } from "@/infrastructure/repositories/InMemoryEventRepository";
import { EventModel } from "@/types/event";

describe("AnalyzeBudgetUseCase", () => {
  const sampleEvent: EventModel = {
    id: "evt_1",
    name: "Wedding",
    type: "wedding",
    date: "2027-01-01",
    location: "Hall",
    expectedGuests: 150,
    currency: "INR",
    totalBudget: 1000000,
    budgetCategories: [
      { id: "c1", name: "Venue", allocated: 400000, actual: 390000 },
    ],
    timeline: [],
    vendors: [],
    recommendations: [],
    risks: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };

  it("analyzes budget successfully for existing event", async () => {
    const ai = new MockAIPlannerService();
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new AnalyzeBudgetUseCase(ai, repo);

    const analysis = await useCase.execute("evt_1");
    expect(analysis.healthScore).toBeDefined();
    expect(analysis.potentialSavings.length).toBeGreaterThan(0);
  });

  it("throws error when event is not found", async () => {
    const ai = new MockAIPlannerService();
    const repo = new InMemoryEventRepository([]);
    const useCase = new AnalyzeBudgetUseCase(ai, repo);

    await expect(useCase.execute("missing_id")).rejects.toThrow(
      'Event with ID "missing_id" not found.'
    );
  });
});
