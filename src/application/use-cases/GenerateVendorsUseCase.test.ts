import { describe, expect, it, vi } from "vitest";
import { GenerateVendorsUseCase } from "./GenerateVendorsUseCase";
import { MockAIPlannerService } from "@/infrastructure/ai/MockAIPlannerService";
import { InMemoryEventRepository } from "@/infrastructure/repositories/InMemoryEventRepository";
import { EventModel } from "@/types/event";

describe("GenerateVendorsUseCase", () => {
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

  it("generates vendors without applying to event", async () => {
    const ai = new MockAIPlannerService();
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new GenerateVendorsUseCase(ai, repo);

    const vendors = await useCase.execute("evt_1", false);
    expect(vendors.length).toBeGreaterThan(0);

    const unchanged = await repo.getById("evt_1");
    expect(unchanged?.vendors.length).toBe(0);
  });

  it("generates and saves vendors when applyToEvent is true", async () => {
    const ai = new MockAIPlannerService();
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new GenerateVendorsUseCase(ai, repo);

    const vendors = await useCase.execute("evt_1", true);
    expect(vendors.length).toBeGreaterThan(0);

    const updated = await repo.getById("evt_1");
    expect(updated?.vendors.length).toBe(vendors.length);
  });

  it("throws error when event is not found", async () => {
    const ai = new MockAIPlannerService();
    const repo = new InMemoryEventRepository([]);
    const useCase = new GenerateVendorsUseCase(ai, repo);

    await expect(useCase.execute("missing")).rejects.toThrow(
      'Event with ID "missing" not found.'
    );
  });

  it("handles vendors with missing optional fields and uses fallbacks", async () => {
    const ai = new MockAIPlannerService();
    vi.spyOn(ai, "generateVendors").mockResolvedValueOnce([
      { name: "Raw vendor", category: "venue", estimatedCost: 1000 },
    ] as unknown as import("@/types/event").VendorItem[]);
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new GenerateVendorsUseCase(ai, repo);

    const vendors = await useCase.execute("evt_1");
    expect(vendors[0]?.status).toBe("not_contacted");
    expect(vendors[0]?.contactPerson).toBe("");
    expect(vendors[0]?.phone).toBe("");
    expect(vendors[0]?.email).toBe("");
    expect(vendors[0]?.notes).toBe("");
  });
});
