import { AIPlannerService } from "@/application/interfaces/AIPlannerService";
import { EventRepository } from "@/application/interfaces/EventRepository";
import { VendorItem } from "@/types/event";

export class GenerateVendorsUseCase {
  constructor(
    private readonly aiPlannerService: AIPlannerService,
    private readonly repository: EventRepository
  ) {}

  public async execute(eventId: string, applyToEvent: boolean = false): Promise<VendorItem[]> {
    const event = await this.repository.getById(eventId);
    if (!event) {
      throw new Error(`Event with ID "${eventId}" not found.`);
    }

    const vendors = await this.aiPlannerService.generateVendors({
      name: event.name,
      type: event.type,
      totalBudget: event.totalBudget,
      expectedGuests: event.expectedGuests,
      currency: event.currency,
    });

    const formattedVendors: VendorItem[] = vendors.map((v, idx) => ({
      id: v.id || `ai_vendor_${Date.now()}_${idx}`,
      name: v.name,
      category: v.category,
      status: v.status ?? "not_contacted",
      estimatedCost: v.estimatedCost,
      actualCost: v.actualCost,
      contactPerson: v.contactPerson ?? "",
      phone: v.phone ?? "",
      email: v.email ?? "",
      notes: v.notes ?? "",
    }));

    if (applyToEvent) {
      await this.repository.save({
        ...event,
        vendors: formattedVendors,
        updatedAt: new Date().toISOString(),
      });
    }

    return formattedVendors;
  }
}
