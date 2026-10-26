import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./Input";

describe("Input component", () => {
  it("renders with label, placeholder, and helper text", () => {
    render(
      <Input
        label="Event Name"
        placeholder="Enter event name"
        helperText="Keep it short and descriptive"
      />
    );

    expect(screen.getByLabelText(/event name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter event name/i)).toBeInTheDocument();
    expect(screen.getByText(/keep it short and descriptive/i)).toBeInTheDocument();
  });

  it("handles text typing", async () => {
    const user = userEvent.setup();
    render(<Input label="Location" />);
    const input = screen.getByLabelText(/location/i);

    await user.type(input, "Goa Beach");
    expect(input).toHaveValue("Goa Beach");
  });

  it("renders error state with aria-invalid", () => {
    render(<Input label="Guests" error="Invalid guest count" />);
    const input = screen.getByLabelText(/guests/i);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(/invalid guest count/i)).toBeInTheDocument();
  });

  it("handles custom id and input without label", () => {
    render(<Input id="explicit-id" placeholder="Explicit ID input" />);
    const input = screen.getByPlaceholderText("Explicit ID input");
    expect(input).toHaveAttribute("id", "explicit-id");

    render(<Input placeholder="Completely plain" />);
    const plain = screen.getByPlaceholderText("Completely plain");
    expect(plain).not.toHaveAttribute("id");
  });
});
