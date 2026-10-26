import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "./Select";

describe("Select component", () => {
  const options = [
    { value: "wedding", label: "Wedding" },
    { value: "birthday", label: "Birthday" },
  ];

  it("renders with options, label and helper text", () => {
    render(
      <Select
        label="Event Type"
        options={options}
        helperText="Choose the best match"
      />
    );

    expect(screen.getByLabelText(/event type/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /wedding/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /birthday/i })).toBeInTheDocument();
    expect(screen.getByText(/choose the best match/i)).toBeInTheDocument();
  });

  it("handles selection change", async () => {
    const user = userEvent.setup();
    render(<Select label="Type" options={options} defaultValue="wedding" />);

    const select = screen.getByLabelText(/type/i);
    await user.selectOptions(select, "birthday");
    expect(select).toHaveValue("birthday");
  });

  it("renders error state with aria-invalid", () => {
    render(<Select label="Type" options={options} error="Selection required" />);
    const select = screen.getByLabelText(/type/i);
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(/selection required/i)).toBeInTheDocument();
  });

  it("handles explicit id and select without label", () => {
    render(<Select id="explicit-select" options={options} aria-label="Explicit" />);
    const select = screen.getByRole("combobox", { name: "Explicit" });
    expect(select).toHaveAttribute("id", "explicit-select");

    render(<Select options={options} aria-label="Plain" />);
    const plain = screen.getByRole("combobox", { name: "Plain" });
    expect(plain).not.toHaveAttribute("id");
  });
});
