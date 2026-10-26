import { describe, expect, it } from "vitest";
import { UpdateVendorStatusUseCase } from "./UpdateVendorStatusUseCase";
import { InMemoryEventRepository } from "@/infrastructure/repositories/InMemoryEventRepository";
import { EventModel } from "@/types/event";

describe("UpdateVendorStatusUseCase", () => {
  const sampleEvent: EventModel = {
    id: "evt_1",
    name: "Wedding",
    type: "wedding",
    date: "2027-01-01",
    location: "Hall",
    expectedGuests: 100,
    currency: "INR",
    totalBudget: 500000,
    budgetCategories: [],
    timeline: [],
    vendors: [
      { id: "v1", name: "Camera Studio", category: "photography", status: "not_contacted", estimatedCost: 50000 },
    ],
    recommendations: [],
    risks: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };

  it("adds vendor successfully", async () => {
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new UpdateVendorStatusUseCase(repo);

    const updated = await useCase.addVendor({
      eventId: "evt_1",
      vendor: {
        name: "Grand Ballroom",
        category: "venue",
        status: "contacted",
        estimatedCost: 200000,
        actualCost: 190000,
        contactPerson: "Manager",
        phone: "123456",
        email: "venue@test.com",
        notes: "Deposit needed",
      },
    });

    expect(updated.vendors.length).toBe(2);
    expect(updated.vendors[1]?.name).toBe("Grand Ballroom");
  });

  it("validates vendor input and handles missing event", async () => {
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new UpdateVendorStatusUseCase(repo);

    await expect(
      useCase.addVendor({ eventId: "missing", vendor: { name: "V", category: "venue", status: "booked", estimatedCost: 100 } })
    ).rejects.toThrow('Event with ID "missing" not found.');

    await expect(
      useCase.addVendor({ eventId: "evt_1", vendor: { name: "", category: "venue", status: "booked", estimatedCost: 100 } })
    ).rejects.toThrow("Vendor name is required.");
  });

  it("updates vendor fields successfully", async () => {
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new UpdateVendorStatusUseCase(repo);

    const updated = await useCase.updateVendor({
      eventId: "evt_1",
      vendorId: "v1",
      name: "Camera Studio Pro",
      category: "photography",
      status: "booked",
      estimatedCost: 60000,
      actualCost: 55000,
      contactPerson: "Vikram",
      phone: "987654",
      email: "vikram@camera.com",
      notes: "Full album included",
    });

    const vendor = updated.vendors[0];
    expect(vendor?.name).toBe("Camera Studio Pro");
    expect(vendor?.status).toBe("booked");
    expect(vendor?.actualCost).toBe(55000);

    // Partial update with no optional fields keeps existing values
    const partialUpdated = await useCase.updateVendor({
      eventId: "evt_1",
      vendorId: "v1",
    });
    expect(partialUpdated.vendors[0]?.name).toBe("Camera Studio Pro");
    expect(partialUpdated.vendors[0]?.estimatedCost).toBe(60000);
    expect(partialUpdated.vendors[0]?.actualCost).toBe(55000);
    expect(partialUpdated.vendors[0]?.contactPerson).toBe("Vikram");

    // Update with 0 estimated and actual costs
    const updatedZero = await useCase.updateVendor({
      eventId: "evt_1",
      vendorId: "v1",
      estimatedCost: 0,
      actualCost: 0,
    });
    expect(updatedZero.vendors[0]?.estimatedCost).toBe(0);
    expect(updatedZero.vendors[0]?.actualCost).toBe(0);

    // Add vendor without actualCost
    const noActual = await useCase.addVendor({
      eventId: "evt_1",
      vendor: {
        name: "DJ Rohit",
        category: "entertainment",
        estimatedCost: 30000,
      },
    });
    const dj = noActual.vendors.find((v) => v.name === "DJ Rohit");
    expect(dj?.actualCost).toBeUndefined();
    expect(dj?.status).toBe("not_contacted");

    // Add vendor with 0 estimated and 0 actual cost
    const zeroCost = await useCase.addVendor({
      eventId: "evt_1",
      vendor: {
        name: "Volunteer Usher",
        category: "miscellaneous",
        estimatedCost: 0,
        actualCost: 0,
      },
    });
    const usher = zeroCost.vendors.find((v) => v.name === "Volunteer Usher");
    expect(usher?.estimatedCost).toBe(0);
    expect(usher?.actualCost).toBe(0);
  });

  it("handles errors when updating non-existent vendor or event", async () => {
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new UpdateVendorStatusUseCase(repo);

    await expect(
      useCase.updateVendor({ eventId: "missing", vendorId: "v1" })
    ).rejects.toThrow('Event with ID "missing" not found.');

    await expect(
      useCase.updateVendor({ eventId: "evt_1", vendorId: "bad_vendor" })
    ).rejects.toThrow('Vendor "bad_vendor" not found.');
  });

  it("deletes vendor successfully", async () => {
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new UpdateVendorStatusUseCase(repo);

    const updated = await useCase.deleteVendor({ eventId: "evt_1", vendorId: "v1" });
    expect(updated.vendors.length).toBe(0);

    await expect(
      useCase.deleteVendor({ eventId: "missing", vendorId: "v1" })
    ).rejects.toThrow('Event with ID "missing" not found.');
  });
});
