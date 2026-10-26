import { EventRepository } from "@/application/interfaces/EventRepository";
import { EventModel, TaskPriority, TaskStatus, TimelineTask } from "@/types/event";

export interface AddTaskInput {
  eventId: string;
  task: Omit<TimelineTask, "id">;
}

export interface UpdateTaskInput {
  eventId: string;
  taskId: string;
  title?: string;
  dueDate?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
  assignedTo?: string;
}

export interface DeleteTaskInput {
  eventId: string;
  taskId: string;
}

export class UpdateTaskStatusUseCase {
  constructor(private readonly repository: EventRepository) {}

  public async addTask(input: AddTaskInput): Promise<EventModel> {
    const event = await this.repository.getById(input.eventId);
    if (!event) {
      throw new Error(`Event with ID "${input.eventId}" not found.`);
    }

    if (!input.task.title?.trim()) {
      throw new Error("Task title is required.");
    }
    if (!input.task.dueDate?.trim()) {
      throw new Error("Task due date is required.");
    }

    const newTask: TimelineTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: input.task.title.trim(),
      dueDate: input.task.dueDate.trim(),
      status: input.task.status || "not_started",
      priority: input.task.priority || "medium",
      category: input.task.category?.trim() || "General",
      assignedTo: input.task.assignedTo?.trim() || "",
    };

    const updatedEvent: EventModel = {
      ...event,
      timeline: [...event.timeline, newTask],
      updatedAt: new Date().toISOString(),
    };

    return await this.repository.save(updatedEvent);
  }

  public async updateTask(input: UpdateTaskInput): Promise<EventModel> {
    const event = await this.repository.getById(input.eventId);
    if (!event) {
      throw new Error(`Event with ID "${input.eventId}" not found.`);
    }

    const index = event.timeline.findIndex((t) => t.id === input.taskId);
    if (index === -1) {
      throw new Error(`Task "${input.taskId}" not found.`);
    }

    const currentTask = event.timeline[index]!;
    const updatedTask: TimelineTask = {
      ...currentTask,
      title: input.title !== undefined ? input.title.trim() : currentTask.title,
      dueDate:
        input.dueDate !== undefined ? input.dueDate.trim() : currentTask.dueDate,
      status: input.status !== undefined ? input.status : currentTask.status,
      priority:
        input.priority !== undefined ? input.priority : currentTask.priority,
      category:
        input.category !== undefined
          ? input.category.trim()
          : currentTask.category,
      assignedTo:
        input.assignedTo !== undefined
          ? input.assignedTo.trim()
          : currentTask.assignedTo,
    };

    const updatedTimeline = [...event.timeline];
    updatedTimeline[index] = updatedTask;

    const updatedEvent: EventModel = {
      ...event,
      timeline: updatedTimeline,
      updatedAt: new Date().toISOString(),
    };

    return await this.repository.save(updatedEvent);
  }

  public async deleteTask(input: DeleteTaskInput): Promise<EventModel> {
    const event = await this.repository.getById(input.eventId);
    if (!event) {
      throw new Error(`Event with ID "${input.eventId}" not found.`);
    }

    const filtered = event.timeline.filter((t) => t.id !== input.taskId);
    const updatedEvent: EventModel = {
      ...event,
      timeline: filtered,
      updatedAt: new Date().toISOString(),
    };

    return await this.repository.save(updatedEvent);
  }
}
