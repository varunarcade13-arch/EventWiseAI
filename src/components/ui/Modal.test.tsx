import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "./Modal";

describe("Modal component", () => {
  it("renders when isOpen is true and does not render when false", () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal" description="Modal desc">
        <p>Modal Body</p>
      </Modal>
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/test modal/i)).toBeInTheDocument();
    expect(screen.getByText(/modal desc/i)).toBeInTheDocument();
    expect(screen.getByText(/modal body/i)).toBeInTheDocument();

    rerender(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Modal Body</p>
      </Modal>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Body</p>
      </Modal>
    );

    await user.click(screen.getByLabelText(/close dialog/i));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on Escape key press", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Body</p>
      </Modal>
    );

    await user.keyboard("{Escape}");
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on backdrop click", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal" size="sm">
        <p>Body</p>
      </Modal>
    );

    const backdrop = screen.getByRole("dialog");
    await user.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
