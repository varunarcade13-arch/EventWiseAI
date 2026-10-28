import { EventPlan } from "@/types/ai";
import { BudgetCategory, EventModel, TimelineTask } from "@/types/event";

export class EventPlanMapper {
  /**
   * Maps an AI generated EventPlan into an existing or new EventModel.
   * Centralizes structured mappings for budget categories, timeline tasks, vendors,
   * recommendations, and risks while assigning unique IDs and safe defaults.
   */
  /**
   * Extracts and maps structured fields (budget, timeline, vendors, recs, risks)
   * from an AI EventPlan with unique IDs and safe defaults.
   */
  public static mapPlanToEventFields(plan: EventPlan, idPrefix?: string) {
    const prefix = idPrefix || `ai_${Date.now()}`;
    return {
      budgetCategories: plan.estimatedBudget.map((b, idx) => ({
        id: b.id || `${prefix}_cat_${idx}`,
        name: b.name,
        allocated: b.allocated,
        actual: b.actual ?? 0,
        notes: b.notes,
      })),
      timeline: plan.timeline.map((t, idx) => ({
        id: t.id || `${prefix}_task_${idx}`,
        title: t.title,
        dueDate: t.dueDate,
        status: t.status ?? "not_started",
        priority: t.priority ?? "medium",
        category: t.category ?? "General",
        assignedTo: t.assignedTo ?? "",
      })),
      vendors: plan.vendors.map((v, idx) => ({
        id: v.id || `${prefix}_vendor_${idx}`,
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
        ...r,
        id: r.id || `${prefix}_rec_${idx}`,
      })),
      risks: plan.risks.map((rk, idx) => ({
        ...rk,
        id: rk.id || `${prefix}_risk_${idx}`,
      })),
    };
  }

  /**
   * Maps an AI generated EventPlan into an existing EventModel.
   */
  public static applyPlanToEvent(
    event: EventModel,
    plan: EventPlan,
    idPrefix?: string
  ): EventModel {
    return {
      ...event,
      ...EventPlanMapper.mapPlanToEventFields(plan, idPrefix),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generates standard fallback budget categories for new events when AI is skipped or offline.
   */
  public static createDefaultCategories(
    totalBudget: number,
    eventId: string
  ): BudgetCategory[] {
    return [
      {
        id: `cat_${eventId}_venue`,
        name: "Venue",
        allocated: Math.round(totalBudget * 0.4),
        actual: 0,
      },
      {
        id: `cat_${eventId}_catering`,
        name: "Catering",
        allocated: Math.round(totalBudget * 0.3),
        actual: 0,
      },
      {
        id: `cat_${eventId}_decor`,
        name: "Decor & Production",
        allocated: Math.round(totalBudget * 0.2),
        actual: 0,
      },
      {
        id: `cat_${eventId}_contingency`,
        name: "Contingency Fund",
        allocated: Math.round(totalBudget * 0.1),
        actual: 0,
      },
    ];
  }

  /**
   * Generates standard fallback timeline tasks for new events when AI is skipped or offline.
   */
  public static createDefaultTimeline(
    eventName: string,
    eventDate: string,
    eventId: string
  ): TimelineTask[] {
    return [
      {
        id: `task_${eventId}_1`,
        title: `Lock in venue for ${eventName}`,
        dueDate: eventDate,
        status: "not_started",
        priority: "high",
        category: "Venue",
      },
      {
        id: `task_${eventId}_2`,
        title: "Send invitations to guests",
        dueDate: eventDate,
        status: "not_started",
        priority: "medium",
        category: "Invitations",
      },
    ];
  }
}
