import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardDescription } from "./Card";

describe("Card components", () => {
  it("renders with title and description", () => {
    render(
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Budget Health</CardTitle>
          <CardDescription>Overview of finances</CardDescription>
        </CardHeader>
        <p>Content Body</p>
      </Card>
    );

    expect(screen.getByText(/budget health/i)).toBeInTheDocument();
    expect(screen.getByText(/overview of finances/i)).toBeInTheDocument();
    expect(screen.getByText(/content body/i)).toBeInTheDocument();
  });

  it("renders across different variants", () => {
    const { container, rerender } = render(<Card variant="default">Def</Card>);
    expect(container.firstChild).toHaveClass("bg-white");

    rerender(<Card variant="gradient">Grad</Card>);
    expect(container.firstChild).toHaveClass("bg-gradient-to-br");

    rerender(<Card variant="outline">Out</Card>);
    expect(container.firstChild).toHaveClass("border-dashed");
  });
});
