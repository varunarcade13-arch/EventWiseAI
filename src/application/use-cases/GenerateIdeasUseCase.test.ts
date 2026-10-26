import { describe, expect, it } from "vitest";
import { GenerateIdeasUseCase } from "./GenerateIdeasUseCase";
import { MockAIPlannerService } from "@/infrastructure/ai/MockAIPlannerService";
import { InMemoryEventRepository } from "@/infrastructure/repositories/InMemoryEventRepository";
import { EventModel } from "@/types/event";

describe("GenerateIdeasUseCase", () => {
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

  it("generates creative ideas successfully", async () => {
    const ai = new MockAIPlannerService();
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new GenerateIdeasUseCase(ai, repo);

    const ideas = await useCase.execute("evt_1");
    expect(ideas.themes.length).toBeGreaterThan(0);
    expect(ideas.activities.length).toBeGreaterThan(0);
  });

  it("throws error when event is not found", async () => {
    const ai = new MockAIPlannerService();
    const repo = new InMemoryEventRepository([]);
    const useCase = new GenerateIdeasUseCase(ai, repo);

    await expect(useCase.execute("missing")).rejects.toThrow(
      'Event with ID "missing" not found.'
    );
  });
});
