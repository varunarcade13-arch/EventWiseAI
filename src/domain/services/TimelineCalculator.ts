import { TaskPriority, TaskStatus, TimelineTask } from "@/types/event";

export class TimelineCalculator {
  /**
   * Sorts timeline tasks chronologically by due date.
   */
  public static sortByDueDate(tasks: TimelineTask[]): TimelineTask[] {
    return [...tasks].sort((a, b) => {
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      const isInvalidA = isNaN(dateA);
      const isInvalidB = isNaN(dateB);
      if (isInvalidA && isInvalidB) return 0;
      if (isInvalidA) return 1;
      if (isInvalidB) return -1;
      return dateA - dateB;
    });
  }

  /**
   * Identifies overdue tasks relative to reference date.
   */
  public static getOverdueTasks(
    tasks: TimelineTask[],
    referenceDate: Date = new Date()
  ): TimelineTask[] {
    const todayStr = referenceDate.toISOString().split("T")[0]!;
    return tasks.filter(
      (task) => task.dueDate < todayStr && task.status !== "completed"
    );
  }

  /**
   * Filters tasks by priority.
   */
  public static filterByPriority(
    tasks: TimelineTask[],
    priority: TaskPriority
  ): TimelineTask[] {
    return tasks.filter((task) => task.priority === priority);
  }

  /**
   * Filters tasks by status.
   */
  public static filterByStatus(
    tasks: TimelineTask[],
    status: TaskStatus
  ): TimelineTask[] {
    return tasks.filter((task) => task.status === status);
  }
}
