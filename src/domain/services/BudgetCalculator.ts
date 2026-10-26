import { BudgetCategory, BudgetSummary } from "@/types/event";

export class BudgetCalculator {
  /**
   * Calculates comprehensive budget summary from total budget and category allocations.
   * Ensures clean precision, handles edge cases such as 0 budget, empty categories, and overspending.
   */
  public static calculateSummary(
    totalBudget: number,
    categories: BudgetCategory[]
  ): BudgetSummary {
    const safeTotalBudget = Math.max(0, Number(totalBudget) || 0);

    const totalAllocated = categories.reduce((sum, cat) => {
      const val = Math.max(0, Number(cat.allocated) || 0);
      return sum + val;
    }, 0);

    const totalActual = categories.reduce((sum, cat) => {
      const val = Math.max(0, Number(cat.actual) || 0);
      return sum + val;
    }, 0);

    const remainingAllocated = safeTotalBudget - totalAllocated;
    const remainingActual = safeTotalBudget - totalActual;

    const percentageAllocated =
      safeTotalBudget > 0
        ? Math.round((totalAllocated / safeTotalBudget) * 1000) / 10
        : 0;

    const percentageSpent =
      safeTotalBudget > 0
        ? Math.round((totalActual / safeTotalBudget) * 1000) / 10
        : 0;

    const isOverBudget =
      totalAllocated > safeTotalBudget || totalActual > safeTotalBudget;

    return {
      totalBudget: safeTotalBudget,
      totalAllocated,
      totalActual,
      remainingAllocated,
      remainingActual,
      percentageAllocated,
      percentageSpent,
      isOverBudget,
    };
  }

  /**
   * Validates if a proposed category allocation fits within remaining budget or flags warning.
   */
  public static validateAllocation(
    totalBudget: number,
    currentAllocated: number,
    newAmount: number,
    oldAmount: number = 0
  ): { isValid: boolean; overflowAmount: number } {
    const netChange = newAmount - oldAmount;
    const nextTotal = currentAllocated + netChange;
    const overflow = Math.max(0, nextTotal - totalBudget);

    return {
      isValid: overflow === 0,
      overflowAmount: overflow,
    };
  }
}
