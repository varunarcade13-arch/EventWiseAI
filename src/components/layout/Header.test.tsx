import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "./Header";
import { EventModel } from "@/types/event";

describe("Header component", () => {
  const events: EventModel[] = [
    {
      id: "e1",
      name: "Sarah's Wedding",
      type: "wedding",
      date: "2027-01-01",
      location: "Palace",
      expectedGuests: 150,
      currency: "INR",
      totalBudget: 1000000,
      budgetCategories: [],
      timeline: [],
      vendors: [],
      recommendations: [],
      risks: [],
      isDemo: true,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    {
      id: "e2",
      name: "Birthday Party",
      type: "birthday",
      date: "2026-10-10",
      location: "Home",
      expectedGuests: 20,
      currency: "INR",
      totalBudget: 50000,
      budgetCategories: [],
      timeline: [],
      vendors: [],
      recommendations: [],
      risks: [],
      isDemo: false,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ];

  it("renders branding, event selector, and triggers button actions", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    const handleCreate = vi.fn();
    const handleAI = vi.fn();
    const handleReset = vi.fn();

    render(
      <Header
        events={events}
        activeEvent={events[0] || null}
        onSelectEvent={handleSelect}
        onCreateEventClick={handleCreate}
        onToggleAIChat={handleAI}
        onResetDemo={handleReset}
      />
    );

    expect(screen.getByText("EventWise")).toBeInTheDocument();

    // Event select change
    const select = screen.getByLabelText(/select active event/i);
    await user.selectOptions(select, "e2");
    expect(handleSelect).toHaveBeenCalledWith("e2");

    // Click new event
    await user.click(screen.getByRole("button", { name: /new event/i }));
    expect(handleCreate).toHaveBeenCalledTimes(1);

    // Click ask AI
    await user.click(screen.getByRole("button", { name: /ask ai/i }));
    expect(handleAI).toHaveBeenCalledTimes(1);

    // Click reset demo
    await user.click(screen.getByRole("button", { name: /reset demo/i }));
    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it("handles null activeEvent and empty events array", () => {
    const { rerender } = render(
      <Header
        events={[]}
        activeEvent={null}
        onSelectEvent={vi.fn()}
        onCreateEventClick={vi.fn()}
        onToggleAIChat={vi.fn()}
        onResetDemo={vi.fn()}
      />
    );
    expect(screen.queryByLabelText(/select active event/i)).not.toBeInTheDocument();

    rerender(
      <Header
        events={events}
        activeEvent={null}
        onSelectEvent={vi.fn()}
        onCreateEventClick={vi.fn()}
        onToggleAIChat={vi.fn()}
        onResetDemo={vi.fn()}
      />
    );
    const select = screen.getByLabelText(/select active event/i) as HTMLSelectElement;
    expect(select).toBeInTheDocument();
  });

  it("handles theme toggle in light mode and dark mode", async () => {
    const user = userEvent.setup();
    const handleToggleTheme = vi.fn();

    // Light mode (default) -> button allows switching to dark mode
    const { rerender } = render(
      <Header
        events={events}
        activeEvent={events[0] || null}
        onSelectEvent={vi.fn()}
        onCreateEventClick={vi.fn()}
        onToggleAIChat={vi.fn()}
        onResetDemo={vi.fn()}
        isDarkMode={false}
        onToggleTheme={handleToggleTheme}
      />
    );

    const darkToggle = screen.getByRole("button", { name: /switch to dark mode/i });
    expect(darkToggle).toBeInTheDocument();
    await user.click(darkToggle);
    expect(handleToggleTheme).toHaveBeenCalledTimes(1);

    // Dark mode -> button allows switching to light mode
    rerender(
      <Header
        events={events}
        activeEvent={events[0] || null}
        onSelectEvent={vi.fn()}
        onCreateEventClick={vi.fn()}
        onToggleAIChat={vi.fn()}
        onResetDemo={vi.fn()}
        isDarkMode={true}
        onToggleTheme={handleToggleTheme}
      />
    );

    const lightToggle = screen.getByRole("button", { name: /switch to light mode/i });
    expect(lightToggle).toBeInTheDocument();
    await user.click(lightToggle);
    expect(handleToggleTheme).toHaveBeenCalledTimes(2);

    // When onToggleTheme is not provided, button is omitted
    rerender(
      <Header
        events={events}
        activeEvent={events[0] || null}
        onSelectEvent={vi.fn()}
        onCreateEventClick={vi.fn()}
        onToggleAIChat={vi.fn()}
        onResetDemo={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: /switch to/i })).not.toBeInTheDocument();
  });
});
