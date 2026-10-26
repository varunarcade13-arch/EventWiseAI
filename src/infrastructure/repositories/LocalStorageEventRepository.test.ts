import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocalStorageEventRepository } from "./LocalStorageEventRepository";
import { EventModel } from "@/types/event";

describe("LocalStorageEventRepository", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  const sampleEvent: EventModel = {
    id: "user_event_1",
    name: "Custom Party",
    type: "birthday",
    date: "2026-12-25",
    location: "My House",
    expectedGuests: 25,
    currency: "USD",
    totalBudget: 1500,
    budgetCategories: [],
    timeline: [],
    vendors: [],
    recommendations: [],
    risks: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };

  it("initializes with demo data when localStorage is initially empty", async () => {
    const repo = new LocalStorageEventRepository();
    const events = await repo.getAll();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]?.isDemo).toBe(true);
  });

  it("saves, retrieves, updates, and deletes an event", async () => {
    const repo = new LocalStorageEventRepository();

    // Save new event
    await repo.save(sampleEvent);
    const retrieved = await repo.getById("user_event_1");
    expect(retrieved?.name).toBe("Custom Party");

    // Update existing event
    await repo.save({ ...sampleEvent, name: "Updated Party Name" });
    const updated = await repo.getById("user_event_1");
    expect(updated?.name).toBe("Updated Party Name");

    // Delete event
    const deleted = await repo.delete("user_event_1");
    expect(deleted).toBe(true);
    expect(await repo.getById("user_event_1")).toBeNull();

    // Delete non-existent
    const deleteNonExistent = await repo.delete("non_existent_id");
    expect(deleteNonExistent).toBe(false);
  });

  it("handles corrupted non-array or invalid JSON in localStorage safely", async () => {
    window.localStorage.setItem("eventwise_ai_events_v1", "INVALID_JSON_CORRUPTED");
    const repo = new LocalStorageEventRepository();
    const events = await repo.getAll();
    expect(events.length).toBeGreaterThan(0);

    window.localStorage.setItem("eventwise_ai_events_v1", "{}");
    const events2 = await repo.getAll();
    expect(events2.length).toBeGreaterThan(0);
  });

  it("resets storage to demo events", async () => {
    const repo = new LocalStorageEventRepository();
    await repo.save(sampleEvent);
    const resetEvents = await repo.resetToDemo();
    expect(resetEvents.find((e) => e.id === "user_event_1")).toBeUndefined();
  });

  it("gracefully falls back to in-memory map when localStorage throws", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    const repo = new LocalStorageEventRepository();
    const all = await repo.getAll();
    expect(all.length).toBeGreaterThan(0);

    const saved = await repo.save(sampleEvent);
    expect(saved.name).toBe("Custom Party");
  });

  it("handles storage write errors in writeStorage catch block", async () => {
    const repo = new LocalStorageEventRepository();
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation((key) => {
      if (key === "eventwise_ai_events_v1") {
        throw new Error("QuotaExceeded");
      }
    });
    await expect(repo.save(sampleEvent)).resolves.toBeDefined();
    setItemSpy.mockRestore();
  });

  it("handles environment without localStorage", async () => {
    const originalStorage = window.localStorage;
    Object.defineProperty(window, "localStorage", { value: undefined, configurable: true, writable: true });
    const repo = new LocalStorageEventRepository();
    const all = await repo.getAll();
    expect(all.length).toBeGreaterThan(0);
    const saved = await repo.save(sampleEvent);
    expect(saved.id).toBe(sampleEvent.id);
    Object.defineProperty(window, "localStorage", { value: originalStorage, configurable: true, writable: true });
  });
});
