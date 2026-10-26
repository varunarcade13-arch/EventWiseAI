import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DemoDataBanner } from "./DemoDataBanner";

describe("DemoDataBanner component", () => {
  it("renders when isDemo is true and handles reset click", async () => {
    const user = userEvent.setup();
    const handleReset = vi.fn();

    render(<DemoDataBanner isDemo={true} onResetDemo={handleReset} />);
    expect(screen.getByText(/Demo Event Active/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /reset demo data/i }));
    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it("does not render when isDemo is false", () => {
    const { container } = render(
      <DemoDataBanner isDemo={false} onResetDemo={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });
});
