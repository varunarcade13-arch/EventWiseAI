import { AIPlannerService } from "@/application/interfaces/AIPlannerService";
import { EventRepository } from "@/application/interfaces/EventRepository";
import { BudgetAnalysis } from "@/types/ai";

export class AnalyzeBudgetUseCase {
  constructor(
    private readonly aiPlannerService: AIPlannerService,
    private readonly repository: EventRepository
  ) {}

  public async execute(eventId: string): Promise<BudgetAnalysis> {
    const event = await this.repository.getById(eventId);
    if (!event) {
      throw new Error(`Event with ID "${eventId}" not found.`);
    }

    return await this.aiPlannerService.analyzeBudget({
      name: event.name,
      type: event.type,
      totalBudget: event.totalBudget,
      currency: event.currency,
      budgetCategories: event.budgetCategories,
      expectedGuests: event.expectedGuests,
    });
  }
}
