import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BudgetManager } from "./BudgetManager";
import { EventModel } from "@/types/event";

describe("BudgetManager component", () => {
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
      { id: "c1", name: "Venue", allocated: 500000, actual: 480000, notes: "Advance paid" },
      { id: "c2", name: "Catering", allocated: 400000, actual: 390000 },
    ],
    timeline: [],
    vendors: [],
    recommendations: [],
    risks: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };

  it("renders metrics, breakdown, and category rows", async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn();
    const handleDelete = vi.fn();
    const handleAI = vi.fn();

    render(
      <BudgetManager
        event={sampleEvent}
        onAddCategory={handleAdd}
        onDeleteCategory={handleDelete}
        onTriggerAIAdvisor={handleAI}
      />
    );

    expect(screen.getByText("Total Target Budget")).toBeInTheDocument();
    expect(screen.getByText("Venue")).toBeInTheDocument();
    expect(screen.getByText("Catering")).toBeInTheDocument();

    // Trigger AI budget advisor
    await user.click(screen.getByRole("button", { name: /ai budget advisor/i }));
    expect(handleAI).toHaveBeenCalledTimes(1);

    // Delete category
    const deleteButtons = screen.getAllByLabelText(/delete .* category/i);
    await user.click(deleteButtons[0]!);
    expect(handleDelete).toHaveBeenCalledWith("c1");
  });

  it("renders empty state when there are no categories", async () => {
    const user = userEvent.setup();
    const emptyEvent = { ...sampleEvent, budgetCategories: [] };
    const handleAI = vi.fn();

    render(
      <BudgetManager
        event={emptyEvent}
        onAddCategory={vi.fn()}
        onDeleteCategory={vi.fn()}
        onTriggerAIAdvisor={handleAI}
      />
    );

    expect(screen.getByText(/no budget categories yet/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /generate budget with ai/i }));
    expect(handleAI).toHaveBeenCalledTimes(1);
  });

  it("displays warning banner when budget is exceeded", () => {
    const exceededEvent = {
      ...sampleEvent,
      totalBudget: 500000, // allocated is 900000, exceeding 500000
    };

    render(
      <BudgetManager
        event={exceededEvent}
        onAddCategory={vi.fn()}
        onDeleteCategory={vi.fn()}
        onTriggerAIAdvisor={vi.fn()}
      />
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/budget exceeded/i)).toBeInTheDocument();
  });

  it("handles overspending category variance and zero total allocation", async () => {
    const user = userEvent.setup();
    const overspentEvent: EventModel = {
      ...sampleEvent,
      budgetCategories: [
        { id: "c1", name: "Venue", allocated: 1000, actual: 2000 },
        { id: "c2", name: "Decor", allocated: 0, actual: 0 },
      ],
    };

    render(
      <BudgetManager
        event={overspentEvent}
        onAddCategory={vi.fn()}
        onDeleteCategory={vi.fn()}
        onTriggerAIAdvisor={vi.fn()}
      />
    );

    expect(screen.getByText(/over/i)).toBeInTheDocument();

    // Click "Add Category" button
    await user.click(screen.getByRole("button", { name: /add category/i }));
    expect(screen.getByText("Add Budget Category")).toBeInTheDocument();

    // Click Cancel in modal
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByText("Add Budget Category")).not.toBeInTheDocument();
  });

  it("opens add modal from empty state button", async () => {
    const user = userEvent.setup();
    const emptyEvent = { ...sampleEvent, budgetCategories: [] };

    render(
      <BudgetManager
        event={emptyEvent}
        onAddCategory={vi.fn()}
        onDeleteCategory={vi.fn()}
        onTriggerAIAdvisor={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /add first category/i }));
    expect(screen.getByText("Add Budget Category")).toBeInTheDocument();
  });

  it("handles zero total allocation with non-empty categories", () => {
    const zeroAllocatedEvent: EventModel = {
      ...sampleEvent,
      budgetCategories: [
        { id: "c1", name: "Venue", allocated: 0, actual: 0 },
      ],
    };

    render(
      <BudgetManager
        event={zeroAllocatedEvent}
        onAddCategory={vi.fn()}
        onDeleteCategory={vi.fn()}
        onTriggerAIAdvisor={vi.fn()}
      />
    );

    expect(screen.getByText("Venue")).toBeInTheDocument();
  });
});
