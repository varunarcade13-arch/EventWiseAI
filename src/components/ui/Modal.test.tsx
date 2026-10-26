import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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

  it("traps focus inside modal with Tab and Shift+Tab keyboard cycling", async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={() => {}} title="Trap Modal">
        <input placeholder="First Input" />
        <button type="button">Second Button</button>
      </Modal>
    );

    const firstInput = screen.getByPlaceholderText("First Input");
    const secondButton = screen.getByRole("button", { name: "Second Button" });
    const closeBtn = screen.getByLabelText(/close dialog/i);

    // Initial focus on input
    expect(document.activeElement).toBe(firstInput);

    // Tab to next
    await user.tab();
    expect(document.activeElement).toBe(secondButton);

    // Tab to close button
    await user.tab();
    expect(document.activeElement).toBe(closeBtn);

    // Tab wraps back to first input
    await user.tab();
    expect(document.activeElement).toBe(firstInput);

    // Shift+Tab wraps back to last focusable (close button)
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(closeBtn);

    // Tab wraps from close button to first input
    await user.tab();
    expect(document.activeElement).toBe(firstInput);

    // Fire Shift+Tab when on first element (closeBtn in header) -> wraps to last (secondButton)
    closeBtn.focus();
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(secondButton);

    // Fire Tab when on last element (secondButton) -> wraps to first (closeBtn)
    secondButton.focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(closeBtn);

    // Focus outside modal and Tab / Shift+Tab
    document.body.focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(closeBtn);

    document.body.focus();
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(secondButton);
  });

  it("handles modal with no focusable child elements safely", async () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Plain Modal">
        <p>No interactive items</p>
      </Modal>
    );

    // Disable the close button to simulate modal with 0 focusable elements
    const closeBtn = screen.getByLabelText(/close dialog/i);
    closeBtn.setAttribute("disabled", "true");

    fireEvent.keyDown(window, { key: "Tab" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
