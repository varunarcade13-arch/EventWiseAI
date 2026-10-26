import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs } from "./Tabs";

describe("Tabs component", () => {
  const tabs = [
    { id: "overview", label: "Overview", badge: 5 },
    { id: "budget", label: "Budget" },
    { id: "timeline", label: "Timeline" },
  ];

  it("renders tabs and handles mouse selection", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Tabs tabs={tabs} activeTab="overview" onChange={handleChange} />);

    expect(screen.getByRole("tablist")).toBeInTheDocument();
    const budgetTab = screen.getByRole("tab", { name: /budget/i });
    expect(budgetTab).toHaveAttribute("aria-selected", "false");

    await user.click(budgetTab);
    expect(handleChange).toHaveBeenCalledWith("budget");
  });

  it("supports keyboard arrow navigation across tabs", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Tabs tabs={tabs} activeTab="overview" onChange={handleChange} />);

    const overviewTab = screen.getByRole("tab", { name: /overview/i });
    overviewTab.focus();

    await user.keyboard("{ArrowRight}");
    expect(handleChange).toHaveBeenCalledWith("budget");

    await user.keyboard("{ArrowLeft}");
    expect(handleChange).toHaveBeenCalledWith("overview");

    await user.keyboard("{Home}");
    expect(handleChange).toHaveBeenCalledWith("overview");

    await user.keyboard("{End}");
    expect(handleChange).toHaveBeenCalledWith("timeline");

    // Other keypress does not navigate
    await user.keyboard("{Escape}");
    expect(handleChange).toHaveBeenCalledTimes(4);
  });

  it("renders badge on inactive tab", () => {
    render(<Tabs tabs={tabs} activeTab="budget" onChange={vi.fn()} />);
    const badge = screen.getByText("5");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-slate-200");
  });
});
