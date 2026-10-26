import { AIPlannerService } from "@/application/interfaces/AIPlannerService";
import { EventRepository } from "@/application/interfaces/EventRepository";
import { RiskAnalysis } from "@/types/ai";

export class AssessRisksUseCase {
  constructor(
    private readonly aiPlannerService: AIPlannerService,
    private readonly repository: EventRepository
  ) {}

  public async execute(eventId: string, applyToEvent: boolean = false): Promise<RiskAnalysis> {
    const event = await this.repository.getById(eventId);
    if (!event) {
      throw new Error(`Event with ID "${eventId}" not found.`);
    }

    const riskAnalysis = await this.aiPlannerService.assessRisks({
      name: event.name,
      type: event.type,
      date: event.date,
      location: event.location,
      expectedGuests: event.expectedGuests,
      totalBudget: event.totalBudget,
    });

    if (applyToEvent) {
      await this.repository.save({
        ...event,
        risks: riskAnalysis.risks.map((rk, idx) => ({
          id: rk.id || `ai_risk_${Date.now()}_${idx}`,
          risk: rk.risk,
          impact: rk.impact,
          mitigation: rk.mitigation,
        })),
        updatedAt: new Date().toISOString(),
      });
    }

    return riskAnalysis;
  }
}
