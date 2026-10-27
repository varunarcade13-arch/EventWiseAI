import { AIPlannerService } from "@/application/interfaces/AIPlannerService";
import {
  ConfigurationError,
  TimeoutError,
  GeminiApiError,
} from "@/app/api/apiHelper";
import { AIResponseValidator } from "@/infrastructure/ai/AIResponseValidator";
import { GEMINI_CONFIG } from "@/infrastructure/ai/geminiConfig";
import { PromptBuilder } from "@/infrastructure/ai/PromptBuilder";
import {
  BudgetAnalysis,
  EventPlan,
  EventPlanningInput,
  IdeasPlan,
  RiskAnalysis,
} from "@/types/ai";
import { EventModel } from "@/types/event";
import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiAIPlannerService implements AIPlannerService {
  private readonly apiKey: string;
  private readonly modelName: string;
  private genAI: GoogleGenerativeAI | null = null;

  constructor(
    apiKey: string | undefined = process.env.GEMINI_API_KEY,
    modelName: string = GEMINI_CONFIG.primaryModel
  ) {
    this.apiKey = (apiKey || process.env.GEMINI_API_KEY || "")
      .replace(/^["']|["']$/g, "")
      .trim();
    this.modelName = modelName;
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  private ensureConfigured(): GoogleGenerativeAI {
    if (!this.apiKey || !this.genAI) {
      throw new ConfigurationError();
    }
    return this.genAI;
  }

  /**
   * Performs an individual model generateContent call with AbortController signal
   */
  private async executeModelCall(
    modelName: string,
    prompt: string,
    timeoutMs: number
  ): Promise<string> {
    const client = this.ensureConfigured();
    const model = client.getGenerativeModel({
      model: modelName,
      generationConfig: GEMINI_CONFIG.generationConfig,
    });

    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const result = await model.generateContent(prompt, {
        signal: controller.signal,
      });
      clearTimeout(timer);

      const response = result.response;
      const text = response.text().trim();
      if (!text) {
        throw new GeminiApiError("Received empty response from Gemini API.", 502);
      }
      return text;
    } catch (err: unknown) {
      clearTimeout(timer);
      if (controller.signal.aborted) {
        throw new TimeoutError(
          `Gemini request timed out after ${Math.round(timeoutMs / 1000)} seconds. Please try again.`
        );
      }
      throw err;
    }
  }

  /**
   * Generates text with bounded timeout, AbortController cancellation, and
   * resilient fallback to GEMINI_CONFIG.fallbackModel on transient 503/404 errors.
   */
  private async generateWithTimeout(
    prompt: string,
    timeoutMs: number = GEMINI_CONFIG.timeoutMs
  ): Promise<string> {
    if (!prompt || prompt.length > 25000) {
      throw new Error("Prompt exceeds maximum permissible length of 25,000 characters.");
    }

    try {
      return await this.executeModelCall(this.modelName, prompt, timeoutMs);
    } catch (err: unknown) {
      const errObj = err as { status?: number; message?: string };
      const isTransient =
        errObj?.status === 503 ||
        errObj?.status === 404 ||
        Boolean(errObj?.message?.includes("high demand")) ||
        Boolean(errObj?.message?.includes("is not found"));

      // Only attempt fallback if primary model was used and a distinct fallback exists
      if (isTransient && this.modelName !== GEMINI_CONFIG.fallbackModel) {
        console.warn(
          `[Gemini Fallback] Model ${this.modelName} encountered transient error (${errObj.status || "demand"}). Retrying once with ${GEMINI_CONFIG.fallbackModel}...`
        );
        return await this.executeModelCall(
          GEMINI_CONFIG.fallbackModel,
          prompt,
          timeoutMs
        );
      }

      throw err;
    }
  }

  public async generateEventPlan(input: EventPlanningInput): Promise<EventPlan> {
    const prompt = PromptBuilder.buildEventPlanPrompt(input);
    const raw = await this.generateWithTimeout(prompt);
    return AIResponseValidator.validateEventPlan(raw);
  }

  public async analyzeBudget(
    event: Pick<EventModel, "name" | "type" | "totalBudget" | "currency" | "budgetCategories" | "expectedGuests">
  ): Promise<BudgetAnalysis> {
    const prompt = PromptBuilder.buildBudgetAnalysisPrompt(event);
    const raw = await this.generateWithTimeout(prompt);
    return AIResponseValidator.validateBudgetAnalysis(raw);
  }

  public async generateTimeline(
    event: Pick<EventModel, "name" | "type" | "date" | "expectedGuests">
  ): Promise<EventPlan["timeline"]> {
    const prompt = PromptBuilder.buildTimelinePrompt(event);
    const raw = await this.generateWithTimeout(prompt);
    return AIResponseValidator.validateTimeline(raw);
  }

  public async generateVendors(
    event: Pick<EventModel, "name" | "type" | "totalBudget" | "expectedGuests" | "currency">
  ): Promise<EventPlan["vendors"]> {
    const prompt = PromptBuilder.buildVendorsPrompt(event);
    const raw = await this.generateWithTimeout(prompt);
    return AIResponseValidator.validateVendors(raw);
  }

  public async generateIdeas(
    event: Pick<EventModel, "name" | "type" | "location" | "expectedGuests">
  ): Promise<IdeasPlan> {
    const prompt = PromptBuilder.buildIdeasPrompt(event);
    const raw = await this.generateWithTimeout(prompt);
    return AIResponseValidator.validateIdeas(raw);
  }

  public async assessRisks(
    event: Pick<EventModel, "name" | "type" | "date" | "location" | "expectedGuests" | "totalBudget">
  ): Promise<RiskAnalysis> {
    const prompt = PromptBuilder.buildRisksPrompt(event);
    const raw = await this.generateWithTimeout(prompt);
    return AIResponseValidator.validateRisks(raw);
  }

  public async chat(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    context?: Partial<EventModel>
  ): Promise<{ responseText: string; suggestedPlan?: EventPlan }> {
    const prompt = PromptBuilder.buildChatPrompt(messages, context);
    const raw = await this.generateWithTimeout(prompt);

    // Check if the chat response embeds a complete JSON plan
    let suggestedPlan: EventPlan | undefined = undefined;
    try {
      if (raw.includes('"estimatedBudget"') && raw.includes('"timeline"')) {
        suggestedPlan = AIResponseValidator.validateEventPlan(raw);
      }
    } catch {
      // Chat text does not contain a full structured plan; this is normal
    }

    return {
      responseText: raw.trim(),
      suggestedPlan,
    };
  }
}
