import { describe, expect, it } from "vitest";
import { EventPlanMapper } from "./EventPlanMapper";
import { EventPlan } from "@/types/ai";
import { EventModel } from "@/types/event";

describe("EventPlanMapper", () => {
  const baseEvent: EventModel = {
    id: "evt_123",
    name: "Summer Wedding",
    type: "wedding",
    date: "2027-06-15",
    location: "Grand Ballroom",
    expectedGuests: 150,
    currency: "INR",
    totalBudget: 1000000,
    budgetCategories: [],
    timeline: [],
    vendors: [],
    recommendations: [],
    risks: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  const samplePlan: EventPlan = {
    summary: "Plan summary",
    estimatedBudget: [
      { name: "Venue", allocated: 400000, actual: 0, notes: "Main hall" },
      { id: "custom_cat_1", name: "Catering", allocated: 300000, actual: 50000, notes: "Dinner" },
    ],
    timeline: [
      { title: "Book venue", dueDate: "2027-01-01", status: "not_started", priority: "medium" },
      { id: "custom_task_1", title: "Order cake", dueDate: "2027-03-01", status: "in_progress", priority: "high", category: "Food", assignedTo: "Sarah" },
    ],
    vendors: [
      { name: "Floral Decorators", category: "decoration", status: "not_contacted", estimatedCost: 100000 },
      {
        id: "custom_vendor_1",
        name: "Lumina Studios",
        category: "photography",
        status: "contacted",
        estimatedCost: 150000,
        actualCost: 140000,
        contactPerson: "Alex",
        phone: "+91 9999999999",
        email: "alex@lumina.com",
        notes: "Deposit needed",
      },
    ],
    recommendations: [
      { category: "Budget", title: "Bundle AV", description: "Save on packages" },
      { id: "custom_rec_1", category: "Timing", title: "Golden Hour", description: "Photos at 5pm", estimatedSavingsOrCost: "Free" },
    ],
    risks: [
      { risk: "Rain", impact: "high", mitigation: "Tents" },
      { id: "custom_risk_1", risk: "Vendor delay", impact: "medium", mitigation: "Contract terms" },
    ],
  };

  it("extracts and maps event fields via mapPlanToEventFields", () => {
    const fields = EventPlanMapper.mapPlanToEventFields(samplePlan, "fields_test");
    expect(fields.budgetCategories).toHaveLength(2);
    expect(fields.budgetCategories[0]?.id).toBe("fields_test_cat_0");
    expect(fields.timeline).toHaveLength(2);
    expect(fields.timeline[0]?.id).toBe("fields_test_task_0");
    expect(fields.vendors).toHaveLength(2);
    expect(fields.vendors[0]?.id).toBe("fields_test_vendor_0");
  });

  it("maps an EventPlan into an EventModel with explicit idPrefix", () => {
    const updated = EventPlanMapper.applyPlanToEvent(baseEvent, samplePlan, "test_prefix");

    expect(updated.budgetCategories).toHaveLength(2);
    expect(updated.budgetCategories[0]?.id).toBe("test_prefix_cat_0");
    expect(updated.budgetCategories[1]?.id).toBe("custom_cat_1");
    expect(updated.budgetCategories[1]?.actual).toBe(50000);

    expect(updated.timeline).toHaveLength(2);
    expect(updated.timeline[0]?.id).toBe("test_prefix_task_0");
    expect(updated.timeline[0]?.status).toBe("not_started");
    expect(updated.timeline[1]?.id).toBe("custom_task_1");
    expect(updated.timeline[1]?.status).toBe("in_progress");

    expect(updated.vendors).toHaveLength(2);
    expect(updated.vendors[0]?.id).toBe("test_prefix_vendor_0");
    expect(updated.vendors[0]?.status).toBe("not_contacted");
    expect(updated.vendors[1]?.id).toBe("custom_vendor_1");
    expect(updated.vendors[1]?.contactPerson).toBe("Alex");

    expect(updated.recommendations).toHaveLength(2);
    expect(updated.recommendations[0]?.id).toBe("test_prefix_rec_0");
    expect(updated.recommendations[1]?.id).toBe("custom_rec_1");

    expect(updated.risks).toHaveLength(2);
    expect(updated.risks[0]?.id).toBe("test_prefix_risk_0");
    expect(updated.risks[1]?.id).toBe("custom_risk_1");
  });

  it("maps an EventPlan using default generated prefix when omitted", () => {
    const updated = EventPlanMapper.applyPlanToEvent(baseEvent, samplePlan);
    expect(updated.budgetCategories[0]?.id).toMatch(/^ai_\d+_cat_0$/);
  });

  it("generates default budget categories according to budget proportions", () => {
    const categories = EventPlanMapper.createDefaultCategories(1000000, "evt_new");
    expect(categories).toHaveLength(4);
    expect(categories[0]?.allocated).toBe(400000);
    expect(categories[1]?.allocated).toBe(300000);
    expect(categories[2]?.allocated).toBe(200000);
    expect(categories[3]?.allocated).toBe(100000);
    expect(categories[0]?.id).toBe("cat_evt_new_venue");
  });

  it("generates default timeline tasks for an event", () => {
    const tasks = EventPlanMapper.createDefaultTimeline("Maya's Gala", "2027-08-20", "evt_new");
    expect(tasks).toHaveLength(2);
    expect(tasks[0]?.title).toContain("Maya's Gala");
    expect(tasks[0]?.dueDate).toBe("2027-08-20");
    expect(tasks[0]?.id).toBe("task_evt_new_1");
  });

  it("handles optional fields when undefined with safe defaults", () => {
    const sparsePlan = {
      summary: "Sparse plan",
      estimatedBudget: [
        { name: "Venue", allocated: 200000 },
      ],
      timeline: [
        { title: "Task 1", dueDate: "2027-01-01" },
      ],
      vendors: [
        { name: "Vendor 1", category: "venue", estimatedCost: 50000 },
      ],
      recommendations: [],
      risks: [],
    };
    const mapped = EventPlanMapper.mapPlanToEventFields(sparsePlan as unknown as EventPlan);
    expect(mapped.budgetCategories[0]?.actual).toBe(0);
    expect(mapped.timeline[0]?.status).toBe("not_started");
    expect(mapped.timeline[0]?.priority).toBe("medium");
    expect(mapped.vendors[0]?.status).toBe("not_contacted");
  });
});

