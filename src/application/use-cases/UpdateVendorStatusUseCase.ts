import { EventRepository } from "@/application/interfaces/EventRepository";
import {
  EventModel,
  VendorCategory,
  VendorItem,
  VendorStatus,
} from "@/types/event";

export interface AddVendorInput {
  eventId: string;
  vendor: Omit<VendorItem, "id" | "status"> & { status?: VendorStatus };
}

export interface UpdateVendorInput {
  eventId: string;
  vendorId: string;
  name?: string;
  category?: VendorCategory;
  status?: VendorStatus;
  estimatedCost?: number;
  actualCost?: number;
  contactPerson?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface DeleteVendorInput {
  eventId: string;
  vendorId: string;
}

export class UpdateVendorStatusUseCase {
  constructor(private readonly repository: EventRepository) {}

  public async addVendor(input: AddVendorInput): Promise<EventModel> {
    const event = await this.repository.getById(input.eventId);
    if (!event) {
      throw new Error(`Event with ID "${input.eventId}" not found.`);
    }

    if (!input.vendor.name?.trim()) {
      throw new Error("Vendor name is required.");
    }

    const newVendor: VendorItem = {
      id: `vendor_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: input.vendor.name.trim(),
      category: input.vendor.category,
      status: input.vendor.status || "not_contacted",
      estimatedCost: Math.max(0, Number(input.vendor.estimatedCost) || 0),
      actualCost:
        input.vendor.actualCost !== undefined
          ? Math.max(0, Number(input.vendor.actualCost) || 0)
          : undefined,
      contactPerson: input.vendor.contactPerson?.trim() || "",
      phone: input.vendor.phone?.trim() || "",
      email: input.vendor.email?.trim() || "",
      notes: input.vendor.notes?.trim() || "",
    };

    const updatedEvent: EventModel = {
      ...event,
      vendors: [...event.vendors, newVendor],
      updatedAt: new Date().toISOString(),
    };

    return await this.repository.save(updatedEvent);
  }

  public async updateVendor(input: UpdateVendorInput): Promise<EventModel> {
    const event = await this.repository.getById(input.eventId);
    if (!event) {
      throw new Error(`Event with ID "${input.eventId}" not found.`);
    }

    const index = event.vendors.findIndex((v) => v.id === input.vendorId);
    if (index === -1) {
      throw new Error(`Vendor "${input.vendorId}" not found.`);
    }

    const current = event.vendors[index]!;
    const updatedVendor: VendorItem = {
      ...current,
      name: input.name !== undefined ? input.name.trim() : current.name,
      category: input.category !== undefined ? input.category : current.category,
      status: input.status !== undefined ? input.status : current.status,
      estimatedCost:
        input.estimatedCost !== undefined
          ? Math.max(0, Number(input.estimatedCost) || 0)
          : current.estimatedCost,
      actualCost:
        input.actualCost !== undefined
          ? Math.max(0, Number(input.actualCost) || 0)
          : current.actualCost,
      contactPerson:
        input.contactPerson !== undefined
          ? input.contactPerson.trim()
          : current.contactPerson,
      phone: input.phone !== undefined ? input.phone.trim() : current.phone,
      email: input.email !== undefined ? input.email.trim() : current.email,
      notes: input.notes !== undefined ? input.notes.trim() : current.notes,
    };

    const updatedVendors = [...event.vendors];
    updatedVendors[index] = updatedVendor;

    const updatedEvent: EventModel = {
      ...event,
      vendors: updatedVendors,
      updatedAt: new Date().toISOString(),
    };

    return await this.repository.save(updatedEvent);
  }

  public async deleteVendor(input: DeleteVendorInput): Promise<EventModel> {
    const event = await this.repository.getById(input.eventId);
    if (!event) {
      throw new Error(`Event with ID "${input.eventId}" not found.`);
    }

    const filtered = event.vendors.filter((v) => v.id !== input.vendorId);
    const updatedEvent: EventModel = {
      ...event,
      vendors: filtered,
      updatedAt: new Date().toISOString(),
    };

    return await this.repository.save(updatedEvent);
  }
}
