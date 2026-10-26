import { AIPlannerService } from "@/application/interfaces/AIPlannerService";
import { EventRepository } from "@/application/interfaces/EventRepository";
import { EventPlan } from "@/types/ai";
import { EventModel } from "@/types/event";

export interface ChatAssistantInput {
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  eventId?: string;
}

export interface ChatAssistantResponse {
  responseText: string;
  suggestedPlan?: EventPlan;
}

export class ChatAssistantUseCase {
  constructor(
    private readonly aiPlannerService: AIPlannerService,
    private readonly repository?: EventRepository
  ) {}

  public async execute(input: ChatAssistantInput): Promise<ChatAssistantResponse> {
    if (!input.messages || input.messages.length === 0) {
      throw new Error("Chat messages cannot be empty.");
    }

    let context: Partial<EventModel> | undefined = undefined;
    if (input.eventId && this.repository) {
      const event = await this.repository.getById(input.eventId);
      if (event) {
        context = {
          name: event.name,
          type: event.type,
          date: event.date,
          location: event.location,
          expectedGuests: event.expectedGuests,
          totalBudget: event.totalBudget,
          currency: event.currency,
          budgetCategories: event.budgetCategories,
        };
      }
    }

    return await this.aiPlannerService.chat(input.messages, context);
  }
}
