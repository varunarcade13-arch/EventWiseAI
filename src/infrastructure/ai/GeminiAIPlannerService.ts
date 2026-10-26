import { AIPlannerService } from "@/application/interfaces/AIPlannerService";
import { AIResponseValidator } from "@/infrastructure/ai/AIResponseValidator";
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
    modelName: string = "gemini-1.5-flash"
  ) {
    this.apiKey = (apiKey || "").trim();
    this.modelName = modelName;
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  private ensureConfigured(): GoogleGenerativeAI {
    if (!this.apiKey || !this.genAI) {
      throw new Error(
        "Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable in your Vercel project settings or .env.local file."
      );
    }
    return this.genAI;
  }

  private async generateWithTimeout(
    prompt: string,
    timeoutMs: number = 25000
  ): Promise<string> {
    const client = this.ensureConfigured();
    const model = client.getGenerativeModel({ model: this.modelName });

    const callPromise = model.generateContent(prompt).then((result) => {
      const response = result.response;
      const text = response.text();
      if (!text || text.trim() === "") {
        throw new Error("Received empty response from Gemini API.");
      }
      return text;
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        reject(
          new Error(
            "Gemini request timed out after 25 seconds. Please try again."
          )
        );
      }, timeoutMs);
    });

    return await Promise.race([callPromise, timeoutPromise]);
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
