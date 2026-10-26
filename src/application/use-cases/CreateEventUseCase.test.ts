import { describe, expect, it, vi } from "vitest";
import { CreateEventUseCase } from "./CreateEventUseCase";
import { InMemoryEventRepository } from "@/infrastructure/repositories/InMemoryEventRepository";

describe("CreateEventUseCase", () => {
  it("creates and persists a valid event successfully", async () => {
    const repo = new InMemoryEventRepository([]);
    const useCase = new CreateEventUseCase(repo);

    const event = await useCase.execute({
      name: "Diwali Community Night",
      type: "community",
      date: "2026-11-10",
      location: "Townhall Square, Delhi",
      expectedGuests: 450,
      totalBudget: 600000,
      currency: "INR",
    });

    expect(event.id).toBeDefined();
    expect(event.name).toBe("Diwali Community Night");
    expect(event.expectedGuests).toBe(450);
    expect(event.totalBudget).toBe(600000);
    expect(event.isDemo).toBe(false);

    const stored = await repo.getById(event.id);
    expect(stored?.name).toBe("Diwali Community Night");
  });

  it("throws validation error on invalid input", async () => {
    const repo = new InMemoryEventRepository([]);
    const useCase = new CreateEventUseCase(repo);

    await expect(
      useCase.execute({
        name: "",
        type: "wedding",
        date: "2026-12-01",
        location: "Hall",
        expectedGuests: 100,
        totalBudget: 1000,
        currency: "INR",
      })
    ).rejects.toThrow("Event name is required.");
  });

  it("handles fallback message if validator errors map has no entries", async () => {
    const { EventValidator } = await import("@/domain/services/EventValidator");
    const spy = vi.spyOn(EventValidator, "validate").mockReturnValueOnce({
      isValid: false,
      errors: {},
    });
    const repo = new InMemoryEventRepository([]);
    const useCase = new CreateEventUseCase(repo);

    await expect(
      useCase.execute({
        name: "Test",
        type: "wedding",
        date: "2026-12-01",
        location: "Hall",
        expectedGuests: 100,
        totalBudget: 1000,
        currency: "INR",
      })
    ).rejects.toThrow("Validation failed");

    spy.mockRestore();
  });
});
