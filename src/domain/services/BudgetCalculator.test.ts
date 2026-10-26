import { describe, expect, it } from "vitest";
import { BudgetCalculator } from "./BudgetCalculator";
import { BudgetCategory } from "@/types/event";

describe("BudgetCalculator", () => {
  it("calculates summary correctly with regular values", () => {
    const categories: BudgetCategory[] = [
      { id: "1", name: "Venue", allocated: 500000, actual: 480000 },
      { id: "2", name: "Catering", allocated: 300000, actual: 310000 },
    ];
    const summary = BudgetCalculator.calculateSummary(1000000, categories);

    expect(summary.totalBudget).toBe(1000000);
    expect(summary.totalAllocated).toBe(800000);
    expect(summary.totalActual).toBe(790000);
    expect(summary.remainingAllocated).toBe(200000);
    expect(summary.remainingActual).toBe(210000);
    expect(summary.percentageAllocated).toBe(80);
    expect(summary.percentageSpent).toBe(79);
    expect(summary.isOverBudget).toBe(false);
  });

  it("handles edge case with 0 or negative total budget", () => {
    const categories: BudgetCategory[] = [
      { id: "1", name: "Venue", allocated: 50000, actual: 20000 },
    ];
    const summaryZero = BudgetCalculator.calculateSummary(0, categories);
    expect(summaryZero.totalBudget).toBe(0);
    expect(summaryZero.percentageAllocated).toBe(0);
    expect(summaryZero.percentageSpent).toBe(0);
    expect(summaryZero.isOverBudget).toBe(true);

    const summaryNegative = BudgetCalculator.calculateSummary(-500, categories);
    expect(summaryNegative.totalBudget).toBe(0);
  });

  it("handles empty categories list", () => {
    const summary = BudgetCalculator.calculateSummary(500000, []);
    expect(summary.totalAllocated).toBe(0);
    expect(summary.totalActual).toBe(0);
    expect(summary.remainingAllocated).toBe(500000);
    expect(summary.remainingActual).toBe(500000);
    expect(summary.percentageAllocated).toBe(0);
    expect(summary.isOverBudget).toBe(false);
  });

  it("identifies over-budget condition when actual exceeds planned total", () => {
    const categories: BudgetCategory[] = [
      { id: "1", name: "Venue", allocated: 100000, actual: 150000 },
    ];
    const summary = BudgetCalculator.calculateSummary(120000, categories);
    expect(summary.isOverBudget).toBe(true);
    expect(summary.remainingActual).toBe(-30000);
  });

  it("handles non-numeric, negative, or undefined category values safely", () => {
    const categories: BudgetCategory[] = [
      { id: "1", name: "Venue", allocated: -500, actual: -100 },
      { id: "2", name: "Decor", allocated: ("invalid" as unknown as number), actual: 50 },
      { id: "3", name: "Photo", allocated: 100, actual: (undefined as unknown as number) },
      { id: "4", name: "Music", allocated: 100, actual: ("not-a-number" as unknown as number) },
    ];
    const summary = BudgetCalculator.calculateSummary(1000, categories);
    expect(summary.totalAllocated).toBe(200);
    expect(summary.totalActual).toBe(50);
  });

  it("validates allocation correctly with and without oldAmount", () => {
    const valid = BudgetCalculator.validateAllocation(1000, 600, 300);
    expect(valid.isValid).toBe(true);
    expect(valid.overflowAmount).toBe(0);

    const overflow = BudgetCalculator.validateAllocation(1000, 800, 400, 100);
    expect(overflow.isValid).toBe(false);
    expect(overflow.overflowAmount).toBe(100);
  });
});
