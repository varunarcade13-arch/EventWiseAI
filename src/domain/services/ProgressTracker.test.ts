import { describe, expect, it } from "vitest";
import { ProgressTracker } from "./ProgressTracker";
import { EventModel } from "@/types/event";

describe("ProgressTracker", () => {
  const baseEvent: Pick<
    EventModel,
    "date" | "totalBudget" | "budgetCategories" | "timeline" | "vendors"
  > = {
    date: "2027-02-15",
    totalBudget: 1000000,
    budgetCategories: [
      { id: "1", name: "Venue", allocated: 500000, actual: 480000 },
      { id: "2", name: "Catering", allocated: 500000, actual: 500000 },
    ],
    timeline: [
      { id: "t1", title: "Book venue", dueDate: "2026-10-01", status: "completed", priority: "high" },
      { id: "t2", title: "Taste food", dueDate: "2026-11-01", status: "not_started", priority: "medium" },
    ],
    vendors: [
      { id: "v1", name: "Palace", category: "venue", status: "booked", estimatedCost: 500000 },
      { id: "v2", name: "Chef", category: "catering", status: "contacted", estimatedCost: 500000 },
    ],
  };

  it("calculates progress accurately for a partially completed event", () => {
    const refDate = new Date("2026-10-15");
    const progress = ProgressTracker.calculateProgress(baseEvent, refDate);

    expect(progress.totalTasks).toBe(2);
    expect(progress.tasksCompleted).toBe(1);
    expect(progress.totalVendors).toBe(2);
    expect(progress.vendorsBooked).toBe(1);
    expect(progress.budgetAllocatedPercentage).toBe(100);
    expect(progress.overallPercentage).toBeGreaterThan(0);
    expect(progress.daysRemaining).toBeGreaterThan(0);
  });

  it("calculates 100% progress when all tasks are complete and all vendors booked", () => {
    const completeEvent = {
      ...baseEvent,
      timeline: [
        { id: "t1", title: "T1", dueDate: "2026-10-01", status: "completed" as const, priority: "high" as const },
      ],
      vendors: [
        { id: "v1", name: "V1", category: "venue" as const, status: "booked" as const, estimatedCost: 100000 },
      ],
    };
    const progress = ProgressTracker.calculateProgress(completeEvent);
    expect(progress.overallPercentage).toBe(100);
    expect(progress.tasksCompleted).toBe(1);
    expect(progress.vendorsBooked).toBe(1);
  });

  it("handles completely empty event state without NaN", () => {
    const emptyEvent = {
      date: "2026-10-15",
      totalBudget: 0,
      budgetCategories: [],
      timeline: [],
      vendors: [],
    };
    const progress = ProgressTracker.calculateProgress(emptyEvent);
    expect(progress.overallPercentage).toBe(0);
    expect(progress.totalTasks).toBe(0);
    expect(progress.totalVendors).toBe(0);
  });

  it("handles partial weights when only tasks exist", () => {
    const tasksOnly = {
      date: "2027-01-01",
      totalBudget: 0,
      budgetCategories: [],
      timeline: [
        { id: "t1", title: "T1", dueDate: "2026-10-01", status: "completed" as const, priority: "high" as const },
        { id: "t2", title: "T2", dueDate: "2026-10-02", status: "not_started" as const, priority: "low" as const },
      ],
      vendors: [],
    };
    const progress = ProgressTracker.calculateProgress(tasksOnly);
    expect(progress.overallPercentage).toBe(50);
  });

  it("handles event date in the past", () => {
    const pastEvent = {
      ...baseEvent,
      date: "2024-01-01",
    };
    const refDate = new Date("2025-01-01");
    const progress = ProgressTracker.calculateProgress(pastEvent, refDate);
    expect(progress.daysRemaining).toBeLessThan(0);
  });

  it("handles event date today", () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;
    const todayEvent = {
      ...baseEvent,
      date: todayStr,
    };
    const progress = ProgressTracker.calculateProgress(todayEvent, today);
    expect(progress.daysRemaining).toBe(0);
  });

  it("handles undefined timeline, vendors, and budgetCategories", () => {
    const undefinedEvent = {
      date: "2027-01-01",
      totalBudget: 100000,
      timeline: undefined as unknown as [],
      vendors: undefined as unknown as [],
      budgetCategories: undefined as unknown as [],
    };
    const progress = ProgressTracker.calculateProgress(undefinedEvent);
    expect(progress.totalTasks).toBe(0);
    expect(progress.totalVendors).toBe(0);
    expect(progress.budgetAllocatedPercentage).toBe(0);
  });

  it("handles vendor-only and budget-only weighted scenarios", () => {
    const vendorOnly = {
      date: "2027-01-01",
      totalBudget: 0,
      budgetCategories: [],
      timeline: [],
      vendors: [
        { id: "v1", name: "V1", category: "venue" as const, status: "booked" as const, estimatedCost: 1000 },
        { id: "v2", name: "V2", category: "decoration" as const, status: "contacted" as const, estimatedCost: 1000 },
      ],
    };
    const vendorProgress = ProgressTracker.calculateProgress(vendorOnly);
    expect(vendorProgress.overallPercentage).toBe(50);

    const budgetOnly = {
      date: "2027-01-01",
      totalBudget: 1000,
      budgetCategories: [
        { id: "b1", name: "Venue", allocated: 500, actual: 0 },
        { id: "b2", name: "Decor", allocated: undefined as unknown as number, actual: 0 },
      ],
      timeline: [],
      vendors: [],
    };
    const budgetProgress = ProgressTracker.calculateProgress(budgetOnly);
    expect(budgetProgress.overallPercentage).toBe(50);
  });
});
