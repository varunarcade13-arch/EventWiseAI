import { z } from "zod";
import { CurrencyCode, EventType } from "./event";

export const BudgetCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  allocated: z.number().nonnegative(),
  actual: z.number().nonnegative().optional().default(0),
  notes: z.string().optional(),
});

export const TimelineTaskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  dueDate: z.string(), // YYYY-MM-DD
  status: z
    .enum(["not_started", "in_progress", "completed"])
    .optional()
    .default("not_started"),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  category: z.string().optional(),
  assignedTo: z.string().optional(),
});

export const VendorItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  category: z.enum([
    "venue",
    "catering",
    "photography",
    "decoration",
    "entertainment",
    "transportation",
    "invitations",
    "makeup",
    "security",
    "miscellaneous",
  ]),
  status: z
    .enum(["not_contacted", "contacted", "booked"])
    .optional()
    .default("not_contacted"),
  estimatedCost: z.number().nonnegative(),
  actualCost: z.number().nonnegative().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  notes: z.string().optional(),
});

export const RecommendationSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  estimatedSavingsOrCost: z.string().optional(),
});

export const RiskSchema = z.object({
  id: z.string().optional(),
  risk: z.string().min(1),
  impact: z.enum(["low", "medium", "high"]),
  mitigation: z.string().min(1),
});

export const EventPlanSchema = z.object({
  summary: z.string().min(1).max(5000),
  estimatedBudget: z.array(BudgetCategorySchema).max(100),
  timeline: z.array(TimelineTaskSchema).max(200),
  vendors: z.array(VendorItemSchema).max(100),
  recommendations: z.array(RecommendationSchema).max(50),
  risks: z.array(RiskSchema).max(50),
});

export type EventPlan = z.infer<typeof EventPlanSchema>;

export const BudgetAnalysisSchema = z.object({
  summary: z.string().min(1).max(5000),
  healthScore: z.number().min(0).max(100),
  overspendingRisk: z.boolean(),
  underallocatedCategories: z.array(z.string().max(200)).max(50),
  potentialSavings: z
    .array(
      z.object({
        category: z.string().max(200),
        tip: z.string().max(1000),
        estimatedSavings: z.number().nonnegative(),
      })
    )
    .max(50),
  redistributionSuggestions: z
    .array(
      z.object({
        category: z.string().max(200),
        currentAllocation: z.number(),
        suggestedAllocation: z.number(),
        reason: z.string().max(1000),
      })
    )
    .max(50),
});

export type BudgetAnalysis = z.infer<typeof BudgetAnalysisSchema>;

export const RiskAnalysisSchema = z.object({
  summary: z.string().min(1).max(5000),
  risks: z.array(RiskSchema).max(50),
});

export type RiskAnalysis = z.infer<typeof RiskAnalysisSchema>;

export const IdeasPlanSchema = z.object({
  summary: z.string().min(1).max(5000),
  themes: z.array(z.string().max(300)).max(20),
  activities: z.array(z.string().max(500)).max(50),
  decorationIdeas: z.array(z.string().max(500)).max(50),
  foodIdeas: z.array(z.string().max(500)).max(50),
  entertainment: z.array(z.string().max(500)).max(50),
  guestExperiences: z.array(z.string().max(500)).max(50),
});

export type IdeasPlan = z.infer<typeof IdeasPlanSchema>;

export interface EventPlanningInput {
  eventName: string;
  eventType: EventType;
  eventDate: string;
  location: string;
  expectedGuests: number;
  totalBudget: number;
  currency: CurrencyCode;
  specialRequirements?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  structuredPlan?: EventPlan;
}
