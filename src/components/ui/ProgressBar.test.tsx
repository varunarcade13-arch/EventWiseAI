import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar component", () => {
  it("renders with label and calculates clamped percentage", () => {
    render(<ProgressBar value={60} max={100} label="Tasks completed" />);

    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "60");
    expect(screen.getByText(/tasks completed/i)).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
  });

  it("handles out of bounds values and different colors", () => {
    const { rerender } = render(<ProgressBar value={150} color="emerald" size="lg" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");

    rerender(<ProgressBar value={-20} color="rose" size="sm" showPercentage={false} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    expect(screen.queryByText("%")).not.toBeInTheDocument();

    rerender(<ProgressBar value={50} color="amber" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
  });
});
