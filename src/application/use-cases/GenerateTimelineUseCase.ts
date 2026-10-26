import { AIPlannerService } from "@/application/interfaces/AIPlannerService";
import { EventRepository } from "@/application/interfaces/EventRepository";
import { TimelineTask } from "@/types/event";

export class GenerateTimelineUseCase {
  constructor(
    private readonly aiPlannerService: AIPlannerService,
    private readonly repository: EventRepository
  ) {}

  public async execute(eventId: string, applyToEvent: boolean = false): Promise<TimelineTask[]> {
    const event = await this.repository.getById(eventId);
    if (!event) {
      throw new Error(`Event with ID "${eventId}" not found.`);
    }

    const tasks = await this.aiPlannerService.generateTimeline({
      name: event.name,
      type: event.type,
      date: event.date,
      expectedGuests: event.expectedGuests,
    });

    const formattedTasks: TimelineTask[] = tasks.map((t, idx) => ({
      id: t.id || `ai_task_${Date.now()}_${idx}`,
      title: t.title,
      dueDate: t.dueDate,
      status: t.status ?? "not_started",
      priority: t.priority ?? "medium",
      category: t.category ?? "General",
      assignedTo: t.assignedTo ?? "",
    }));

    if (applyToEvent) {
      await this.repository.save({
        ...event,
        timeline: formattedTasks,
        updatedAt: new Date().toISOString(),
      });
    }

    return formattedTasks;
  }
}
