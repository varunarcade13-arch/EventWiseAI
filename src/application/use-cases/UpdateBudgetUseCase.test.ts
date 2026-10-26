import { describe, expect, it } from "vitest";
import { UpdateBudgetUseCase } from "./UpdateBudgetUseCase";
import { InMemoryEventRepository } from "@/infrastructure/repositories/InMemoryEventRepository";
import { EventModel } from "@/types/event";

describe("UpdateBudgetUseCase", () => {
  const sampleEvent: EventModel = {
    id: "evt_1",
    name: "Birthday Party",
    type: "birthday",
    date: "2026-10-10",
    location: "Home",
    expectedGuests: 30,
    currency: "USD",
    totalBudget: 2000,
    budgetCategories: [
      { id: "cat_1", name: "Cake", allocated: 200, actual: 180, notes: "Chocolate" },
    ],
    timeline: [],
    vendors: [],
    recommendations: [],
    risks: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };

  it("adds a new budget category successfully", async () => {
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new UpdateBudgetUseCase(repo);

    const updated = await useCase.addCategory({
      eventId: "evt_1",
      category: { name: "Decor", allocated: 300, actual: 0, notes: "Balloons" },
    });

    expect(updated.budgetCategories.length).toBe(2);
    expect(updated.budgetCategories[1]?.name).toBe("Decor");
    expect(updated.budgetCategories[1]?.allocated).toBe(300);

    // Add category with 0 allocated, 0 actual, undefined notes
    const withZeros = await useCase.addCategory({
      eventId: "evt_1",
      category: { name: "Tips", allocated: 0, actual: 0 },
    });
    const tipsCat = withZeros.budgetCategories.find((c) => c.name === "Tips");
    expect(tipsCat?.allocated).toBe(0);
    expect(tipsCat?.notes).toBe("");
  });

  it("throws error if event not found when adding category", async () => {
    const repo = new InMemoryEventRepository([]);
    const useCase = new UpdateBudgetUseCase(repo);

    await expect(
      useCase.addCategory({
        eventId: "non_existent",
        category: { name: "Decor", allocated: 100, actual: 0 },
      })
    ).rejects.toThrow('Event with ID "non_existent" not found.');
  });

  it("throws error when adding category without a name", async () => {
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new UpdateBudgetUseCase(repo);

    await expect(
      useCase.addCategory({
        eventId: "evt_1",
        category: { name: "   ", allocated: 100, actual: 0 },
      })
    ).rejects.toThrow("Category name is required.");
  });

  it("updates an existing category successfully", async () => {
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new UpdateBudgetUseCase(repo);

    const updated = await useCase.updateCategory({
      eventId: "evt_1",
      categoryId: "cat_1",
      allocated: 250,
      actual: 220,
      notes: "Custom design cake",
      name: "Custom Cake",
    });

    const cat = updated.budgetCategories.find((c) => c.id === "cat_1");
    expect(cat?.name).toBe("Custom Cake");
    expect(cat?.allocated).toBe(250);
    expect(cat?.actual).toBe(220);
    expect(cat?.notes).toBe("Custom design cake");

    // Partial update with empty object keeps existing values
    const partialUpdated = await useCase.updateCategory({
      eventId: "evt_1",
      categoryId: "cat_1",
    });
    const unchangedCat = partialUpdated.budgetCategories.find((c) => c.id === "cat_1");
    expect(unchangedCat?.name).toBe("Custom Cake");
    expect(unchangedCat?.allocated).toBe(250);

    // Negative/invalid numbers become 0
    const clampedUpdated = await useCase.updateCategory({
      eventId: "evt_1",
      categoryId: "cat_1",
      allocated: Number.NaN,
      actual: ("invalid" as unknown as number),
    });
    const clampedCat = clampedUpdated.budgetCategories.find((c) => c.id === "cat_1");
    expect(clampedCat?.allocated).toBe(0);
    expect(clampedCat?.actual).toBe(0);

    const zeroUpdated = await useCase.updateCategory({
      eventId: "evt_1",
      categoryId: "cat_1",
      allocated: 0,
      actual: 0,
    });
    const zeroCat = zeroUpdated.budgetCategories.find((c) => c.id === "cat_1");
    expect(zeroCat?.allocated).toBe(0);
    expect(zeroCat?.actual).toBe(0);
  });

  it("throws error when updating non-existent event or category", async () => {
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new UpdateBudgetUseCase(repo);

    await expect(
      useCase.updateCategory({ eventId: "missing", categoryId: "cat_1" })
    ).rejects.toThrow('Event with ID "missing" not found.');

    await expect(
      useCase.updateCategory({ eventId: "evt_1", categoryId: "missing_cat" })
    ).rejects.toThrow('Budget category "missing_cat" not found.');
  });

  it("deletes a budget category successfully", async () => {
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new UpdateBudgetUseCase(repo);

    const updated = await useCase.deleteCategory({
      eventId: "evt_1",
      categoryId: "cat_1",
    });

    expect(updated.budgetCategories.length).toBe(0);
  });

  it("throws error when deleting category from non-existent event", async () => {
    const repo = new InMemoryEventRepository([]);
    const useCase = new UpdateBudgetUseCase(repo);

    await expect(
      useCase.deleteCategory({ eventId: "missing", categoryId: "cat_1" })
    ).rejects.toThrow('Event with ID "missing" not found.');
  });
});
