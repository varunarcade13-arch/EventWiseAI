import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GeminiAIPlannerService } from "./GeminiAIPlannerService";
import { GoogleGenerativeAI } from "@google/generative-ai";

vi.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: vi.fn(),
  };
});

describe("GeminiAIPlannerService", () => {
  const originalEnv = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnv;
  });

  it("throws clear configuration error if GEMINI_API_KEY is missing", async () => {
    const service = new GeminiAIPlannerService("");
    await expect(
      service.generateEventPlan({
        eventName: "E",
        eventType: "wedding",
        eventDate: "2027-01-01",
        location: "L",
        expectedGuests: 100,
        totalBudget: 1000,
        currency: "INR",
      })
    ).rejects.toThrow("Gemini API key is not configured.");
  });

  it("successfully calls Gemini and validates event plan", async () => {
    const mockPlanJson = JSON.stringify({
      summary: "Plan summary",
      estimatedBudget: [{ name: "Venue", allocated: 500, actual: 0 }],
      timeline: [{ title: "T1", dueDate: "2027-01-01", status: "not_started", priority: "medium" }],
      vendors: [{ name: "V1", category: "venue", status: "not_contacted", estimatedCost: 500 }],
      recommendations: [{ category: "B", title: "T", description: "D" }],
      risks: [{ risk: "R", impact: "low", mitigation: "M" }],
    });

    const mockGenerateContent = vi.fn().mockResolvedValue({
      response: {
        text: () => mockPlanJson,
      },
    });

    vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    } as unknown as GoogleGenerativeAI));

    const service = new GeminiAIPlannerService("valid_fake_key");
    const plan = await service.generateEventPlan({
      eventName: "E",
      eventType: "wedding",
      eventDate: "2027-01-01",
      location: "L",
      expectedGuests: 100,
      totalBudget: 1000,
      currency: "INR",
    });

    expect(plan.summary).toBe("Plan summary");
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  it("calls analyzeBudget, generateTimeline, generateVendors, generateIdeas, assessRisks", async () => {
    const mockBudgetJson = JSON.stringify({
      summary: "Budget summary",
      healthScore: 90,
      overspendingRisk: false,
      underallocatedCategories: [],
      potentialSavings: [],
      redistributionSuggestions: [],
    });

    const mockTimelineJson = JSON.stringify([
      { title: "Task 1", dueDate: "2027-01-01" },
    ]);

    const mockVendorsJson = JSON.stringify([
      { name: "Venue", category: "venue", status: "not_contacted", estimatedCost: 1000 },
    ]);

    const mockIdeasJson = JSON.stringify({
      summary: "Creative ideas",
      themes: ["Rustic Chic"],
      activities: ["Games"],
      decorationIdeas: ["Flowers"],
      foodIdeas: ["Buffet"],
      entertainment: ["DJ"],
      guestExperiences: ["Favors"],
    });

    const mockRisksJson = JSON.stringify({
      summary: "Risks",
      risks: [{ risk: "Weather", impact: "high", mitigation: "Tents" }],
    });

    let currentResponse = mockBudgetJson;
    const mockGenerateContent = vi.fn().mockImplementation(() =>
      Promise.resolve({
        response: { text: () => currentResponse },
      })
    );

    vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    } as unknown as GoogleGenerativeAI));

    const service = new GeminiAIPlannerService("key_test");

    currentResponse = mockBudgetJson;
    const budget = await service.analyzeBudget({
      name: "E",
      type: "wedding",
      totalBudget: 1000,
      currency: "INR",
      budgetCategories: [],
      expectedGuests: 100,
    });
    expect(budget.healthScore).toBe(90);

    currentResponse = mockTimelineJson;
    const timeline = await service.generateTimeline({
      name: "E",
      type: "wedding",
      date: "2027-01-01",
      expectedGuests: 100,
    });
    expect(timeline.length).toBe(1);

    currentResponse = mockVendorsJson;
    const vendors = await service.generateVendors({
      name: "E",
      type: "wedding",
      totalBudget: 1000,
      expectedGuests: 100,
      currency: "INR",
    });
    expect(vendors.length).toBe(1);

    currentResponse = mockIdeasJson;
    const ideas = await service.generateIdeas({
      name: "E",
      type: "wedding",
      location: "L",
      expectedGuests: 100,
    });
    expect(ideas.themes[0]).toBe("Rustic Chic");

    currentResponse = mockRisksJson;
    const risks = await service.assessRisks({
      name: "E",
      type: "wedding",
      date: "2027-01-01",
      location: "L",
      expectedGuests: 100,
      totalBudget: 1000,
    });
    expect(risks.risks.length).toBe(1);
  });

  it("handles conversational chat and embedded structured plan", async () => {
    const plainChatText = "Here are three tips for booking your venue.";
    const mockGenerateContent = vi.fn().mockResolvedValue({
      response: { text: () => plainChatText },
    });

    vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    } as unknown as GoogleGenerativeAI));

    const service = new GeminiAIPlannerService("key_test");
    const chatRes = await service.chat([{ role: "user", content: "Venue advice?" }]);
    expect(chatRes.responseText).toBe(plainChatText);
    expect(chatRes.suggestedPlan).toBeUndefined();

    // Chat with embedded plan
    const embeddedPlanText = JSON.stringify({
      summary: "Complete plan",
      estimatedBudget: [{ name: "Venue", allocated: 500 }],
      timeline: [{ title: "T1", dueDate: "2027-01-01" }],
      vendors: [{ name: "V1", category: "venue", estimatedCost: 500 }],
      recommendations: [{ category: "B", title: "T", description: "D" }],
      risks: [{ risk: "R", impact: "low", mitigation: "M" }],
    });
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => embeddedPlanText },
    });

    const chatWithPlan = await service.chat([{ role: "user", content: "Build plan" }]);
    expect(chatWithPlan.suggestedPlan).toBeDefined();

    // Chat with invalid embedded plan that triggers catch block
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => '{"estimatedBudget": "broken", "timeline": []}' },
    });
    const chatWithBrokenPlan = await service.chat([{ role: "user", content: "Broken plan" }]);
    expect(chatWithBrokenPlan.suggestedPlan).toBeUndefined();
  });

  it("throws error on empty text response from Gemini", async () => {
    const mockGenerateContent = vi.fn().mockResolvedValue({
      response: { text: () => "   " },
    });

    vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    } as unknown as GoogleGenerativeAI));

    const service = new GeminiAIPlannerService("key_test");
    await expect(
      service.generateIdeas({ name: "E", type: "wedding", location: "L", expectedGuests: 10 })
    ).rejects.toThrow("Received empty response from Gemini API.");
  });

  it("handles request timeout properly", async () => {
    vi.useFakeTimers();

    const mockGenerateContent = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({ response: { text: () => "{}" } });
          }, 30000);
        })
    );

    vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    } as unknown as GoogleGenerativeAI));

    const service = new GeminiAIPlannerService("key_test");
    const callPromise = service.generateIdeas({
      name: "E",
      type: "wedding",
      location: "L",
      expectedGuests: 10,
    });

    // Advance time past 25s timeout
    vi.advanceTimersByTime(26000);

    await expect(callPromise).rejects.toThrow("Gemini request timed out");
    vi.useRealTimers();
  });
});
