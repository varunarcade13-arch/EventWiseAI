import { AIPlannerService } from "@/application/interfaces/AIPlannerService";
import { EventRepository } from "@/application/interfaces/EventRepository";
import { EventPlan, EventPlanningInput } from "@/types/ai";
import { EventModel } from "@/types/event";

export class GenerateEventPlanUseCase {
  constructor(
    private readonly aiPlannerService: AIPlannerService,
    private readonly repository?: EventRepository
  ) {}

  public async execute(
    input: EventPlanningInput,
    eventIdToApply?: string
  ): Promise<{ plan: EventPlan; updatedEvent?: EventModel }> {
    const plan = await this.aiPlannerService.generateEventPlan(input);

    let updatedEvent: EventModel | undefined = undefined;

    if (eventIdToApply && this.repository) {
      const existing = await this.repository.getById(eventIdToApply);
      if (existing) {
        // Merge or replace budget categories, timeline, vendors, recommendations, risks
        const now = new Date().toISOString();
        const mergedEvent: EventModel = {
          ...existing,
          budgetCategories: plan.estimatedBudget.map((b, idx) => ({
            id: b.id || `ai_cat_${Date.now()}_${idx}`,
            name: b.name,
            allocated: b.allocated,
            actual: b.actual ?? 0,
            notes: b.notes,
          })),
          timeline: plan.timeline.map((t, idx) => ({
            id: t.id || `ai_task_${Date.now()}_${idx}`,
            title: t.title,
            dueDate: t.dueDate,
            status: t.status ?? "not_started",
            priority: t.priority ?? "medium",
            category: t.category ?? "General",
            assignedTo: t.assignedTo ?? "",
          })),
          vendors: plan.vendors.map((v, idx) => ({
            id: v.id || `ai_vendor_${Date.now()}_${idx}`,
            name: v.name,
            category: v.category,
            status: v.status ?? "not_contacted",
            estimatedCost: v.estimatedCost,
            actualCost: v.actualCost,
            contactPerson: v.contactPerson ?? "",
            phone: v.phone ?? "",
            email: v.email ?? "",
            notes: v.notes ?? "",
          })),
          recommendations: plan.recommendations.map((r, idx) => ({
            id: r.id || `ai_rec_${Date.now()}_${idx}`,
            category: r.category,
            title: r.title,
            description: r.description,
            estimatedSavingsOrCost: r.estimatedSavingsOrCost,
          })),
          risks: plan.risks.map((rk, idx) => ({
            id: rk.id || `ai_risk_${Date.now()}_${idx}`,
            risk: rk.risk,
            impact: rk.impact,
            mitigation: rk.mitigation,
          })),
          updatedAt: now,
        };

        updatedEvent = await this.repository.save(mergedEvent);
      }
    }

    return { plan, updatedEvent };
  }
}
