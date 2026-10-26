import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventCard } from "./EventCard";
import { EventModel } from "@/types/event";

describe("EventCard component", () => {
  const sampleEvent: EventModel = {
    id: "e1",
    name: "Summer Wedding",
    type: "wedding",
    date: "2027-02-15",
    location: "Grand Ballroom",
    expectedGuests: 200,
    currency: "INR",
    totalBudget: 1500000,
    budgetCategories: [],
    timeline: [],
    vendors: [],
    recommendations: [],
    risks: [],
    isDemo: true,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };

  it("renders event details and handles click selection", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(<EventCard event={sampleEvent} isActive={false} onSelect={handleSelect} />);

    expect(screen.getByText("Summer Wedding")).toBeInTheDocument();
    expect(screen.getByText(/200 guests/i)).toBeInTheDocument();
    expect(screen.getByText("Grand Ballroom")).toBeInTheDocument();
    expect(screen.getByText("Demo")).toBeInTheDocument();

    await user.click(screen.getByRole("button"));
    expect(handleSelect).toHaveBeenCalledWith("e1");
  });

  it("supports keyboard Enter and Space keys to select", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(<EventCard event={sampleEvent} isActive={true} onSelect={handleSelect} />);
    const card = screen.getByRole("button");
    card.focus();

    await user.keyboard("{Enter}");
    expect(handleSelect).toHaveBeenCalledWith("e1");

    await user.keyboard(" ");
    expect(handleSelect).toHaveBeenCalledTimes(2);
  });

  it("handles unknown event type and non-demo event", () => {
    const customEvent: EventModel = {
      ...sampleEvent,
      type: "gala" as unknown as import("@/types/event").EventType,
      isDemo: false,
    };
    render(<EventCard event={customEvent} isActive={false} onSelect={vi.fn()} />);
    expect(screen.queryByText("Demo")).not.toBeInTheDocument();
    expect(screen.getByText("GALA")).toBeInTheDocument();
  });
});
