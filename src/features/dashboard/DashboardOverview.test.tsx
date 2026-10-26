import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardOverview } from "./DashboardOverview";
import { EventModel, PlanningProgress } from "@/types/event";

describe("DashboardOverview component", () => {
  const sampleEvent: EventModel = {
    id: "e1",
    name: "Wedding",
    type: "wedding",
    date: "2027-02-15",
    location: "Hall",
    expectedGuests: 150,
    currency: "INR",
    totalBudget: 1000000,
    budgetCategories: [
      { id: "c1", name: "Venue", allocated: 500000, actual: 480000 },
    ],
    timeline: [
      { id: "t1", title: "Book Hall", dueDate: "2026-06-01", status: "completed", priority: "high" },
      { id: "t2", title: "Taste Menu", dueDate: "2026-08-01", status: "not_started", priority: "medium" },
    ],
    vendors: [],
    recommendations: [
      { id: "r1", category: "Budget", title: "Early Bird", description: "Save 10%", estimatedSavingsOrCost: "Save ₹25,000" },
    ],
    risks: [
      { id: "rk1", risk: "Rain", impact: "high", mitigation: "Waterproof tents" },
    ],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };

  const progress: PlanningProgress = {
    overallPercentage: 50,
    tasksCompleted: 1,
    totalTasks: 2,
    vendorsBooked: 0,
    totalVendors: 0,
    budgetAllocatedPercentage: 50,
    daysRemaining: 150,
  };

  it("renders quick stats, AI hero banner, upcoming tasks, recommendations, and risks", async () => {
    const user = userEvent.setup();
    const handleTab = vi.fn();
    const handlePlan = vi.fn();
    const handleIdeas = vi.fn();
    const handleRisks = vi.fn();

    render(
      <DashboardOverview
        event={sampleEvent}
        progress={progress}
        onNavigateTab={handleTab}
        onTriggerAIPlan={handlePlan}
        onTriggerAIIdeas={handleIdeas}
        onTriggerAIRisks={handleRisks}
      />
    );

    expect(screen.getByText("Elevate \"Wedding\" with AI")).toBeInTheDocument();
    expect(screen.getByText("Taste Menu")).toBeInTheDocument();
    expect(screen.getByText("Early Bird")).toBeInTheDocument();
    expect(screen.getByText("Rain")).toBeInTheDocument();

    // Trigger AI Plan button
    await user.click(screen.getByRole("button", { name: /generate complete ai plan/i }));
    expect(handlePlan).toHaveBeenCalledTimes(1);

    // Trigger AI Ideas button
    await user.click(screen.getByRole("button", { name: /explore creative ideas/i }));
    expect(handleIdeas).toHaveBeenCalledTimes(1);

    // Trigger AI Risks button
    await user.click(screen.getByRole("button", { name: /check contingency risks/i }));
    expect(handleRisks).toHaveBeenCalledTimes(1);

    // View all tasks
    await user.click(screen.getByRole("button", { name: /view all \(2\)/i }));
    expect(handleTab).toHaveBeenCalledWith("timeline");

    // Manage budget
    await user.click(screen.getByRole("button", { name: /manage budget/i }));
    expect(handleTab).toHaveBeenCalledWith("budget");
  });

  it("renders empty tasks completion message when all tasks are complete", () => {
    const completeEvent = {
      ...sampleEvent,
      timeline: [
        { id: "t1", title: "Book Hall", dueDate: "2026-06-01", status: "completed" as const, priority: "high" as const },
      ],
      recommendations: [],
      risks: [],
    };

    render(
      <DashboardOverview
        event={completeEvent}
        progress={{ ...progress, tasksCompleted: 1 }}
        onNavigateTab={vi.fn()}
        onTriggerAIPlan={vi.fn()}
        onTriggerAIIdeas={vi.fn()}
        onTriggerAIRisks={vi.fn()}
      />
    );

    expect(screen.getByText(/all planned tasks are completed!/i)).toBeInTheDocument();
  });

  it("handles low/high priority tasks and medium/low impact risks", () => {
    const variedEvent: EventModel = {
      ...sampleEvent,
      timeline: [
        { id: "t1", title: "High Task", dueDate: "2026-06-01", status: "not_started", priority: "high" },
        { id: "t2", title: "Low Task", dueDate: "2026-07-01", status: "not_started", priority: "low" },
      ],
      recommendations: [
        { id: "r1", category: "General", title: "General Tip", description: "No cost info" },
      ],
      risks: [
        { id: "rk1", risk: "Medium Risk", impact: "medium", mitigation: "Mitigation A" },
        { id: "rk2", risk: "Low Risk", impact: "low", mitigation: "Mitigation B" },
      ],
    };

    render(
      <DashboardOverview
        event={variedEvent}
        progress={progress}
        onNavigateTab={vi.fn()}
        onTriggerAIPlan={vi.fn()}
        onTriggerAIIdeas={vi.fn()}
        onTriggerAIRisks={vi.fn()}
      />
    );

    expect(screen.getByText("High Task")).toBeInTheDocument();
    expect(screen.getByText("Low Task")).toBeInTheDocument();
    expect(screen.getByText("Medium Risk")).toBeInTheDocument();
    expect(screen.getByText("Low Risk")).toBeInTheDocument();
  });
});
