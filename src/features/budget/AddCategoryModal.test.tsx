import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddCategoryModal } from "./AddCategoryModal";

describe("AddCategoryModal component", () => {
  it("renders inputs and handles submission", async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <AddCategoryModal
        isOpen={true}
        onClose={handleClose}
        currency="INR"
        onAdd={handleAdd}
      />
    );

    const nameInput = screen.getByLabelText(/category name/i);
    await user.type(nameInput, "Catering Buffet");

    const allocatedInput = screen.getByLabelText(/allocated \(inr\)/i);
    await user.type(allocatedInput, "250000");

    const actualInput = screen.getByLabelText(/actual spent \(inr\)/i);
    await user.type(actualInput, "50000");

    const notesInput = screen.getByLabelText(/notes \/ vendor deliverable/i);
    await user.type(notesInput, "Advance paid");

    await user.click(screen.getByRole("button", { name: /save category/i }));
    expect(handleAdd).toHaveBeenCalledWith({
      name: "Catering Buffet",
      allocated: 250000,
      actual: 50000,
      notes: "Advance paid",
    });
  });

  it("shows error when category name is missing", async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn();

    render(
      <AddCategoryModal
        isOpen={true}
        onClose={() => {}}
        currency="INR"
        onAdd={handleAdd}
      />
    );

    await user.click(screen.getByRole("button", { name: /save category/i }));
    expect(handleAdd).not.toHaveBeenCalled();
    expect(screen.getByText("Category name is required.")).toBeInTheDocument();
  });

  it("handles submission failure from onAdd rejection", async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn().mockRejectedValueOnce(new Error("Network failed"));

    render(
      <AddCategoryModal
        isOpen={true}
        onClose={() => {}}
        currency="INR"
        onAdd={handleAdd}
      />
    );

    await user.type(screen.getByLabelText(/category name/i), "Decor");
    await user.click(screen.getByRole("button", { name: /save category/i }));
    expect(screen.getByText("Network failed")).toBeInTheDocument();

    // Rejection with non-Error
    handleAdd.mockRejectedValueOnce("String error");
    await user.click(screen.getByRole("button", { name: /save category/i }));
    expect(screen.getByText("Failed to add category")).toBeInTheDocument();
  });

  it("prevents double submission when already submitting", async () => {
    const user = userEvent.setup();
    let resolveAdd: () => void;
    const handleAdd = vi.fn().mockImplementation(() => new Promise<void>((resolve) => { resolveAdd = resolve; }));

    render(
      <AddCategoryModal
        isOpen={true}
        onClose={vi.fn()}
        currency="INR"
        onAdd={handleAdd}
      />
    );

    await user.type(screen.getByLabelText(/category name/i), "Decor");
    const saveButton = screen.getByRole("button", { name: /save category/i });
    await user.click(saveButton);

    const form = screen.getByRole("dialog").querySelector("form")!;
    fireEvent.submit(form);

    expect(handleAdd).toHaveBeenCalledTimes(1);
    resolveAdd!();
  });
});

