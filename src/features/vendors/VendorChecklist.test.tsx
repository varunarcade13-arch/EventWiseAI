import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VendorChecklist } from "./VendorChecklist";
import { EventModel } from "@/types/event";

describe("VendorChecklist component", () => {
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
    vendors: [
      {
        id: "v1",
        name: "Grand Ballroom",
        category: "venue",
        status: "booked",
        estimatedCost: 500000,
        actualCost: 480000,
        contactPerson: "Manager",
        phone: "999888",
        email: "venue@test.com",
        notes: "50% deposit paid",
      },
      {
        id: "v2",
        name: "Lumina Films",
        category: "photography",
        status: "contacted",
        estimatedCost: 150000,
      },
    ],
    recommendations: [],
    risks: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };

  it("renders vendors, filters by category, and changes status", async () => {
    const user = userEvent.setup();
    const handleStatus = vi.fn();
    const handleDelete = vi.fn();
    const handleAI = vi.fn();

    render(
      <VendorChecklist
        event={sampleEvent}
        onAddVendor={vi.fn()}
        onUpdateVendorStatus={handleStatus}
        onDeleteVendor={handleDelete}
        onTriggerAIVendors={handleAI}
      />
    );

    expect(screen.getByText("Grand Ballroom")).toBeInTheDocument();
    expect(screen.getByText("Lumina Films")).toBeInTheDocument();

    // Filter by photography
    await user.click(screen.getByRole("button", { name: /photography/i }));
    expect(screen.queryByText("Grand Ballroom")).not.toBeInTheDocument();
    expect(screen.getByText("Lumina Films")).toBeInTheDocument();

    // Reset filter
    await user.click(screen.getByRole("button", { name: /all categories/i }));

    // Change status via dropdown
    const select = screen.getByLabelText(/update booking status for grand ballroom/i);
    await user.selectOptions(select, "contacted");
    expect(handleStatus).toHaveBeenCalledWith("v1", "contacted");

    // Delete vendor
    const deleteBtn = screen.getByLabelText(/delete vendor grand ballroom/i);
    await user.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith("v1");

    // Trigger AI vendor checklist
    await user.click(screen.getByRole("button", { name: /ai vendor checklist/i }));
    expect(handleAI).toHaveBeenCalledTimes(1);
  });

  it("renders empty state when filtered category has no vendors", async () => {
    const user = userEvent.setup();
    const handleAI = vi.fn();

    render(
      <VendorChecklist
        event={sampleEvent}
        onAddVendor={vi.fn()}
        onUpdateVendorStatus={vi.fn()}
        onDeleteVendor={vi.fn()}
        onTriggerAIVendors={handleAI}
      />
    );

    // Filter by Security (none in sampleEvent)
    await user.click(screen.getByRole("button", { name: /security/i }));
    expect(screen.getByText(/no vendors found for this category/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /generate vendors with ai/i }));
    expect(handleAI).toHaveBeenCalledTimes(1);
  });

  it("handles unknown vendor status and modal open/close", async () => {
    const user = userEvent.setup();
    const eventWithUnknown: EventModel = {
      ...sampleEvent,
      vendors: [
        {
          id: "v3",
          name: "Unknown Vendor Status",
          category: "venue",
          status: "pending_review" as unknown as import("@/types/event").VendorStatus,
          estimatedCost: 10000,
        },
      ],
    };

    render(
      <VendorChecklist
        event={eventWithUnknown}
        onAddVendor={vi.fn()}
        onUpdateVendorStatus={vi.fn()}
        onDeleteVendor={vi.fn()}
        onTriggerAIVendors={vi.fn()}
      />
    );

    expect(screen.getByText("pending_review")).toBeInTheDocument();

    // Open Add Vendor Modal
    await user.click(screen.getByRole("button", { name: /add vendor/i }));
    expect(screen.getByRole("heading", { name: "Add Vendor" })).toBeInTheDocument();

    // Click Cancel
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("heading", { name: "Add Vendor" })).not.toBeInTheDocument();
  });
});
