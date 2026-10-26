import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TimelineView } from "./TimelineView";
import { EventModel } from "@/types/event";

describe("TimelineView component", () => {
  const sampleEvent: EventModel = {
    id: "e1",
    name: "Wedding",
    type: "wedding",
    date: "2027-02-15",
    location: "Hall",
    expectedGuests: 150,
    currency: "INR",
    totalBudget: 1000000,
    budgetCategories: [],
    timeline: [
      { id: "t1", title: "Book Hall", dueDate: "2026-06-01", status: "completed", priority: "high" },
      { id: "t2", title: "Taste Menu", dueDate: "2026-08-01", status: "not_started", priority: "medium" },
      { id: "t3", title: "Order Cake", dueDate: "2026-09-01", status: "in_progress", priority: "low" },
    ],
    vendors: [],
    recommendations: [],
    risks: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };

  it("renders tasks, filters, and handles status cycling", async () => {
    const user = userEvent.setup();
    const handleStatus = vi.fn();
    const handleDelete = vi.fn();
    const handleAI = vi.fn();

    render(
      <TimelineView
        event={sampleEvent}
        onAddTask={vi.fn()}
        onUpdateTaskStatus={handleStatus}
        onDeleteTask={handleDelete}
        onTriggerAITimeline={handleAI}
      />
    );

    expect(screen.getByText("Milestone Timeline & Tasks")).toBeInTheDocument();
    expect(screen.getByText("Book Hall")).toBeInTheDocument();
    expect(screen.getByText("Taste Menu")).toBeInTheDocument();
    expect(screen.getByText("Order Cake")).toBeInTheDocument();

    // Filter by completed
    await user.click(screen.getByRole("button", { name: /completed \(1\)/i }));
    expect(screen.getByText("Book Hall")).toBeInTheDocument();
    expect(screen.queryByText("Taste Menu")).not.toBeInTheDocument();

    // Reset filter
    await user.click(screen.getByRole("button", { name: /all \(3\)/i }));

    // Cycle task status via toggle button: not_started -> in_progress
    const toggleBtn2 = screen.getByLabelText(/toggle status for task: taste menu/i);
    await user.click(toggleBtn2);
    expect(handleStatus).toHaveBeenCalledWith("t2", "in_progress");

    // Cycle task status via toggle button: in_progress -> completed
    const toggleBtn3 = screen.getByLabelText(/toggle status for task: order cake/i);
    await user.click(toggleBtn3);
    expect(handleStatus).toHaveBeenCalledWith("t3", "completed");

    // Cycle task status via toggle button: completed -> not_started
    const toggleBtn1 = screen.getByLabelText(/toggle status for task: book hall/i);
    await user.click(toggleBtn1);
    expect(handleStatus).toHaveBeenCalledWith("t1", "not_started");

    // Change status via dropdown
    const select = screen.getByLabelText(/update status for taste menu/i);
    await user.selectOptions(select, "completed");
    expect(handleStatus).toHaveBeenCalledWith("t2", "completed");

    // Click delete task
    const deleteBtn = screen.getByLabelText(/delete task taste menu/i);
    await user.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith("t2");

    // Trigger AI timeline
    await user.click(screen.getByRole("button", { name: /ai timeline generator/i }));
    expect(handleAI).toHaveBeenCalledTimes(1);
  });

  it("displays overdue tasks warning when tasks are overdue", () => {
    const overdueEvent: EventModel = {
      ...sampleEvent,
      timeline: [
        { id: "t1", title: "Overdue task 1", dueDate: "2020-01-01", status: "not_started", priority: "high" },
        { id: "t2", title: "Overdue task 2", dueDate: "2020-01-02", status: "in_progress", priority: "high" },
      ],
    };

    const { rerender } = render(
      <TimelineView
        event={overdueEvent}
        onAddTask={vi.fn()}
        onUpdateTaskStatus={vi.fn()}
        onDeleteTask={vi.fn()}
        onTriggerAITimeline={vi.fn()}
      />
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/2 tasks past their scheduled due date/i)).toBeInTheDocument();

    // Exactly 1 overdue task (singular "task")
    const singleOverdueEvent: EventModel = {
      ...sampleEvent,
      timeline: [
        { id: "t1", title: "Single overdue task", dueDate: "2020-01-01", status: "not_started", priority: "high" },
      ],
    };

    rerender(
      <TimelineView
        event={singleOverdueEvent}
        onAddTask={vi.fn()}
        onUpdateTaskStatus={vi.fn()}
        onDeleteTask={vi.fn()}
        onTriggerAITimeline={vi.fn()}
      />
    );
    expect(screen.getByText(/1 task past their scheduled due date/i)).toBeInTheDocument();
  });

  it("handles assignedTo, empty filter results, completed cycle, and modal open/close", async () => {
    const user = userEvent.setup();
    const handleStatus = vi.fn();
    const eventWithAssignee: EventModel = {
      ...sampleEvent,
      timeline: [
        {
          id: "t1",
          title: "Book Hall",
          dueDate: "2026-06-01",
          status: "completed",
          priority: "high",
          assignedTo: "Jane Doe",
          category: "Venue",
        },
      ],
    };

    render(
      <TimelineView
        event={eventWithAssignee}
        onAddTask={vi.fn()}
        onUpdateTaskStatus={handleStatus}
        onDeleteTask={vi.fn()}
        onTriggerAITimeline={vi.fn()}
      />
    );

    expect(screen.getByText(/assigned to: jane doe/i)).toBeInTheDocument();

    // Toggle completed task -> cycles to not_started
    const toggleBtn = screen.getByLabelText(/toggle status for task: book hall/i);
    await user.click(toggleBtn);
    expect(handleStatus).toHaveBeenCalledWith("t1", "not_started");

    // Filter by in_progress (0 tasks)
    await user.click(screen.getByRole("button", { name: /in progress \(0\)/i }));
    expect(screen.getByText(/no tasks found for this filter/i)).toBeInTheDocument();

    // Open add task modal
    await user.click(screen.getByRole("button", { name: /add task/i }));
    expect(screen.getByText("Add Milestone / Task")).toBeInTheDocument();

    // Cancel modal
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByText("Add Milestone / Task")).not.toBeInTheDocument();
  });

  it("handles completely empty timeline state and buttons", async () => {
    const user = userEvent.setup();
    const emptyEvent = { ...sampleEvent, timeline: [] };
    const handleAI = vi.fn();

    render(
      <TimelineView
        event={emptyEvent}
        onAddTask={vi.fn()}
        onUpdateTaskStatus={vi.fn()}
        onDeleteTask={vi.fn()}
        onTriggerAITimeline={handleAI}
      />
    );

    expect(screen.getByText("No tasks found for this filter.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /ai timeline generator/i }));
    expect(handleAI).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /add task/i }));
    expect(screen.getByText("Add Milestone / Task")).toBeInTheDocument();
  });
});
