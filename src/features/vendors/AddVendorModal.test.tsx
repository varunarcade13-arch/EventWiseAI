import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddVendorModal } from "./AddVendorModal";

describe("AddVendorModal component", () => {
  it("renders form, fills fields, and submits successfully", async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <AddVendorModal
        isOpen={true}
        onClose={handleClose}
        currency="INR"
        onAdd={handleAdd}
      />
    );

    const nameInput = screen.getByLabelText(/vendor \/ business name/i);
    await user.type(nameInput, "Spice Symphony");

    const costInput = screen.getByLabelText(/estimated cost \(inr\)/i);
    await user.type(costInput, "300000");

    const categorySelect = screen.getByLabelText(/category/i);
    await user.selectOptions(categorySelect, "catering");

    const statusSelect = screen.getByLabelText(/status/i);
    await user.selectOptions(statusSelect, "contacted");

    const contactInput = screen.getByLabelText(/contact person/i);
    await user.type(contactInput, "Chef Rahul");

    const phoneInput = screen.getByLabelText(/phone/i);
    await user.type(phoneInput, "9876543210");

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, "chef@spice.com");

    const notesInput = screen.getByLabelText(/contract deliverables/i);
    await user.type(notesInput, "Menu customized");

    await user.click(screen.getByRole("button", { name: /save vendor/i }));
    expect(handleAdd).toHaveBeenCalledWith({
      name: "Spice Symphony",
      category: "catering",
      status: "contacted",
      estimatedCost: 300000,
      actualCost: undefined,
      contactPerson: "Chef Rahul",
      phone: "9876543210",
      email: "chef@spice.com",
      notes: "Menu customized",
    });
  });

  it("shows error when vendor name is missing", async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn();

    render(
      <AddVendorModal
        isOpen={true}
        onClose={() => {}}
        currency="INR"
        onAdd={handleAdd}
      />
    );

    await user.click(screen.getByRole("button", { name: /save vendor/i }));
    expect(handleAdd).not.toHaveBeenCalled();
    expect(screen.getByText("Vendor name is required.")).toBeInTheDocument();
  });

  it("submits with actualCost and handles rejection with Error and non-Error", async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn().mockRejectedValueOnce(new Error("Vendor error"));

    render(
      <AddVendorModal
        isOpen={true}
        onClose={() => {}}
        currency="INR"
        onAdd={handleAdd}
      />
    );

    await user.type(screen.getByLabelText(/vendor \/ business name/i), "Studio 9");
    await user.type(screen.getByLabelText(/estimated cost \(inr\)/i), "50000");
    await user.type(screen.getByLabelText(/final \/ actual cost \(inr\)/i), "48000");

    await user.click(screen.getByRole("button", { name: /save vendor/i }));
    expect(screen.getByText("Vendor error")).toBeInTheDocument();

    handleAdd.mockRejectedValueOnce("Unknown");
    await user.click(screen.getByRole("button", { name: /save vendor/i }));
    expect(screen.getByText("Failed to add vendor")).toBeInTheDocument();
  });

  it("handles empty estimatedCost and zero actualCost successfully", async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <AddVendorModal
        isOpen={true}
        onClose={handleClose}
        currency="INR"
        onAdd={handleAdd}
      />
    );

    await user.type(screen.getByLabelText(/vendor \/ business name/i), "Decor Pro");
    // Leave estimatedCost empty
    const actualCostInput = screen.getByLabelText(/final \/ actual cost \(inr\)/i);
    await user.type(actualCostInput, "0");

    await user.click(screen.getByRole("button", { name: /save vendor/i }));

    expect(handleAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Decor Pro",
        estimatedCost: 0,
        actualCost: 0,
      })
    );
    expect(handleClose).toHaveBeenCalled();
  });

  it("prevents double submission when already submitting", async () => {
    const user = userEvent.setup();
    let resolveAdd: () => void;
    const handleAdd = vi.fn().mockImplementation(() => new Promise<void>((resolve) => { resolveAdd = resolve; }));

    render(
      <AddVendorModal
        isOpen={true}
        onClose={vi.fn()}
        currency="INR"
        onAdd={handleAdd}
      />
    );

    await user.type(screen.getByLabelText(/vendor \/ business name/i), "Catering Co");
    const saveButton = screen.getByRole("button", { name: /save vendor/i });
    await user.click(saveButton);

    const form = screen.getByRole("dialog").querySelector("form")!;
    fireEvent.submit(form);

    expect(handleAdd).toHaveBeenCalledTimes(1);
    resolveAdd!();
  });
});

