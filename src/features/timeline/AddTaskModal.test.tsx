import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddTaskModal } from "./AddTaskModal";

describe("AddTaskModal component", () => {
  it("renders form, fills inputs, and submits successfully", async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <AddTaskModal
        isOpen={true}
        onClose={handleClose}
        defaultDate="2027-02-15"
        onAdd={handleAdd}
      />
    );

    const titleInput = screen.getByLabelText(/task title/i);
    await user.type(titleInput, "Confirm sound system");

    const prioritySelect = screen.getByLabelText(/priority/i);
    await user.selectOptions(prioritySelect, "high");

    const categoryInput = screen.getByLabelText(/category/i);
    await user.clear(categoryInput);
    await user.type(categoryInput, "Audio");

    const assignedInput = screen.getByLabelText(/assigned to/i);
    await user.type(assignedInput, "DJ Dave");

    await user.click(screen.getByRole("button", { name: /add task/i }));
    expect(handleAdd).toHaveBeenCalledWith({
      title: "Confirm sound system",
      dueDate: "2027-02-15",
      priority: "high",
      category: "Audio",
      assignedTo: "DJ Dave",
      status: "not_started",
    });
  });

  it("shows error when task title is missing", async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn();

    render(
      <AddTaskModal
        isOpen={true}
        onClose={() => {}}
        onAdd={handleAdd}
      />
    );

    await user.click(screen.getByRole("button", { name: /add task/i }));
    expect(handleAdd).not.toHaveBeenCalled();
    expect(screen.getByText("Task title is required.")).toBeInTheDocument();
  });

  it("shows error when due date is missing", async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn();

    render(
      <AddTaskModal
        isOpen={true}
        onClose={() => {}}
        onAdd={handleAdd}
      />
    );

    await user.type(screen.getByLabelText(/task title/i), "Some title");
    await user.click(screen.getByRole("button", { name: /add task/i }));
    expect(handleAdd).not.toHaveBeenCalled();
    expect(screen.getByText("Due date is required.")).toBeInTheDocument();
  });

  it("handles handleAdd rejection with Error and string", async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn().mockRejectedValueOnce(new Error("Timeout saving"));

    render(
      <AddTaskModal
        isOpen={true}
        onClose={() => {}}
        defaultDate="2027-01-01"
        onAdd={handleAdd}
      />
    );

    await user.type(screen.getByLabelText(/task title/i), "Book Band");
    await user.click(screen.getByRole("button", { name: /add task/i }));
    expect(screen.getByText("Timeout saving")).toBeInTheDocument();

    handleAdd.mockRejectedValueOnce("Failed string");
    await user.click(screen.getByRole("button", { name: /add task/i }));
    expect(screen.getByText("Failed to add task")).toBeInTheDocument();
  });

  it("changes due date and falls back to General category when empty without defaultDate", async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <AddTaskModal
        isOpen={true}
        onClose={handleClose}
        onAdd={handleAdd}
      />
    );

    await user.type(screen.getByLabelText(/task title/i), "Book Lighting");
    const dateInput = screen.getByLabelText(/due date/i);
    await user.type(dateInput, "2027-05-20");

    await user.clear(screen.getByLabelText(/category/i));
    await user.click(screen.getByRole("button", { name: /add task/i }));

    expect(handleAdd).toHaveBeenCalledWith({
      title: "Book Lighting",
      dueDate: "2027-05-20",
      status: "not_started",
      priority: "medium",
      category: "General",
      assignedTo: "",
    });
    expect(handleClose).toHaveBeenCalled();
  });

  it("prevents double submission when already submitting", async () => {
    const user = userEvent.setup();
    let resolveAdd: () => void;
    const handleAdd = vi.fn().mockImplementation(() => new Promise<void>((resolve) => { resolveAdd = resolve; }));

    render(
      <AddTaskModal
        isOpen={true}
        onClose={vi.fn()}
        defaultDate="2027-01-01"
        onAdd={handleAdd}
      />
    );

    await user.type(screen.getByLabelText(/task title/i), "Book Venue");
    const saveButton = screen.getByRole("button", { name: /add task/i });
    await user.click(saveButton);

    const form = screen.getByRole("dialog").querySelector("form")!;
    fireEvent.submit(form);

    expect(handleAdd).toHaveBeenCalledTimes(1);
    resolveAdd!();
  });
});

