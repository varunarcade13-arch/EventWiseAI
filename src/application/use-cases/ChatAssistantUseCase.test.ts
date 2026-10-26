import { describe, expect, it } from "vitest";
import { ChatAssistantUseCase } from "./ChatAssistantUseCase";
import { MockAIPlannerService } from "@/infrastructure/ai/MockAIPlannerService";
import { InMemoryEventRepository } from "@/infrastructure/repositories/InMemoryEventRepository";
import { EventModel } from "@/types/event";

describe("ChatAssistantUseCase", () => {
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

  it("handles conversation without event context", async () => {
    const ai = new MockAIPlannerService();
    const useCase = new ChatAssistantUseCase(ai);

    const response = await useCase.execute({
      messages: [{ role: "user", content: "How to budget for 100 guests?" }],
    });

    expect(response.responseText).toContain("recommendations");
  });

  it("handles conversation with valid eventId and passes context", async () => {
    const ai = new MockAIPlannerService();
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new ChatAssistantUseCase(ai, repo);

    const response = await useCase.execute({
      messages: [{ role: "user", content: "Optimize my catering budget" }],
      eventId: "evt_1",
    });

    expect(response.responseText).toContain("for Wedding");
  });

  it("handles conversation with non-existent eventId gracefully", async () => {
    const ai = new MockAIPlannerService();
    const repo = new InMemoryEventRepository([]);
    const useCase = new ChatAssistantUseCase(ai, repo);

    const response = await useCase.execute({
      messages: [{ role: "user", content: "Hi" }],
      eventId: "missing",
    });

    expect(response.responseText).toBeDefined();
  });

  it("throws error when messages list is empty", async () => {
    const ai = new MockAIPlannerService();
    const useCase = new ChatAssistantUseCase(ai);

    await expect(useCase.execute({ messages: [] })).rejects.toThrow(
      "Chat messages cannot be empty."
    );
  });
});
