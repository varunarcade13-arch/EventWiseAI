import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast } from "./Toast";
import React from "react";

const TestComponent = () => {
  const { showToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast("Success message", "success")}>
        Trigger Success
      </button>
      <button onClick={() => showToast("Error message", "error")}>
        Trigger Error
      </button>
      <button onClick={() => showToast("Info message", "info")}>
        Trigger Info
      </button>
    </div>
  );
};

describe("Toast component & Provider", () => {
  it("shows toasts of different types and allows dismissing", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByRole("button", { name: /trigger success/i }));
    expect(screen.getByText("Success message")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /trigger error/i }));
    expect(screen.getByText("Error message")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /trigger info/i }));
    expect(screen.getByText("Info message")).toBeInTheDocument();

    // Dismiss first toast
    const dismissBtns = screen.getAllByLabelText(/dismiss notification/i);
    if (dismissBtns[0]) {
      await user.click(dismissBtns[0]);
    }
    expect(screen.queryByText("Success message")).not.toBeInTheDocument();
  });

  it("auto dismisses toast after timeout and supports default type", () => {
    vi.useFakeTimers();
    const AutoDismissTest = () => {
      const { showToast } = useToast();
      return (
        <button onClick={() => showToast("Default type message")}>
          Show Default
        </button>
      );
    };

    render(
      <ToastProvider>
        <AutoDismissTest />
      </ToastProvider>
    );

    const btn = screen.getByRole("button", { name: /show default/i });
    act(() => {
      btn.click();
    });
    expect(screen.getByText("Default type message")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByText("Default type message")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("throws error when useToast is used outside provider", () => {
    const InvalidUsage = () => {
      useToast();
      return null;
    };
    expect(() => render(<InvalidUsage />)).toThrow(
      "useToast must be used within a ToastProvider"
    );
  });
});
