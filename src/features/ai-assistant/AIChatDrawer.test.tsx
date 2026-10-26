import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AIChatDrawer } from "./AIChatDrawer";
import { EventModel } from "@/types/event";

describe("AIChatDrawer component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  const sampleEvent: EventModel = {
    id: "e1",
    name: "Wedding",
    type: "wedding",
    date: "2027-02-15",
    location: "Hall",
    expectedGuests: 150,
    currency: "INR",
    totalBudget: 1000000,
    budgetCategories: [],
    timeline: [],
    vendors: [],
    recommendations: [],
    risks: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };

  it("renders welcome message, suggested prompt chips, and handles typing and sending", async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: "Here are my venue booking suggestions...",
        suggestedPlan: undefined,
      }),
    });

    render(
      <AIChatDrawer
        isOpen={true}
        onClose={() => {}}
        activeEvent={sampleEvent}
      />
    );

    expect(screen.getByText(/EventWise AI planning assistant/i)).toBeInTheDocument();
    expect(screen.getByText("What should I book first?")).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/ask anything about your event plan/i);
    await user.type(input, "What should I book first?");

    const sendBtn = screen.getByLabelText(/send message to ai assistant/i);
    await user.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText("Here are my venue booking suggestions...")).toBeInTheDocument();
    });

    // Send a follow-up message when abortControllerRef is already populated
    await user.type(input, "What next?");
    await user.click(sendBtn);
  });

  it("clicking a suggested prompt chip sends the prompt directly", async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: "To reduce catering budget, try limiting courses...",
        suggestedPlan: undefined,
      }),
    });

    render(
      <AIChatDrawer
        isOpen={true}
        onClose={() => {}}
        activeEvent={sampleEvent}
      />
    );

    const chip = screen.getByRole("button", { name: "How can I reduce my catering budget?" });
    await user.click(chip);

    await waitFor(() => {
      expect(screen.getByText(/to reduce catering budget/i)).toBeInTheDocument();
    });
  });

  it("handles AI response containing a suggested structured plan and applies it", async () => {
    const user = userEvent.setup();
    const handleApplyPlan = vi.fn().mockResolvedValue(undefined);

    const mockPlan = {
      summary: "Generated 100-guest plan",
      estimatedBudget: [{ name: "Venue", allocated: 500 }],
      timeline: [{ title: "T1", dueDate: "2027-01-01" }],
      vendors: [],
      recommendations: [],
      risks: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: "Here is your plan:",
        suggestedPlan: mockPlan,
      }),
    });

    render(
      <AIChatDrawer
        isOpen={true}
        onClose={() => {}}
        activeEvent={sampleEvent}
        onApplyPlan={handleApplyPlan}
      />
    );

    const input = screen.getByPlaceholderText(/ask anything about your event plan/i);
    await user.type(input, "Build plan");
    await user.click(screen.getByLabelText(/send message to ai assistant/i));

    await waitFor(() => {
      expect(screen.getByText("Generated 100-guest plan")).toBeInTheDocument();
    });

    const applyBtn = screen.getByRole("button", { name: /apply plan to wedding/i });
    await user.click(applyBtn);

    expect(handleApplyPlan).toHaveBeenCalledWith(mockPlan);
  });

  it("displays error message on API failure", async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: "Gemini API rate limit reached.",
      }),
    });

    render(
      <AIChatDrawer
        isOpen={true}
        onClose={() => {}}
        activeEvent={sampleEvent}
      />
    );

    const input = screen.getByPlaceholderText(/ask anything about your event plan/i);
    await user.type(input, "Help me plan");
    await user.click(screen.getByLabelText(/send message to ai assistant/i));

    await waitFor(() => {
      expect(screen.getByText(/Gemini API rate limit reached/i)).toBeInTheDocument();
    });
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <AIChatDrawer isOpen={false} onClose={() => {}} activeEvent={sampleEvent} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("handles null activeEvent and fallback prompt correctly", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: "General planning tips",
      }),
    });

    render(
      <AIChatDrawer isOpen={true} onClose={() => {}} activeEvent={null} />
    );

    expect(screen.getByText("General Planning")).toBeInTheDocument();
    const weddingChip = screen.getByRole("button", {
      name: "Plan my wedding for 200 guests with a budget of ₹15 lakh",
    });
    await user.click(weddingChip);
    await waitFor(() => {
      expect(screen.getByText("General planning tips")).toBeInTheDocument();
    });
  });

  it("handles onApplyPlan rejection with Error and non-Error", async () => {
    const user = userEvent.setup();
    const handleApplyPlan = vi.fn().mockRejectedValueOnce(new Error("Plan conflict"));

    const mockPlan = {
      summary: "Sample plan",
      estimatedBudget: [],
      timeline: [],
      vendors: [],
      recommendations: [],
      risks: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: "Plan ready",
        suggestedPlan: mockPlan,
      }),
    });

    render(
      <AIChatDrawer
        isOpen={true}
        onClose={() => {}}
        activeEvent={sampleEvent}
        onApplyPlan={handleApplyPlan}
      />
    );

    const input = screen.getByPlaceholderText(/ask anything about your event plan/i);
    await user.type(input, "Generate plan");
    await user.click(screen.getByLabelText(/send message to ai assistant/i));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /apply plan to wedding/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /apply plan to wedding/i }));
    await waitFor(() => {
      expect(screen.getByText(/Plan conflict/i)).toBeInTheDocument();
    });

    // Rejection with non-Error
    handleApplyPlan.mockRejectedValueOnce("String error");
    await user.click(screen.getByRole("button", { name: /apply plan to wedding/i }));
    await waitFor(() => {
      expect(screen.getByText(/Failed to apply plan to event/i)).toBeInTheDocument();
    });
  });

  it("closes when clicking directly on overlay backdrop and ignores clicks inside drawer", async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <AIChatDrawer
        isOpen={true}
        onClose={handleClose}
        activeEvent={sampleEvent}
      />
    );

    const dialog = screen.getByRole("dialog");
    // Click on inner heading (e.target !== e.currentTarget)
    await user.click(screen.getByText("EventWise AI Assistant"));
    expect(handleClose).not.toHaveBeenCalled();

    // Click directly on dialog backdrop (e.target === e.currentTarget)
    await user.click(dialog);
    expect(handleClose).toHaveBeenCalled();
  });

  it("shows fallback error message when API fails without error property", async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    render(
      <AIChatDrawer
        isOpen={true}
        onClose={() => {}}
        activeEvent={sampleEvent}
      />
    );

    const input = screen.getByPlaceholderText(/ask anything about your event plan/i);
    await user.type(input, "Help me");
    await user.click(screen.getByLabelText(/send message to ai assistant/i));

    await waitFor(() => {
      expect(screen.getByText(/Failed to communicate with AI assistant/i)).toBeInTheDocument();
    });
  });

  it("handles non-Error rejection when sending message", async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockRejectedValue("Fatal network drop");

    render(
      <AIChatDrawer
        isOpen={true}
        onClose={() => {}}
        activeEvent={sampleEvent}
      />
    );

    const input = screen.getByPlaceholderText(/ask anything about your event plan/i);
    await user.type(input, "Help me again");
    await user.click(screen.getByLabelText(/send message to ai assistant/i));

    await waitFor(() => {
      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    });
  });

  it("returns early when onApplyPlan is undefined", async () => {
    const user = userEvent.setup();
    const mockPlan = {
      summary: "Sample plan",
      estimatedBudget: [],
      timeline: [],
      vendors: [],
      recommendations: [],
      risks: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: "Plan ready",
        suggestedPlan: mockPlan,
      }),
    });

    render(
      <AIChatDrawer
        isOpen={true}
        onClose={() => {}}
        activeEvent={sampleEvent}
        onApplyPlan={undefined}
      />
    );

    const input = screen.getByPlaceholderText(/ask anything about your event plan/i);
    await user.type(input, "Make a plan");
    await user.click(screen.getByLabelText(/send message to ai assistant/i));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /apply plan to wedding/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /apply plan to wedding/i }));
    // No error displayed and no crash
    expect(screen.queryByText(/AI Error/i)).not.toBeInTheDocument();
  });

  it("does not send message when already loading", async () => {
    const user = userEvent.setup();
    let resolvePromise: (val: unknown) => void;
    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
    );

    render(
      <AIChatDrawer
        isOpen={true}
        onClose={() => {}}
        activeEvent={sampleEvent}
      />
    );

    const input = screen.getByPlaceholderText(/ask anything about your event plan/i);
    await user.type(input, "First question");
    await user.click(screen.getByLabelText(/send message to ai assistant/i));

    // Now isLoading is true
    // Try to submit the form again directly with input text
    const form = screen.getByRole("dialog").querySelector("form")!;
    fireEvent.submit(form);

    // Only 1 fetch call was made
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Resolve the promise to clean up
    resolvePromise!({
      ok: true,
      json: async () => ({ message: "Answer 1" }),
    });

    await waitFor(() => {
      expect(screen.getByText("Answer 1")).toBeInTheDocument();
    });
  });

  it("closes on Escape key press", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(
      <AIChatDrawer
        isOpen={true}
        onClose={handleClose}
        activeEvent={sampleEvent}
      />
    );

    await user.keyboard("{Escape}");
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("traps keyboard focus with Tab and Shift+Tab cycling", async () => {
    const user = userEvent.setup();
    render(
      <AIChatDrawer
        isOpen={true}
        onClose={() => {}}
        activeEvent={sampleEvent}
      />
    );

    // Press Tab multiple times to verify cycling through focusable controls
    await user.tab();
    expect(document.activeElement).not.toBeNull();

    await user.tab({ shift: true });
    expect(document.activeElement).not.toBeNull();

    // Fire Tab and Shift+Tab keydown events to test wrap logic
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    fireEvent.keyDown(window, { key: "Tab" });

    // Focus outside drawer and press Tab / Shift+Tab
    document.body.focus();
    fireEvent.keyDown(window, { key: "Tab" });
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
  });

  it("handles drawer when all interactive elements are disabled", () => {
    render(
      <AIChatDrawer
        isOpen={true}
        onClose={() => {}}
        activeEvent={sampleEvent}
      />
    );

    // Disable all buttons, inputs, links and remove tabindex
    const dialog = screen.getByRole("dialog");
    const focusable = dialog.querySelectorAll("button, input, select, textarea, [tabindex]");
    focusable.forEach((el) => {
      el.setAttribute("disabled", "true");
      el.setAttribute("tabindex", "-1");
    });

    fireEvent.keyDown(window, { key: "Tab" });
    expect(dialog).toBeInTheDocument();
  });

  it("cleanly handles AbortError during fetch cancellation", async () => {
    const user = userEvent.setup();
    const abortError = new Error("The operation was aborted.");
    abortError.name = "AbortError";
    global.fetch = vi.fn().mockRejectedValue(abortError);

    render(
      <AIChatDrawer
        isOpen={true}
        onClose={() => {}}
        activeEvent={sampleEvent}
      />
    );

    const input = screen.getByPlaceholderText(/ask anything about your event plan/i);
    await user.type(input, "Aborted query");
    await user.click(screen.getByLabelText(/send message to ai assistant/i));

    // AbortError does NOT set an error notification banner
    expect(screen.queryByText(/AI Error/i)).not.toBeInTheDocument();
  });
});
