import { describe, expect, it } from "vitest";
import { PromptBuilder } from "./PromptBuilder";

describe("PromptBuilder", () => {
  it("builds event plan prompt with and without special requirements", () => {
    const prompt1 = PromptBuilder.buildEventPlanPrompt({
      eventName: "Sarah Wedding",
      eventType: "wedding",
      eventDate: "2027-02-15",
      location: "Bangalore",
      expectedGuests: 200,
      totalBudget: 1500000,
      currency: "INR",
      specialRequirements: "Vegetarian only menu",
    });
    expect(prompt1).toContain("Sarah Wedding");
    expect(prompt1).toContain("Vegetarian only menu");

    const prompt2 = PromptBuilder.buildEventPlanPrompt({
      eventName: "Birthday",
      eventType: "birthday",
      eventDate: "2026-11-20",
      location: "Delhi",
      expectedGuests: 50,
      totalBudget: 100000,
      currency: "INR",
    });
    expect(prompt2).not.toContain("Special Requirements");
  });

  it("builds budget analysis prompt with categories and empty categories", () => {
    const promptWithCategories = PromptBuilder.buildBudgetAnalysisPrompt({
      name: "Festival",
      type: "community",
      totalBudget: 500000,
      currency: "INR",
      expectedGuests: 500,
      budgetCategories: [{ id: "1", name: "Stage", allocated: 100000, actual: 90000 }],
    });
    expect(promptWithCategories).toContain("Stage: Allocated INR 100000");

    const promptWithoutCategories = PromptBuilder.buildBudgetAnalysisPrompt({
      name: "Festival",
      type: "community",
      totalBudget: 500000,
      currency: "INR",
      expectedGuests: 500,
      budgetCategories: [],
    });
    expect(promptWithoutCategories).toContain("None specified yet");
  });

  it("builds timeline prompt", () => {
    const prompt = PromptBuilder.buildTimelinePrompt({
      name: "Gala",
      type: "other",
      date: "2026-12-31",
      expectedGuests: 100,
    });
    expect(prompt).toContain("Gala");
    expect(prompt).toContain("2026-12-31");
  });

  it("builds vendors prompt", () => {
    const prompt = PromptBuilder.buildVendorsPrompt({
      name: "Gala",
      type: "other",
      totalBudget: 200000,
      expectedGuests: 100,
      currency: "USD",
    });
    expect(prompt).toContain("USD 200000");
  });

  it("builds ideas prompt", () => {
    const prompt = PromptBuilder.buildIdeasPrompt({
      name: "Birthday",
      type: "birthday",
      location: "Goa Beach",
      expectedGuests: 40,
    });
    expect(prompt).toContain("Goa Beach");
  });

  it("builds risks prompt", () => {
    const prompt = PromptBuilder.buildRisksPrompt({
      name: "Outdoor Event",
      type: "community",
      date: "2026-07-15",
      location: "Park",
      expectedGuests: 300,
      totalBudget: 50000,
    });
    expect(prompt).toContain("Outdoor Event");
  });

  it("builds chat prompt with and without event context", () => {
    const messages = [{ role: "user" as const, content: "Can you help?" }];

    const promptWithContext = PromptBuilder.buildChatPrompt(messages, {
      name: "Wedding Plan",
      type: "wedding",
      totalBudget: 1000000,
      currency: "INR",
      budgetCategories: [{ id: "1", name: "Venue", allocated: 500000, actual: 0 }],
    });
    expect(promptWithContext).toContain("Wedding Plan");
    expect(promptWithContext).toContain("USER: Can you help?");

    const promptWithoutContext = PromptBuilder.buildChatPrompt(messages);
    expect(promptWithoutContext).toContain("No specific event selected.");

    const promptWithEmptyContext = PromptBuilder.buildChatPrompt(messages, {});
    expect(promptWithEmptyContext).toContain("Name: Untitled");
    expect(promptWithEmptyContext).toContain("Type: General");
    expect(promptWithEmptyContext).toContain("Date: Not set");
    expect(promptWithEmptyContext).toContain("Location: Not set");
    expect(promptWithEmptyContext).toContain("Categories: None");
  });
});
