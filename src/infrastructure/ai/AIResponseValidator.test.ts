import { describe, expect, it } from "vitest";
import { AIResponseValidator } from "./AIResponseValidator";

describe("AIResponseValidator", () => {
  describe("validateEventPlan", () => {
    it("successfully validates compliant plan JSON", () => {
      const validJson = JSON.stringify({
        summary: "Comprehensive wedding plan",
        estimatedBudget: [{ name: "Venue", allocated: 500000, actual: 0 }],
        timeline: [{ title: "Book venue", dueDate: "2026-10-01", status: "not_started", priority: "high" }],
        vendors: [{ name: "Palace", category: "venue", status: "not_contacted", estimatedCost: 500000 }],
        recommendations: [{ category: "Budget", title: "Early discount", description: "Save 10%" }],
        risks: [{ risk: "Rain", impact: "high", mitigation: "Indoor hall" }],
      });

      const plan = AIResponseValidator.validateEventPlan(validJson);
      expect(plan.summary).toBe("Comprehensive wedding plan");
      expect(plan.estimatedBudget[0]?.name).toBe("Venue");
    });

    it("handles markdown code blocks correctly", () => {
      const markdown = `\`\`\`json
{
  "summary": "Plan",
  "estimatedBudget": [{"name": "Decor", "allocated": 1000}],
  "timeline": [{"title": "T1", "dueDate": "2026-10-01"}],
  "vendors": [{"name": "V1", "category": "decoration", "estimatedCost": 1000}],
  "recommendations": [{"category": "C", "title": "T", "description": "D"}],
  "risks": [{"risk": "R", "impact": "low", "mitigation": "M"}]
}
\`\`\``;
      const plan = AIResponseValidator.validateEventPlan(markdown);
      expect(plan.summary).toBe("Plan");
    });

    it("throws clear error when text is not JSON", () => {
      expect(() => AIResponseValidator.validateEventPlan("I cannot fulfill this request.")).toThrow(
        "Failed to parse AI response as JSON."
      );
    });

    it("throws clear error when schema validation fails", () => {
      const invalidSchema = JSON.stringify({
        summary: "", // min(1) violation
        estimatedBudget: [],
      });
      expect(() => AIResponseValidator.validateEventPlan(invalidSchema)).toThrow(
        "AI plan schema validation failed"
      );
    });
  });

  describe("validateBudgetAnalysis", () => {
    it("validates compliant budget analysis", () => {
      const json = JSON.stringify({
        summary: "Healthy budget",
        healthScore: 85,
        overspendingRisk: false,
        underallocatedCategories: ["Contingency"],
        potentialSavings: [{ category: "Decor", tip: "DIY", estimatedSavings: 5000 }],
        redistributionSuggestions: [{ category: "Decor", currentAllocation: 20000, suggestedAllocation: 15000, reason: "Too high" }],
      });
      const res = AIResponseValidator.validateBudgetAnalysis(json);
      expect(res.healthScore).toBe(85);
    });

    it("throws on non-JSON and invalid schema", () => {
      expect(() => AIResponseValidator.validateBudgetAnalysis("bad")).toThrow("Failed to parse budget analysis");
      expect(() => AIResponseValidator.validateBudgetAnalysis(JSON.stringify({ summary: "" }))).toThrow("Budget analysis schema validation failed");
    });
  });

  describe("validateTimeline", () => {
    it("validates timeline tasks array", () => {
      const json = JSON.stringify([
        { title: "Task 1", dueDate: "2026-10-01", status: "not_started", priority: "medium" },
      ]);
      const tasks = AIResponseValidator.validateTimeline(json);
      expect(tasks.length).toBe(1);
    });

    it("throws on non-JSON and invalid schema", () => {
      expect(() => AIResponseValidator.validateTimeline("bad")).toThrow("Failed to parse timeline response");
      expect(() => AIResponseValidator.validateTimeline(JSON.stringify([{ title: "" }]))).toThrow("Timeline schema validation failed");
    });
  });

  describe("validateVendors", () => {
    it("validates vendors array", () => {
      const json = JSON.stringify([
        { name: "Venue Pro", category: "venue", status: "not_contacted", estimatedCost: 10000 },
      ]);
      const vendors = AIResponseValidator.validateVendors(json);
      expect(vendors.length).toBe(1);
    });

    it("throws on non-JSON and invalid schema", () => {
      expect(() => AIResponseValidator.validateVendors("bad")).toThrow("Failed to parse vendors response");
      expect(() => AIResponseValidator.validateVendors(JSON.stringify([{ name: "", category: "unknown" }]))).toThrow("Vendors schema validation failed");
    });
  });

  describe("validateIdeas", () => {
    it("validates ideas plan", () => {
      const json = JSON.stringify({
        summary: "Creative ideas",
        themes: ["Theme A"],
        activities: ["Act A"],
        decorationIdeas: ["Dec A"],
        foodIdeas: ["Food A"],
        entertainment: ["DJ"],
        guestExperiences: ["Exp A"],
      });
      const ideas = AIResponseValidator.validateIdeas(json);
      expect(ideas.themes[0]).toBe("Theme A");
    });

    it("throws on non-JSON and invalid schema", () => {
      expect(() => AIResponseValidator.validateIdeas("bad")).toThrow("Failed to parse ideas response");
      expect(() => AIResponseValidator.validateIdeas(JSON.stringify({ summary: "" }))).toThrow("Ideas schema validation failed");
    });
  });

  describe("validateRisks", () => {
    it("validates risks plan", () => {
      const json = JSON.stringify({
        summary: "Risks overview",
        risks: [{ risk: "Delay", impact: "medium", mitigation: "Buffer time" }],
      });
      const risks = AIResponseValidator.validateRisks(json);
      expect(risks.risks.length).toBe(1);
    });

    it("throws on non-JSON and invalid schema", () => {
      expect(() => AIResponseValidator.validateRisks("bad")).toThrow("Failed to parse risks response");
      expect(() => AIResponseValidator.validateRisks(JSON.stringify({ summary: "" }))).toThrow("Risk analysis schema validation failed");
    });
  });
});
