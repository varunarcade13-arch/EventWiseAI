import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button component", () => {
  it("renders with text, left and right icons", () => {
    render(
      <Button
        leftIcon={<span data-testid="left">L</span>}
        rightIcon={<span data-testid="right">R</span>}
      >
        Click Me
      </Button>
    );

    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
    expect(screen.getByTestId("left")).toBeInTheDocument();
    expect(screen.getByTestId("right")).toBeInTheDocument();
  });

  it("handles user click events", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);

    await user.click(screen.getByRole("button", { name: /submit/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders loading spinner and disables button when isLoading is true", () => {
    render(<Button isLoading>Save</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("renders across different variants and sizes", () => {
    const { rerender } = render(<Button variant="primary" size="sm">Primary</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-brand-600");

    rerender(<Button variant="secondary" size="md">Secondary</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-slate-100");

    rerender(<Button variant="outline" size="lg">Outline</Button>);
    expect(screen.getByRole("button")).toHaveClass("border-slate-300");

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole("button")).toHaveClass("text-slate-700");

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-rose-600");

    rerender(<Button variant="ai">AI</Button>);
    expect(screen.getByRole("button")).toHaveClass("from-brand-600");
  });
});
