export type EventType = "wedding" | "birthday" | "community" | "other";

export type TaskStatus = "not_started" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export type VendorCategory =
  | "venue"
  | "catering"
  | "photography"
  | "decoration"
  | "entertainment"
  | "transportation"
  | "invitations"
  | "makeup"
  | "security"
  | "miscellaneous";

export type VendorStatus = "not_contacted" | "contacted" | "booked";

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP";

export interface BudgetCategory {
  id: string;
  name: string;
  allocated: number;
  actual: number;
  notes?: string;
}

export interface TimelineTask {
  id: string;
  title: string;
  dueDate: string; // ISO date string (YYYY-MM-DD)
  status: TaskStatus;
  priority: TaskPriority;
  category?: string;
  assignedTo?: string;
}

export interface VendorItem {
  id: string;
  name: string;
  category: VendorCategory;
  status: VendorStatus;
  estimatedCost: number;
  actualCost?: number;
  contactPerson?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface Risk {
  id: string;
  risk: string;
  impact: "low" | "medium" | "high";
  mitigation: string;
}

export interface Recommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  estimatedSavingsOrCost?: string;
}

export interface EventModel {
  id: string;
  name: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  location: string;
  expectedGuests: number;
  currency: CurrencyCode;
  totalBudget: number;
  budgetCategories: BudgetCategory[];
  timeline: TimelineTask[];
  vendors: VendorItem[];
  recommendations: Recommendation[];
  risks: Risk[];
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummary {
  totalBudget: number;
  totalAllocated: number;
  totalActual: number;
  remainingAllocated: number;
  remainingActual: number;
  percentageAllocated: number;
  percentageSpent: number;
  isOverBudget: boolean;
}

export interface PlanningProgress {
  overallPercentage: number;
  tasksCompleted: number;
  totalTasks: number;
  vendorsBooked: number;
  totalVendors: number;
  budgetAllocatedPercentage: number;
  daysRemaining: number;
}
