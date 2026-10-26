import { EventRepository } from "@/application/interfaces/EventRepository";
import { EventValidator } from "@/domain/services/EventValidator";
import { EventModel, EventType, CurrencyCode } from "@/types/event";

export interface CreateEventInput {
  name: string;
  type: EventType;
  date: string;
  location: string;
  expectedGuests: number;
  totalBudget: number;
  currency: CurrencyCode;
}

export class CreateEventUseCase {
  constructor(private readonly repository: EventRepository) {}

  public async execute(input: CreateEventInput): Promise<EventModel> {
    const validation = EventValidator.validate(input);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0] ?? "Validation failed";
      throw new Error(firstError);
    }

    const now = new Date().toISOString();
    const id = `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newEvent: EventModel = {
      id,
      name: input.name.trim(),
      type: input.type,
      date: input.date,
      location: input.location.trim(),
      expectedGuests: Number(input.expectedGuests),
      totalBudget: Number(input.totalBudget),
      currency: input.currency,
      budgetCategories: [],
      timeline: [],
      vendors: [],
      recommendations: [],
      risks: [],
      isDemo: false,
      createdAt: now,
      updatedAt: now,
    };

    return await this.repository.save(newEvent);
  }
}
