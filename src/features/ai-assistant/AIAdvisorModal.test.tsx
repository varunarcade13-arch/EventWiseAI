import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AIAdvisorModal } from "./AIAdvisorModal";

describe("AIAdvisorModal component", () => {
  it("renders budget analysis view with savings and redistribution", () => {
    render(
      <AIAdvisorModal
        type="budget"
        isOpen={true}
        onClose={() => {}}
        currency="INR"
        budgetAnalysis={{
          summary: "Great budget distribution",
          healthScore: 92,
          overspendingRisk: false,
          underallocatedCategories: ["Decor"],
          potentialSavings: [
            { category: "Floral", tip: "Use seasonal flowers", estimatedSavings: 15000 },
          ],
          redistributionSuggestions: [
            {
              category: "Decor",
              currentAllocation: 50000,
              suggestedAllocation: 65000,
              reason: "Mandap requirements",
            },
          ],
        }}
      />
    );

    expect(screen.getByText("AI Budget Advisor")).toBeInTheDocument();
    expect(screen.getByText("92/100")).toBeInTheDocument();
    expect(screen.getByText("Great budget distribution")).toBeInTheDocument();
    expect(screen.getByText("Use seasonal flowers")).toBeInTheDocument();
    expect(screen.getByText("Mandap requirements")).toBeInTheDocument();
  });

  it("renders ideas view with themes, activities, and food", () => {
    render(
      <AIAdvisorModal
        type="ideas"
        isOpen={true}
        onClose={() => {}}
        ideasPlan={{
          summary: "Enchanted Garden Wedding",
          themes: ["Pastel Twilight", "Vintage Romance"],
          activities: ["Interactive photo booth"],
          decorationIdeas: ["Fairy lights canopy"],
          foodIdeas: ["Artisan mocktail bar"],
          entertainment: ["Acoustic duo"],
          guestExperiences: ["Personalized welcome notes"],
        }}
      />
    );

    expect(screen.getByText("AI Creative Ideation")).toBeInTheDocument();
    expect(screen.getByText("Enchanted Garden Wedding")).toBeInTheDocument();
    expect(screen.getByText("Pastel Twilight")).toBeInTheDocument();
    expect(screen.getByText("Interactive photo booth")).toBeInTheDocument();
    expect(screen.getByText("Artisan mocktail bar")).toBeInTheDocument();
  });

  it("renders risks view and calls onApplyRisks", async () => {
    const user = userEvent.setup();
    const handleApply = vi.fn().mockResolvedValue(undefined);

    render(
      <AIAdvisorModal
        type="risks"
        isOpen={true}
        onClose={() => {}}
        riskAnalysis={{
          summary: "Identified 2 planning risks",
          risks: [
            {
              risk: "Rain during outdoor ceremony",
              impact: "high",
              mitigation: "Backup hall reserved",
            },
            {
              risk: "Noise complaint",
              impact: "medium",
              mitigation: "Acoustic baffles and permit",
            },
            {
              risk: "Parking congestion",
              impact: "low",
              mitigation: "Valet attendants",
            },
          ],
        }}
        onApplyRisks={handleApply}
      />
    );

    expect(screen.getByText("AI Risk & Contingency Advisor")).toBeInTheDocument();
    expect(screen.getByText("Rain during outdoor ceremony")).toBeInTheDocument();
    expect(screen.getByText("HIGH IMPACT")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /save contingency plan to event/i })
    );
    expect(handleApply).toHaveBeenCalledTimes(1);
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <AIAdvisorModal type="budget" isOpen={false} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });
});
