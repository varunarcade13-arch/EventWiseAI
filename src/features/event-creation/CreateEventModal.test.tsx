import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateEventModal } from "./CreateEventModal";
import { ToastProvider } from "@/components/ui/Toast";
import React from "react";

describe("CreateEventModal component", () => {
  it("renders form, fills inputs, and submits successfully", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <ToastProvider>
        <CreateEventModal
          isOpen={true}
          onClose={handleClose}
          onSubmit={handleSubmit}
        />
      </ToastProvider>
    );

    expect(screen.getByText("Create New Event")).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/event name/i);
    await user.type(nameInput, "Aarav Birthday Bash");

    const dateInput = screen.getByLabelText(/event date/i);
    await user.type(dateInput, "2026-11-20");

    const locInput = screen.getByLabelText(/location/i);
    await user.type(locInput, "FunZone Arena, Mumbai");

    const typeSelect = screen.getByLabelText(/event type/i);
    await user.selectOptions(typeSelect, "birthday");

    const guestsInput = screen.getByLabelText(/expected guests/i);
    await user.clear(guestsInput);
    await user.type(guestsInput, "80");

    const currencySelect = screen.getByLabelText(/currency/i);
    await user.selectOptions(currencySelect, "USD");

    const budgetInput = screen.getByLabelText(/total budget/i);
    await user.clear(budgetInput);
    await user.type(budgetInput, "50000");

    // Toggle AI plan
    const aiCheckbox = screen.getByRole("checkbox");
    await user.click(aiCheckbox);

    // Submit
    await user.click(screen.getByRole("button", { name: /create event/i }));
    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Aarav Birthday Bash",
        type: "birthday",
        location: "FunZone Arena, Mumbai",
        date: "2026-11-20",
        expectedGuests: 80,
        currency: "USD",
        totalBudget: 50000,
        autoGenerateAI: false,
      })
    );
  });

  it("shows validation error on empty submit", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(
      <ToastProvider>
        <CreateEventModal
          isOpen={true}
          onClose={() => {}}
          onSubmit={handleSubmit}
        />
      </ToastProvider>
    );

    // Click submit with empty name and date
    await user.click(screen.getByRole("button", { name: /create event/i }));
    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Event name is required.")).toBeInTheDocument();

    // Typing into field clears error
    await user.type(screen.getByLabelText(/event name/i), "Valid Name");
    expect(screen.queryByText("Event name is required.")).not.toBeInTheDocument();
  });

  it("handles onSubmit rejection with Error and non-Error", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockRejectedValueOnce(new Error("Server error"));

    render(
      <ToastProvider>
        <CreateEventModal
          isOpen={true}
          onClose={() => {}}
          onSubmit={handleSubmit}
        />
      </ToastProvider>
    );

    await user.type(screen.getByLabelText(/event name/i), "Annual Gala");
    await user.type(screen.getByLabelText(/event date/i), "2026-12-01");
    await user.type(screen.getByLabelText(/location/i), "City Center");

    await user.click(screen.getByRole("button", { name: /create event/i }));
    expect(screen.getByText("Server error")).toBeInTheDocument();

    // Non-error rejection
    handleSubmit.mockRejectedValueOnce("Unknown");
    await user.click(screen.getByRole("button", { name: /create event/i }));
    expect(screen.getByText("Failed to create event")).toBeInTheDocument();
  });

  it("shifts focus to respective field when date, location, guests, or budget fails validation", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(
      <ToastProvider>
        <CreateEventModal
          isOpen={true}
          onClose={() => {}}
          onSubmit={handleSubmit}
        />
      </ToastProvider>
    );

    const nameInput = screen.getByLabelText(/event name/i);
    const dateInput = screen.getByLabelText(/event date/i);
    const locInput = screen.getByLabelText(/location/i);
    const guestsInput = screen.getByLabelText(/expected guests/i);
    const budgetInput = screen.getByLabelText(/total budget/i);

    // 1. Missing date focuses dateInput
    await user.type(nameInput, "Party");
    await user.click(screen.getByRole("button", { name: /create event/i }));
    expect(document.activeElement).toBe(dateInput);

    // 2. Missing location focuses locationInput
    await user.type(dateInput, "2026-12-15");
    await user.click(screen.getByRole("button", { name: /create event/i }));
    expect(document.activeElement).toBe(locInput);

    // 3. Invalid guests focuses guestsInput
    await user.type(locInput, "Plaza");
    await user.clear(guestsInput);
    await user.type(guestsInput, "0");
    await user.click(screen.getByRole("button", { name: /create event/i }));
    expect(document.activeElement).toBe(guestsInput);

    // 4. Invalid budget focuses budgetInput
    await user.clear(guestsInput);
    await user.type(guestsInput, "50");
    await user.clear(budgetInput);
    await user.type(budgetInput, "-10");
    await user.click(screen.getByRole("button", { name: /create event/i }));
    expect(document.activeElement).toBe(budgetInput);
  });

  it("prevents double submission while submitting", async () => {
    const user = userEvent.setup();
    let resolveSubmit: () => void;
    const handleSubmit = vi.fn().mockImplementation(() => new Promise<void>((resolve) => { resolveSubmit = resolve; }));

    render(
      <ToastProvider>
        <CreateEventModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={handleSubmit}
        />
      </ToastProvider>
    );

    await user.type(screen.getByLabelText(/event name/i), "Annual Gala");
    await user.type(screen.getByLabelText(/event date/i), "2027-01-01");
    await user.type(screen.getByLabelText(/location/i), "Hotel");

    const submitBtn = screen.getByRole("button", { name: /create event/i });
    await user.click(submitBtn);

    const form = screen.getByRole("dialog").querySelector("form")!;
    fireEvent.submit(form);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    resolveSubmit!();
  });
});

