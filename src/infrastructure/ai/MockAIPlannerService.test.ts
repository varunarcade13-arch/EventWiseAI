import { describe, expect, it } from "vitest";
import { MockAIPlannerService } from "./MockAIPlannerService";

describe("MockAIPlannerService", () => {
  it("generates default event plan", async () => {
    const ai = new MockAIPlannerService();
    const plan = await ai.generateEventPlan({
      eventName: "Music Gala",
      eventType: "community",
      eventDate: "2026-12-01",
      location: "Park",
      expectedGuests: 200,
      totalBudget: 100000,
      currency: "INR",
    });

    expect(plan.summary).toContain("Music Gala");
    expect(plan.estimatedBudget.length).toBe(4);
    expect(plan.timeline.length).toBe(2);
    expect(plan.vendors.length).toBe(2);
  });

  it("returns customPlan when specified", async () => {
    const ai = new MockAIPlannerService();
    ai.customPlan = {
      summary: "Custom override plan",
      estimatedBudget: [],
      timeline: [],
      vendors: [],
      recommendations: [],
      risks: [],
    };

    const plan = await ai.generateEventPlan({
      eventName: "Gala",
      eventType: "other",
      eventDate: "2026-10-01",
      location: "Venue",
      expectedGuests: 10,
      totalBudget: 1000,
      currency: "USD",
    });

    expect(plan.summary).toBe("Custom override plan");
  });

  it("handles budget analysis, timeline, vendors, ideas, and risks", async () => {
    const ai = new MockAIPlannerService();

    const budget = await ai.analyzeBudget({
      name: "Event",
      type: "wedding",
      totalBudget: 10000,
      currency: "USD",
      budgetCategories: [],
      expectedGuests: 50,
    });
    expect(budget.healthScore).toBe(88);

    const timeline = await ai.generateTimeline({
      name: "Event",
      type: "wedding",
      date: "2026-12-12",
      expectedGuests: 50,
    });
    expect(timeline.length).toBe(2);

    const vendors = await ai.generateVendors({
      name: "Event",
      type: "wedding",
      totalBudget: 50000,
      expectedGuests: 50,
      currency: "USD",
    });
    expect(vendors.length).toBe(2);

    const ideas = await ai.generateIdeas({
      name: "Event",
      type: "wedding",
      location: "Paris",
      expectedGuests: 50,
    });
    expect(ideas.themes.length).toBe(3);

    const risks = await ai.assessRisks({
      name: "Event",
      type: "wedding",
      date: "2026-12-12",
      location: "Paris",
      expectedGuests: 50,
      totalBudget: 50000,
    });
    expect(risks.risks.length).toBe(2);
  });

  it("handles conversational chat with and without context", async () => {
    const ai = new MockAIPlannerService();

    const c1 = await ai.chat([{ role: "user", content: "What is next?" }]);
    expect(c1.responseText).toContain("What is next?");

    const c2 = await ai.chat(
      [{ role: "user", content: "Next step" }],
      { name: "Anniversary" }
    );
    expect(c2.responseText).toContain("for Anniversary");

    const c3 = await ai.chat([]);
    expect(c3.responseText).toBeDefined();
  });

  it("throws simulated errors when shouldFail is true", async () => {
    const ai = new MockAIPlannerService();
    ai.shouldFail = true;
    ai.failureMessage = "API rate limited";

    await expect(
      ai.generateEventPlan({
        eventName: "E",
        eventType: "other",
        eventDate: "2026-01-01",
        location: "L",
        expectedGuests: 10,
        totalBudget: 10,
        currency: "USD",
      })
    ).rejects.toThrow("API rate limited");

    await expect(
      ai.analyzeBudget({
        name: "E",
        type: "other",
        totalBudget: 10,
        currency: "USD",
        budgetCategories: [],
        expectedGuests: 10,
      })
    ).rejects.toThrow("API rate limited");

    await expect(
      ai.generateTimeline({ name: "E", type: "other", date: "2026-01-01", expectedGuests: 10 })
    ).rejects.toThrow("API rate limited");

    await expect(
      ai.generateVendors({ name: "E", type: "other", totalBudget: 10, expectedGuests: 10, currency: "USD" })
    ).rejects.toThrow("API rate limited");

    await expect(
      ai.generateIdeas({ name: "E", type: "other", location: "L", expectedGuests: 10 })
    ).rejects.toThrow("API rate limited");

    await expect(
      ai.assessRisks({ name: "E", type: "other", date: "2026-01-01", location: "L", expectedGuests: 10, totalBudget: 10 })
    ).rejects.toThrow("API rate limited");

    await expect(
      ai.chat([{ role: "user", content: "Hi" }])
    ).rejects.toThrow("API rate limited");
  });
});
