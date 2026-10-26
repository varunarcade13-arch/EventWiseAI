import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./Badge";

describe("Badge component", () => {
  it("renders with variant and size styles", () => {
    const { rerender } = render(<Badge variant="success">Completed</Badge>);
    expect(screen.getByText(/completed/i)).toHaveClass("bg-emerald-50");

    rerender(<Badge variant="warning" size="md">Pending</Badge>);
    expect(screen.getByText(/pending/i)).toHaveClass("bg-amber-50");

    rerender(<Badge variant="danger">High</Badge>);
    expect(screen.getByText(/high/i)).toHaveClass("bg-rose-50");

    rerender(<Badge variant="brand">Brand</Badge>);
    expect(screen.getByText(/brand/i)).toHaveClass("bg-brand-50");

    rerender(<Badge variant="purple">Wedding</Badge>);
    expect(screen.getByText(/wedding/i)).toHaveClass("bg-purple-50");

    rerender(<Badge variant="neutral">General</Badge>);
    expect(screen.getByText(/general/i)).toHaveClass("bg-slate-100");
  });
});
