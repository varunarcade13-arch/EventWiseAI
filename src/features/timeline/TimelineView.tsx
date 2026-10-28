import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { TimelineCalculator } from "@/domain/services/TimelineCalculator";
import { AddTaskModal } from "@/features/timeline/AddTaskModal";
import { formatDate } from "@/lib/formatters";
import { EventModel, TaskPriority, TaskStatus, TimelineTask } from "@/types/event";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Sparkles,
  Trash2,
  AlertCircle,
} from "lucide-react";
import React, { useState } from "react";

export interface TimelineViewProps {
  event: EventModel;
  onAddTask: (task: Omit<TimelineTask, "id">) => Promise<void>;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onTriggerAITimeline: () => void;
  isLoadingAI?: boolean;
}

const PRIORITY_BADGE_MAP: Record<
  TaskPriority,
  { variant: "danger" | "warning" | "neutral"; label: string }
> = {
  high: { variant: "danger", label: "High" },
  medium: { variant: "warning", label: "Medium" },
  low: { variant: "neutral", label: "Low" },
};

const STATUS_MAP: Record<
  TaskStatus,
  { label: string; icon: React.ReactNode; color: string }
> = {
  not_started: {
    label: "Not Started",
    icon: <Clock className="w-4 h-4 text-slate-400" />,
    color: "border-slate-300 dark:border-slate-700",
  },
  in_progress: {
    label: "In Progress",
    icon: <Clock className="w-4 h-4 text-amber-500 animate-spin" />,
    color: "border-amber-400 text-amber-600",
  },
  completed: {
    label: "Completed",
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    color: "border-emerald-500 text-emerald-600 line-through text-slate-400",
  },
};

const cycleStatus = (currentStatus: TaskStatus): TaskStatus => {
  if (currentStatus === "not_started") return "in_progress";
  if (currentStatus === "in_progress") return "completed";
  return "not_started";
};

export const TimelineView: React.FC<TimelineViewProps> = React.memo(({
  event,
  onAddTask,
  onUpdateTaskStatus,
  onDeleteTask,
  onTriggerAITimeline,
  isLoadingAI = false,
}) => {
  const [filterStatus, setFilterStatus] = useState<"all" | TaskStatus>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { sortedTasks, overdueTasks, statusCounts } = React.useMemo(() => {
    const sorted = TimelineCalculator.sortByDueDate(event.timeline);
    const overdue = TimelineCalculator.getOverdueTasks(event.timeline);
    const counts = { not_started: 0, in_progress: 0, completed: 0 };
    for (const t of event.timeline) {
      if (t.status in counts) {
        counts[t.status]++;
      }
    }
    return { sortedTasks: sorted, overdueTasks: overdue, statusCounts: counts };
  }, [event.timeline]);

  const filteredTasks = React.useMemo(
    () =>
      filterStatus === "all"
        ? sortedTasks
        : sortedTasks.filter((t) => t.status === filterStatus),
    [filterStatus, sortedTasks]
  );

  const todayStr = React.useMemo(
    () => new Date().toISOString().split("T")[0]!,
    []
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Overdue alert if any */}
      {overdueTasks.length > 0 && (
        <div
          role="alert"
          className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="flex-1">
            <strong>Attention:</strong> You have {overdueTasks.length} task
            {overdueTasks.length === 1 ? "" : "s"} past their scheduled due date.
          </p>
        </div>
      )}

      <Card>
        <CardHeader className="flex-col sm:flex-row items-start sm:items-center gap-3">
          <div>
            <CardTitle>Milestone Timeline & Tasks</CardTitle>
            <CardDescription>
              Chronological roadmap leading up to {formatDate(event.date)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Task
            </Button>
            <Button
              size="sm"
              variant="ai"
              onClick={onTriggerAITimeline}
              isLoading={isLoadingAI}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              AI Timeline Generator
            </Button>
          </div>
        </CardHeader>

        {/* Filter buttons */}
        <div
          role="group"
          aria-label="Filter tasks by status"
          className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/80 overflow-x-auto text-xs"
        >
          <span className="text-slate-500 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px] mr-1">
            Filter:
          </span>
          {(
            [
              { id: "all", label: `All (${event.timeline.length})` },
              {
                id: "not_started",
                label: `Not Started (${statusCounts.not_started})`,
              },
              {
                id: "in_progress",
                label: `In Progress (${statusCounts.in_progress})`,
              },
              {
                id: "completed",
                label: `Completed (${statusCounts.completed})`,
              },
            ] as const
          ).map((btn) => (
            <button
              key={btn.id}
              type="button"
              aria-pressed={filterStatus === btn.id}
              onClick={() => setFilterStatus(btn.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                filterStatus === btn.id
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Task List */}
        {filteredTasks.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {filteredTasks.map((task) => {
              const isOverdue =
                task.dueDate < todayStr &&
                task.status !== "completed";
              return (
                <div
                  key={task.id}
                  className={`flex items-start sm:items-center justify-between p-3.5 rounded-xl border transition-all ${
                    task.status === "completed"
                      ? "bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-700/60 opacity-80"
                      : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:border-brand-300"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateTaskStatus(task.id, cycleStatus(task.status))
                      }
                      title={`Status: ${STATUS_MAP[task.status].label}. Click to toggle.`}
                      aria-label={`Toggle status for task: ${task.title}. Current: ${STATUS_MAP[task.status].label}`}
                      className="mt-0.5 sm:mt-0 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    >
                      {STATUS_MAP[task.status].icon}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-semibold truncate ${
                          task.status === "completed"
                            ? "line-through text-slate-400 dark:text-slate-400"
                            : "text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" aria-hidden="true" />
                          <span className={isOverdue ? "text-rose-600 dark:text-rose-400 font-bold" : ""}>
                            {formatDate(task.dueDate)}
                            {isOverdue && " (Overdue)"}
                          </span>
                        </span>
                        {task.category && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                            {task.category}
                          </span>
                        )}
                        {task.assignedTo && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Assigned to: {task.assignedTo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 ml-3">
                    <Badge
                      variant={PRIORITY_BADGE_MAP[task.priority].variant}
                      size="sm"
                    >
                      {PRIORITY_BADGE_MAP[task.priority].label}
                    </Badge>

                    <select
                      value={task.status}
                      aria-label={`Update status for ${task.title}`}
                      onChange={(e) =>
                        onUpdateTaskStatus(task.id, e.target.value as TaskStatus)
                      }
                      className="text-xs bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-lg px-2 py-1 font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      aria-label={`Delete task ${task.title}`}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No tasks found for this filter.
            </p>
          </div>
        )}
      </Card>

      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultDate={event.date}
        onAdd={onAddTask}
      />
    </div>
  );
});

TimelineView.displayName = "TimelineView";

