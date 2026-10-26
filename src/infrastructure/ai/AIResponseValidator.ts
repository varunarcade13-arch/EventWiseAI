import { Sanitizer } from "@/infrastructure/security/Sanitizer";
import {
  BudgetAnalysis,
  BudgetAnalysisSchema,
  EventPlan,
  EventPlanSchema,
  IdeasPlan,
  IdeasPlanSchema,
  RiskAnalysis,
  RiskAnalysisSchema,
  TimelineTaskSchema,
  VendorItemSchema,
} from "@/types/ai";
import { z } from "zod";

export class AIResponseValidator {
  /**
   * Safely parses and validates an EventPlan from raw Gemini output string.
   */
  public static validateEventPlan(rawText: string): EventPlan {
    const jsonStr = Sanitizer.extractJsonText(rawText);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error(
        "Failed to parse AI response as JSON. The model returned non-JSON text."
      );
    }

    const result = EventPlanSchema.safeParse(parsed);
    if (!result.success) {
      const issueDetails = result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      throw new Error(`AI plan schema validation failed: ${issueDetails}`);
    }

    return result.data;
  }

  /**
   * Safely parses and validates BudgetAnalysis.
   */
  public static validateBudgetAnalysis(rawText: string): BudgetAnalysis {
    const jsonStr = Sanitizer.extractJsonText(rawText);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error(
        "Failed to parse budget analysis response as JSON."
      );
    }

    const result = BudgetAnalysisSchema.safeParse(parsed);
    if (!result.success) {
      const issueDetails = result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      throw new Error(`Budget analysis schema validation failed: ${issueDetails}`);
    }

    return result.data;
  }

  /**
   * Safely parses and validates Timeline tasks array.
   */
  public static validateTimeline(rawText: string): EventPlan["timeline"] {
    const jsonStr = Sanitizer.extractJsonText(rawText);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error("Failed to parse timeline response as JSON.");
    }

    const schema = z.array(TimelineTaskSchema);
    const result = schema.safeParse(parsed);
    if (!result.success) {
      const issueDetails = result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      throw new Error(`Timeline schema validation failed: ${issueDetails}`);
    }

    return result.data;
  }

  /**
   * Safely parses and validates Vendors array.
   */
  public static validateVendors(rawText: string): EventPlan["vendors"] {
    const jsonStr = Sanitizer.extractJsonText(rawText);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error("Failed to parse vendors response as JSON.");
    }

    const schema = z.array(VendorItemSchema);
    const result = schema.safeParse(parsed);
    if (!result.success) {
      const issueDetails = result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      throw new Error(`Vendors schema validation failed: ${issueDetails}`);
    }

    return result.data;
  }

  /**
   * Safely parses and validates IdeasPlan.
   */
  public static validateIdeas(rawText: string): IdeasPlan {
    const jsonStr = Sanitizer.extractJsonText(rawText);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error("Failed to parse ideas response as JSON.");
    }

    const result = IdeasPlanSchema.safeParse(parsed);
    if (!result.success) {
      const issueDetails = result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      throw new Error(`Ideas schema validation failed: ${issueDetails}`);
    }

    return result.data;
  }

  /**
   * Safely parses and validates RiskAnalysis.
   */
  public static validateRisks(rawText: string): RiskAnalysis {
    const jsonStr = Sanitizer.extractJsonText(rawText);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error("Failed to parse risks response as JSON.");
    }

    const result = RiskAnalysisSchema.safeParse(parsed);
    if (!result.success) {
      const issueDetails = result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      throw new Error(`Risk analysis schema validation failed: ${issueDetails}`);
    }

    return result.data;
  }
}
