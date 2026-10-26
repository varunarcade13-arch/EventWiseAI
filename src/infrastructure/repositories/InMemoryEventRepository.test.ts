import { describe, expect, it } from "vitest";
import { InMemoryEventRepository } from "./InMemoryEventRepository";
import { EventModel } from "@/types/event";

describe("InMemoryEventRepository", () => {
  const testEvent: EventModel = {
    id: "e1",
    name: "Test Event",
    type: "wedding",
    date: "2026-10-10",
    location: "Hall",
    expectedGuests: 50,
    currency: "INR",
    totalBudget: 100000,
    budgetCategories: [],
    timeline: [],
    vendors: [],
    recommendations: [],
    risks: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };

  it("handles getAll, getById, save, delete, and resetToDemo", async () => {
    const repo = new InMemoryEventRepository([testEvent]);

    const all = await repo.getAll();
    expect(all.length).toBe(1);

    const found = await repo.getById("e1");
    expect(found?.name).toBe("Test Event");

    const notFound = await repo.getById("missing");
    expect(notFound).toBeNull();

    // Update
    const updated = await repo.save({ ...testEvent, name: "Renamed Event" });
    expect(updated.name).toBe("Renamed Event");

    // Insert new
    await repo.save({ ...testEvent, id: "e2", name: "Second Event" });
    expect((await repo.getAll()).length).toBe(2);

    // Delete
    const deleted = await repo.delete("e2");
    expect(deleted).toBe(true);
    const deletedFalse = await repo.delete("non_existent");
    expect(deletedFalse).toBe(false);

    // Reset to demo
    const reset = await repo.resetToDemo();
    expect(reset.length).toBeGreaterThan(0);
  });
});
