import { AIPlannerService } from "@/application/interfaces/AIPlannerService";
import {
  BudgetAnalysis,
  EventPlan,
  EventPlanningInput,
  IdeasPlan,
  RiskAnalysis,
} from "@/types/ai";
import { EventModel } from "@/types/event";

export class MockAIPlannerService implements AIPlannerService {
  public shouldFail: boolean = false;
  public failureMessage: string = "Simulated Gemini API error";
  public customPlan: EventPlan | null = null;

  public async generateEventPlan(input: EventPlanningInput): Promise<EventPlan> {
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }

    if (this.customPlan) {
      return this.customPlan;
    }

    return {
      summary: `AI Plan for ${input.eventName} (${input.expectedGuests} guests, ${input.currency} ${input.totalBudget.toLocaleString()})`,
      estimatedBudget: [
        {
          name: "Venue",
          allocated: Math.round(input.totalBudget * 0.35),
          actual: 0,
          notes: "Primary venue booking",
        },
        {
          name: "Catering",
          allocated: Math.round(input.totalBudget * 0.3),
          actual: 0,
          notes: "Food and refreshments for guests",
        },
        {
          name: "Decor & Production",
          allocated: Math.round(input.totalBudget * 0.15),
          actual: 0,
          notes: "Stage, lighting and floral decor",
        },
        {
          name: "Contingency",
          allocated: Math.round(input.totalBudget * 0.2),
          actual: 0,
          notes: "Reserve fund",
        },
      ],
      timeline: [
        {
          title: "Book primary venue",
          dueDate: input.eventDate,
          status: "not_started",
          priority: "high",
          category: "Venue",
          assignedTo: "Lead Planner",
        },
        {
          title: "Send invitations to guests",
          dueDate: input.eventDate,
          status: "not_started",
          priority: "medium",
          category: "Guest Management",
          assignedTo: "Coordinator",
        },
      ],
      vendors: [
        {
          name: "Grand Ballroom & Lawns",
          category: "venue",
          status: "not_contacted",
          estimatedCost: Math.round(input.totalBudget * 0.35),
          notes: "Accommodates expected guest count",
        },
        {
          name: "Premier Caterers",
          category: "catering",
          status: "not_contacted",
          estimatedCost: Math.round(input.totalBudget * 0.3),
          notes: "Full buffet setup",
        },
      ],
      recommendations: [
        {
          category: "Budgeting",
          title: "Early Bird Booking",
          description: "Locking the venue early secures discount rates.",
          estimatedSavingsOrCost: "Save up to 10%",
        },
      ],
      risks: [
        {
          risk: "Guest count surge beyond initial estimation",
          impact: "medium",
          mitigation: "Include 10% overflow buffer in catering agreement.",
        },
      ],
    };
  }

  public async analyzeBudget(
    event: Pick<EventModel, "name" | "type" | "totalBudget" | "currency" | "budgetCategories" | "expectedGuests">
  ): Promise<BudgetAnalysis> {
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }

    return {
      summary: `Budget analysis for ${event.name}: well-structured distribution across ${event.budgetCategories.length} categories.`,
      healthScore: 88,
      overspendingRisk: false,
      underallocatedCategories: ["Contingency"],
      potentialSavings: [
        {
          category: "Decor",
          tip: "Opt for seasonal florals and ambient LED lighting.",
          estimatedSavings: 15000,
        },
      ],
      redistributionSuggestions: [
        {
          category: "Contingency",
          currentAllocation: 10000,
          suggestedAllocation: 25000,
          reason: "Buffer against last-minute vendor price changes.",
        },
      ],
    };
  }

  public async generateTimeline(
    event: Pick<EventModel, "name" | "type" | "date" | "expectedGuests">
  ): Promise<EventPlan["timeline"]> {
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }

    return [
      {
        title: `Lock down venue for ${event.name}`,
        dueDate: event.date,
        status: "not_started",
        priority: "high",
        category: "Venue",
        assignedTo: "Event Lead",
      },
      {
        title: "Send RSVP reminders",
        dueDate: event.date,
        status: "not_started",
        priority: "medium",
        category: "Guests",
        assignedTo: "Coordinator",
      },
    ];
  }

  public async generateVendors(
    event: Pick<EventModel, "name" | "type" | "totalBudget" | "expectedGuests" | "currency">
  ): Promise<EventPlan["vendors"]> {
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }

    return [
      {
        name: `${event.name} Primary Venue`,
        category: "venue",
        status: "not_contacted",
        estimatedCost: Math.round(event.totalBudget * 0.4),
        notes: "Central location with ample parking",
      },
      {
        name: "Artisan Catering Service",
        category: "catering",
        status: "not_contacted",
        estimatedCost: Math.round(event.totalBudget * 0.3),
        notes: "Customized menu for guests",
      },
    ];
  }

  public async generateIdeas(
    event: Pick<EventModel, "name" | "type" | "location" | "expectedGuests">
  ): Promise<IdeasPlan> {
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }

    return {
      summary: `Creative concepts tailored for ${event.name} in ${event.location}`,
      themes: ["Modern Minimalist Glow", "Vintage Garden Elegance", "Bohemian Twilight"],
      activities: ["Interactive photo booth with instant prints", "Live acoustic lounge set"],
      decorationIdeas: ["Fairy light canopy", "Minimalist typography signage"],
      foodIdeas: ["Artisan grazing table", "Signature welcome coolers"],
      entertainment: ["Acoustic guitarist duo", "Curated ambient DJ set"],
      guestExperiences: ["Personalized welcome cards", "Custom farewell gift tokens"],
    };
  }

  public async assessRisks(
    event: Pick<EventModel, "name" | "type" | "date" | "location" | "expectedGuests" | "totalBudget">
  ): Promise<RiskAnalysis> {
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }

    return {
      summary: `Risk assessment for ${event.name} in ${event.location}`,
      risks: [
        {
          risk: "Inclement weather during outdoor segments",
          impact: "high",
          mitigation: "Ensure waterproof canopy or indoor hall backup is on standby.",
        },
        {
          risk: "AV equipment or power failure",
          impact: "medium",
          mitigation: "Require vendor to provide redundant backup generator and soundboard.",
        },
      ],
    };
  }

  public async chat(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    context?: Partial<EventModel>
  ): Promise<{ responseText: string; suggestedPlan?: EventPlan }> {
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }

    const last = messages[messages.length - 1]?.content || "";
    const eventContext = context?.name ? ` for ${context.name}` : "";
    return {
      responseText: `Here are my recommendations for "${last}"${eventContext}: I suggest focusing on venue selection and locking catering early to avoid peak surge pricing. Let me know if you would like me to generate a complete structured plan.`,
    };
  }
}
