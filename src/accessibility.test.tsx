import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import axe from "axe-core";
import { DashboardOverview } from "./features/dashboard/DashboardOverview";
import { BudgetManager } from "./features/budget/BudgetManager";
import { TimelineView } from "./features/timeline/TimelineView";
import { VendorChecklist } from "./features/vendors/VendorChecklist";
import { CreateEventModal } from "./features/event-creation/CreateEventModal";
import { AddCategoryModal } from "./features/budget/AddCategoryModal";
import { AddTaskModal } from "./features/timeline/AddTaskModal";
import { AddVendorModal } from "./features/vendors/AddVendorModal";
import { AIChatDrawer } from "./features/ai-assistant/AIChatDrawer";
import { Input } from "./components/ui/Input";
import { Select } from "./components/ui/Select";
import { Button } from "./components/ui/Button";
import { ToastProvider, useToast } from "./components/ui/Toast";
import { ProgressBar } from "./components/ui/ProgressBar";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { AIAdvisorModal } from "./features/ai-assistant/AIAdvisorModal";
import { EventCard } from "./features/dashboard/EventCard";
import { Tabs } from "./components/ui/Tabs";
import { EventModel, PlanningProgress } from "@/types/event";

const sampleEvent: EventModel = {
  id: "e1",
  name: "Gala Evening 2027",
  type: "community",
  date: "2027-05-20",
  location: "Metropolitan Hall",
  expectedGuests: 250,
  currency: "INR",
  totalBudget: 1500000,
  budgetCategories: [
    { id: "c1", name: "Venue Booking", allocated: 600000, actual: 580000 },
    { id: "c2", name: "Catering & Beverages", allocated: 500000, actual: 480000 },
  ],
  timeline: [
    { id: "t1", title: "Reserve Conference Hall", dueDate: "2026-11-01", status: "completed", priority: "high" },
    { id: "t2", title: "Finalize Keynote Speakers", dueDate: "2026-12-15", status: "in_progress", priority: "high" },
    { id: "t3", title: "Send Invitations", dueDate: "2027-01-10", status: "not_started", priority: "medium" },
  ],
  vendors: [
    {
      id: "v1",
      name: "Grand Ballroom Services",
      category: "venue",
      status: "booked",
      estimatedCost: 600000,
      actualCost: 580000,
      contactPerson: "Jane Smith",
      phone: "+91 9876543210",
      email: "jane@ballroom.com",
      notes: "Deposit paid",
    },
  ],
  recommendations: [
    { id: "r1", category: "Budget", title: "AV Equipment Bundle", description: "Negotiate audio-visual package together", estimatedSavingsOrCost: "Save ₹35,000" },
  ],
  risks: [
    { id: "rk1", risk: "Audio Equipment Failure", impact: "high", mitigation: "Backup audio system standby" },
  ],
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

const sampleProgress: PlanningProgress = {
  overallPercentage: 45,
  tasksCompleted: 1,
  totalTasks: 3,
  vendorsBooked: 1,
  totalVendors: 1,
  budgetAllocatedPercentage: 73,
  daysRemaining: 180,
};

async function checkA11y(container: HTMLElement) {
  const results = await axe.run(container, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
    },
    rules: {
      "color-contrast": { enabled: false }, // JSDOM does not calculate actual layout colors
    },
  });

  const violations = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    helpUrl: v.helpUrl,
    nodes: v.nodes.map((n) => n.html),
  }));

  return violations;
}

describe("Automated Accessibility Suite (axe-core WCAG 2.2 AA)", () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("verifies DashboardOverview has no accessibility violations", async () => {
    const { container } = render(
      <main>
        <DashboardOverview
          event={sampleEvent}
          progress={sampleProgress}
          onNavigateTab={vi.fn()}
          onTriggerAIPlan={vi.fn()}
          onTriggerAIIdeas={vi.fn()}
          onTriggerAIRisks={vi.fn()}
        />
      </main>
    );
    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });

  it("verifies BudgetManager has no accessibility violations", async () => {
    const { container } = render(
      <main>
        <BudgetManager
          event={sampleEvent}
          onAddCategory={vi.fn()}
          onDeleteCategory={vi.fn()}
          onTriggerAIAdvisor={vi.fn()}
        />
      </main>
    );
    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });

  it("verifies TimelineView has no accessibility violations", async () => {
    const { container } = render(
      <main>
        <TimelineView
          event={sampleEvent}
          onAddTask={vi.fn()}
          onUpdateTaskStatus={vi.fn()}
          onDeleteTask={vi.fn()}
          onTriggerAITimeline={vi.fn()}
        />
      </main>
    );
    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });

  it("verifies VendorChecklist has no accessibility violations", async () => {
    const { container } = render(
      <main>
        <VendorChecklist
          event={sampleEvent}
          onAddVendor={vi.fn()}
          onUpdateVendorStatus={vi.fn()}
          onDeleteVendor={vi.fn()}
          onTriggerAIVendors={vi.fn()}
        />
      </main>
    );
    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });

  it("verifies CreateEventModal has no accessibility violations", async () => {
    const { container } = render(
      <ToastProvider>
        <CreateEventModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />
      </ToastProvider>
    );
    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });

  it("verifies AddCategoryModal has no accessibility violations", async () => {
    const { container } = render(
      <AddCategoryModal
        isOpen={true}
        onClose={vi.fn()}
        currency="INR"
        onAdd={vi.fn()}
      />
    );
    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });

  it("verifies AddTaskModal has no accessibility violations", async () => {
    const { container } = render(
      <AddTaskModal
        isOpen={true}
        onClose={vi.fn()}
        onAdd={vi.fn()}
      />
    );
    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });

  it("verifies AddVendorModal has no accessibility violations", async () => {
    const { container } = render(
      <AddVendorModal
        isOpen={true}
        onClose={vi.fn()}
        currency="INR"
        onAdd={vi.fn()}
      />
    );
    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });

  it("verifies AIChatDrawer has no accessibility violations", async () => {
    const { container } = render(
      <AIChatDrawer
        isOpen={true}
        onClose={vi.fn()}
        activeEvent={sampleEvent}
      />
    );
    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });

  it("verifies Header & Navigation landmarks have no accessibility violations", async () => {
    const { container } = render(
      <Header
        events={[sampleEvent]}
        activeEvent={sampleEvent}
        onSelectEvent={vi.fn()}
        onCreateEventClick={vi.fn()}
        onToggleAIChat={vi.fn()}
        onResetDemo={vi.fn()}
      />
    );
    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });

  it("verifies Footer has no accessibility violations", async () => {
    const { container } = render(<Footer />);
    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });

  it("verifies Form Controls, Validation & Toasts have no accessibility violations", async () => {
    const TestComponent = () => {
      const { showToast } = useToast();
      return (
        <main>
          <h1>Form Accessibility Test</h1>
          <form>
            <Input
              label="Event Title"
              id="event-title-test"
              helperText="Enter the official title"
              required
            />
            <Input
              label="Invalid Input"
              id="invalid-input-test"
              error="This field has an error"
            />
            <Select
              label="Select Type"
              id="select-type-test"
              options={[
                { value: "opt1", label: "Option 1" },
                { value: "opt2", label: "Option 2" },
              ]}
            />
            <Button type="submit">Submit Event</Button>
            <Button type="button" onClick={() => showToast("Test notification", "info")}>
              Trigger Toast
            </Button>
          </form>
          <ProgressBar value={75} label="Completion progress" />
        </main>
      );
    };

    const { container } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });

  it("verifies EventCard has no accessibility violations", async () => {
    const { container } = render(
      <main>
        <h2>Your Events Directory</h2>
        <EventCard
          event={sampleEvent}
          isActive={true}
          onSelect={vi.fn()}
        />
      </main>
    );
    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });

  it("verifies Tabs has no accessibility violations", async () => {
    const { container } = render(
      <main>
        <h1>Navigation</h1>
        <Tabs
          tabs={[
            { id: "tab1", label: "Tab 1" },
            { id: "tab2", label: "Tab 2", badge: 3 },
          ]}
          activeTab="tab1"
          onChange={vi.fn()}
        />
        <div role="tabpanel" id="panel-tab1" aria-labelledby="tab-tab1">
          Tab 1 panel content
        </div>
      </main>
    );
    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });

  it("verifies AIAdvisorModal has no accessibility violations in budget mode", async () => {
    const { container } = render(
      <AIAdvisorModal
        type="budget"
        isOpen={true}
        onClose={vi.fn()}
        budgetAnalysis={{
          healthScore: 88,
          summary: "Budget is well-balanced across core categories.",
          overspendingRisk: false,
          underallocatedCategories: [],
          potentialSavings: [
            { category: "Venue", tip: "Book off-peak weekday", estimatedSavings: 50000 },
          ],
          redistributionSuggestions: [
            { category: "Decor", currentAllocation: 200000, suggestedAllocation: 150000, reason: "Reallocate savings to catering" },
          ],
        }}
      />
    );
    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });

  it("verifies AIAdvisorModal has no accessibility violations in ideas mode", async () => {
    const { container } = render(
      <AIAdvisorModal
        type="ideas"
        isOpen={true}
        onClose={vi.fn()}
        ideasPlan={{
          summary: "Inspiring creative concept for gala evening.",
          themes: ["Celestial Elegance", "Eco Botanical"],
          activities: ["Interactive photo installation", "Live jazz quartet"],
          foodIdeas: ["Artisan grazing station", "Signature mocktail bar"],
          decorationIdeas: ["Suspended fairy light canopy", "Recycled floral centerpieces"],
          entertainment: ["Live DJ", "Acoustic duo"],
          guestExperiences: ["Personalized welcome gifts", "Photo booth"],
        }}
      />
    );
    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });

  it("verifies AIAdvisorModal has no accessibility violations in risks mode", async () => {
    const { container } = render(
      <AIAdvisorModal
        type="risks"
        isOpen={true}
        onClose={vi.fn()}
        riskAnalysis={{
          summary: "Identified high-priority contingency safeguards.",
          risks: [
            { risk: "Severe weather delay", impact: "high", mitigation: "Reserve indoor ballroom marquee" },
          ],
        }}
        onApplyRisks={vi.fn()}
      />
    );
    const violations = await checkA11y(container);
    expect(violations).toEqual([]);
  });
});

