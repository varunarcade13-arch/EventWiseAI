import { describe, expect, it } from "vitest";
import { TimelineCalculator } from "./TimelineCalculator";
import { TimelineTask } from "@/types/event";

describe("TimelineCalculator", () => {
  const sampleTasks: TimelineTask[] = [
    { id: "1", title: "Later Task", dueDate: "2026-12-01", status: "not_started", priority: "low" },
    { id: "2", title: "Earlier Task", dueDate: "2026-06-01", status: "completed", priority: "high" },
    { id: "3", title: "Middle Task", dueDate: "2026-09-01", status: "in_progress", priority: "medium" },
    { id: "4", title: "Invalid Date Task", dueDate: "not-a-date", status: "not_started", priority: "low" },
  ];

  it("sorts tasks chronologically and places invalid dates at the end", () => {
    const sorted = TimelineCalculator.sortByDueDate(sampleTasks);
    expect(sorted[0]?.title).toBe("Earlier Task");
    expect(sorted[1]?.title).toBe("Middle Task");
    expect(sorted[2]?.title).toBe("Later Task");
    expect(sorted[3]?.title).toBe("Invalid Date Task");
  });

  it("handles sorting when second task has invalid date", () => {
    const tasks: TimelineTask[] = [
      { id: "1", title: "Invalid", dueDate: "invalid-date", status: "not_started", priority: "low" },
      { id: "2", title: "Valid", dueDate: "2026-01-01", status: "not_started", priority: "low" },
    ];
    const sorted = TimelineCalculator.sortByDueDate(tasks);
    expect(sorted[0]?.title).toBe("Valid");
    expect(sorted[1]?.title).toBe("Invalid");
  });

  it("handles sorting when both tasks have invalid dates", () => {
    const tasks: TimelineTask[] = [
      { id: "1", title: "Invalid 1", dueDate: "not_a_valid_date_a", status: "not_started", priority: "low" },
      { id: "2", title: "Invalid 2", dueDate: "not_a_valid_date_b", status: "not_started", priority: "low" },
    ];
    const sorted = TimelineCalculator.sortByDueDate(tasks);
    expect(sorted.length).toBe(2);
  });

  it("identifies overdue tasks based on reference date or default date", () => {
    const tasks: TimelineTask[] = [
      { id: "1", title: "Overdue Pending", dueDate: "2026-01-01", status: "in_progress", priority: "high" },
      { id: "2", title: "Overdue Completed", dueDate: "2026-01-01", status: "completed", priority: "high" },
      { id: "3", title: "Future Pending", dueDate: "2026-10-01", status: "not_started", priority: "low" },
    ];
    const refDate = new Date("2026-05-01");
    const overdue = TimelineCalculator.getOverdueTasks(tasks, refDate);
    expect(overdue.length).toBe(1);
    expect(overdue[0]?.title).toBe("Overdue Pending");

    const defaultOverdue = TimelineCalculator.getOverdueTasks(tasks);
    expect(Array.isArray(defaultOverdue)).toBe(true);
  });

  it("filters tasks by priority", () => {
    const high = TimelineCalculator.filterByPriority(sampleTasks, "high");
    expect(high.length).toBe(1);
    expect(high[0]?.title).toBe("Earlier Task");
  });

  it("filters tasks by status", () => {
    const completed = TimelineCalculator.filterByStatus(sampleTasks, "completed");
    expect(completed.length).toBe(1);
    expect(completed[0]?.title).toBe("Earlier Task");
  });
});
