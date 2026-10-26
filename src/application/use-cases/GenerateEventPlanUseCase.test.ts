import { describe, expect, it } from "vitest";
import { GenerateEventPlanUseCase } from "./GenerateEventPlanUseCase";
import { MockAIPlannerService } from "@/infrastructure/ai/MockAIPlannerService";
import { InMemoryEventRepository } from "@/infrastructure/repositories/InMemoryEventRepository";
import { EventModel } from "@/types/event";

describe("GenerateEventPlanUseCase", () => {
  const sampleEvent: EventModel = {
    id: "evt_1",
    name: "Wedding",
    type: "wedding",
    date: "2027-02-15",
    location: "Palace",
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

  it("generates plan without applying to repository", async () => {
    const ai = new MockAIPlannerService();
    const useCase = new GenerateEventPlanUseCase(ai);

    const { plan, updatedEvent } = await useCase.execute({
      eventName: "Wedding",
      eventType: "wedding",
      eventDate: "2027-02-15",
      location: "Palace",
      expectedGuests: 150,
      totalBudget: 1000000,
      currency: "INR",
    });

    expect(plan.estimatedBudget.length).toBeGreaterThan(0);
    expect(updatedEvent).toBeUndefined();
  });

  it("generates and applies plan to an existing event in repository", async () => {
    const ai = new MockAIPlannerService();
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new GenerateEventPlanUseCase(ai, repo);

    const { plan, updatedEvent } = await useCase.execute(
      {
        eventName: "Wedding",
        eventType: "wedding",
        eventDate: "2027-02-15",
        location: "Palace",
        expectedGuests: 150,
        totalBudget: 1000000,
        currency: "INR",
      },
      "evt_1"
    );

    expect(plan).toBeDefined();
    expect(updatedEvent).toBeDefined();
    expect(updatedEvent?.budgetCategories.length).toBe(plan.estimatedBudget.length);
    expect(updatedEvent?.timeline.length).toBe(plan.timeline.length);
    expect(updatedEvent?.vendors.length).toBe(plan.vendors.length);
    expect(updatedEvent?.recommendations.length).toBe(plan.recommendations.length);
    expect(updatedEvent?.risks.length).toBe(plan.risks.length);
  });

  it("handles non-existent eventId gracefully when applying", async () => {
    const ai = new MockAIPlannerService();
    const repo = new InMemoryEventRepository([]);
    const useCase = new GenerateEventPlanUseCase(ai, repo);

    const { plan, updatedEvent } = await useCase.execute(
      {
        eventName: "Wedding",
        eventType: "wedding",
        eventDate: "2027-02-15",
        location: "Palace",
        expectedGuests: 150,
        totalBudget: 1000000,
        currency: "INR",
      },
      "non_existent"
    );

    expect(plan).toBeDefined();
    expect(updatedEvent).toBeUndefined();
  });

  it("applies plan with items having undefined optional properties and verifies fallback values", async () => {
    const ai = new MockAIPlannerService();
    ai.customPlan = ({
      summary: "Sparse plan",
      estimatedBudget: [
        { name: "Venue", allocated: 50000 },
      ],
      timeline: [
        { title: "Task 1", dueDate: "2027-01-01" },
      ],
      vendors: [
        { name: "Vendor 1", category: "venue", estimatedCost: 50000 },
      ],
      recommendations: [
        { category: "Venue", title: "Tip", description: "Desc" },
      ],
      risks: [
        { risk: "Weather", impact: "high", mitigation: "Cover" },
      ],
    } as unknown) as import("@/types/ai").EventPlan;
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new GenerateEventPlanUseCase(ai, repo);

    const { updatedEvent } = await useCase.execute(
      {
        eventName: "Wedding",
        eventType: "wedding",
        eventDate: "2027-02-15",
        location: "Palace",
        expectedGuests: 150,
        totalBudget: 1000000,
        currency: "INR",
      },
      "evt_1"
    );

    expect(updatedEvent?.budgetCategories[0]?.actual).toBe(0);
    expect(updatedEvent?.timeline[0]?.status).toBe("not_started");
    expect(updatedEvent?.timeline[0]?.priority).toBe("medium");
    expect(updatedEvent?.timeline[0]?.category).toBe("General");
    expect(updatedEvent?.timeline[0]?.assignedTo).toBe("");
    expect(updatedEvent?.vendors[0]?.status).toBe("not_contacted");
    expect(updatedEvent?.vendors[0]?.contactPerson).toBe("");
    expect(updatedEvent?.vendors[0]?.phone).toBe("");
    expect(updatedEvent?.vendors[0]?.email).toBe("");
    expect(updatedEvent?.vendors[0]?.notes).toBe("");
  });
});
