import {
  BudgetAnalysis,
  EventPlan,
  EventPlanningInput,
  IdeasPlan,
  RiskAnalysis,
} from "@/types/ai";
import { EventModel } from "@/types/event";

export interface AIPlannerService {
  /**
   * Generates a complete structured event plan (budget, timeline, vendors, recommendations, risks).
   */
  generateEventPlan(input: EventPlanningInput): Promise<EventPlan>;

  /**
   * Analyzes an event's budget allocations and generates optimization recommendations.
   */
  analyzeBudget(
    event: Pick<EventModel, "name" | "type" | "totalBudget" | "currency" | "budgetCategories" | "expectedGuests">
  ): Promise<BudgetAnalysis>;

  /**
   * Generates prioritized timeline tasks based on event characteristics.
   */
  generateTimeline(
    event: Pick<EventModel, "name" | "type" | "date" | "expectedGuests">
  ): Promise<EventPlan["timeline"]>;

  /**
   * Generates tailored vendor checklist items.
   */
  generateVendors(
    event: Pick<EventModel, "name" | "type" | "totalBudget" | "expectedGuests" | "currency">
  ): Promise<EventPlan["vendors"]>;

  /**
   * Generates creative ideas (themes, activities, decoration, food, entertainment, experiences).
   */
  generateIdeas(
    event: Pick<EventModel, "name" | "type" | "location" | "expectedGuests">
  ): Promise<IdeasPlan>;

  /**
   * Generates potential risks and contingency plans.
   */
  assessRisks(
    event: Pick<EventModel, "name" | "type" | "date" | "location" | "expectedGuests" | "totalBudget">
  ): Promise<RiskAnalysis>;

  /**
   * Conversational assistant with structured output support if requested.
   */
  chat(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    context?: Partial<EventModel>
  ): Promise<{ responseText: string; suggestedPlan?: EventPlan }>;
}
