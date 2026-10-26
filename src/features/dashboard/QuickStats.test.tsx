import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuickStats } from "./QuickStats";
import { EventModel, PlanningProgress } from "@/types/event";

describe("QuickStats component", () => {
  const sampleEvent: EventModel = {
    id: "e1",
    name: "Wedding",
    type: "wedding",
    date: "2027-02-15",
    location: "Hall",
    expectedGuests: 180,
    currency: "INR",
    totalBudget: 1200000,
    budgetCategories: [],
    timeline: [],
    vendors: [],
    recommendations: [],
    risks: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };

  const progress: PlanningProgress = {
    overallPercentage: 65,
    tasksCompleted: 4,
    totalTasks: 6,
    vendorsBooked: 2,
    totalVendors: 4,
    budgetAllocatedPercentage: 80,
    daysRemaining: 120,
  };

  it("renders all four stat metrics accurately", () => {
    render(<QuickStats event={sampleEvent} progress={progress} />);

    expect(screen.getByText(/120 days left/i)).toBeInTheDocument();
    expect(screen.getByText(/12,00,000/i)).toBeInTheDocument();
    expect(screen.getByText("180 Guests")).toBeInTheDocument();
    expect(screen.getByText("65% Done")).toBeInTheDocument();
    expect(screen.getByText(/4\/6 tasks • 2\/4 vendors/i)).toBeInTheDocument();
  });
});
