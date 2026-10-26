import { EventModel, PlanningProgress } from "@/types/event";

export class ProgressTracker {
  /**
   * Computes multi-dimensional planning progress for an event.
   */
  public static calculateProgress(
    event: Pick<
      EventModel,
      "date" | "totalBudget" | "budgetCategories" | "timeline" | "vendors"
    >,
    referenceDate: Date = new Date()
  ): PlanningProgress {
    // 1. Task progress
    const totalTasks = event.timeline?.length ?? 0;
    const tasksCompleted =
      event.timeline?.filter((t) => t.status === "completed").length ?? 0;
    const taskRatio = totalTasks > 0 ? tasksCompleted / totalTasks : 0;

    // 2. Vendor booking progress
    const totalVendors = event.vendors?.length ?? 0;
    const vendorsBooked =
      event.vendors?.filter((v) => v.status === "booked").length ?? 0;
    const vendorRatio = totalVendors > 0 ? vendorsBooked / totalVendors : 0;

    // 3. Budget allocation progress
    const safeTotalBudget = Math.max(0, event.totalBudget || 0);
    const totalAllocated =
      event.budgetCategories?.reduce((sum, c) => sum + (c.allocated || 0), 0) ??
      0;
    const budgetAllocatedPercentage =
      safeTotalBudget > 0
        ? Math.min(100, Math.round((totalAllocated / safeTotalBudget) * 100))
        : 0;
    const budgetRatio = budgetAllocatedPercentage / 100;

    // 4. Overall weighted percentage: 40% tasks + 35% vendors + 25% budget
    let overallPercentage = 0;
    if (totalTasks === 0 && totalVendors === 0 && safeTotalBudget === 0) {
      overallPercentage = 0;
    } else {
      let weightSum = 0;
      let scoreSum = 0;

      if (totalTasks > 0) {
        weightSum += 0.45;
        scoreSum += taskRatio * 0.45;
      }
      if (totalVendors > 0) {
        weightSum += 0.35;
        scoreSum += vendorRatio * 0.35;
      }
      if (safeTotalBudget > 0) {
        weightSum += 0.2;
        scoreSum += budgetRatio * 0.2;
      }

      overallPercentage = Math.round((scoreSum / weightSum) * 100);
    }

    // 5. Days remaining calculation
    const targetDate = new Date(event.date);
    const ref = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate()
    );
    const target = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate()
    );

    const diffMs = target.getTime() - ref.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return {
      overallPercentage: Math.max(0, Math.min(100, overallPercentage)),
      tasksCompleted,
      totalTasks,
      vendorsBooked,
      totalVendors,
      budgetAllocatedPercentage,
      daysRemaining,
    };
  }
}
