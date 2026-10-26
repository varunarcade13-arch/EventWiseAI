import { AIPlannerService } from "@/application/interfaces/AIPlannerService";
import { EventRepository } from "@/application/interfaces/EventRepository";
import { IdeasPlan } from "@/types/ai";

export class GenerateIdeasUseCase {
  constructor(
    private readonly aiPlannerService: AIPlannerService,
    private readonly repository: EventRepository
  ) {}

  public async execute(eventId: string): Promise<IdeasPlan> {
    const event = await this.repository.getById(eventId);
    if (!event) {
      throw new Error(`Event with ID "${eventId}" not found.`);
    }

    return await this.aiPlannerService.generateIdeas({
      name: event.name,
      type: event.type,
      location: event.location,
      expectedGuests: event.expectedGuests,
    });
  }
}
