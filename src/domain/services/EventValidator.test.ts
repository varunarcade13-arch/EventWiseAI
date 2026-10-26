import { describe, expect, it } from "vitest";
import { EventValidator } from "./EventValidator";

describe("EventValidator", () => {
  const validInput = {
    name: "Summer Music Gala",
    type: "community",
    date: "2026-08-20",
    location: "City Amphitheatre, Mumbai",
    expectedGuests: 300,
    totalBudget: 400000,
    currency: "INR",
  };

  it("passes validation for complete valid input", () => {
    const result = EventValidator.validate(validInput);
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });

  describe("name validation", () => {
    it("fails when name is missing or empty whitespace", () => {
      const res = EventValidator.validate({ ...validInput, name: "   " });
      expect(res.isValid).toBe(false);
      expect(res.errors.name).toBe("Event name is required.");

      const resUndefined = EventValidator.validate({ ...validInput, name: undefined });
      expect(resUndefined.isValid).toBe(false);
      expect(resUndefined.errors.name).toBe("Event name is required.");
    });

    it("fails when name is too short", () => {
      const res = EventValidator.validate({ ...validInput, name: "A" });
      expect(res.isValid).toBe(false);
      expect(res.errors.name).toBe("Event name must be at least 2 characters.");
    });

    it("fails when name exceeds 120 characters", () => {
      const longName = "A".repeat(125);
      const res = EventValidator.validate({ ...validInput, name: longName });
      expect(res.isValid).toBe(false);
      expect(res.errors.name).toBe("Event name must not exceed 120 characters.");
    });
  });

  describe("type validation", () => {
    it("fails when type is missing or invalid", () => {
      const res1 = EventValidator.validate({ ...validInput, type: "" });
      expect(res1.isValid).toBe(false);
      expect(res1.errors.type).toBe("Please select a valid event type.");

      const res2 = EventValidator.validate({ ...validInput, type: "unsupported_type" });
      expect(res2.isValid).toBe(false);
      expect(res2.errors.type).toBe("Please select a valid event type.");
    });
  });

  describe("date validation", () => {
    it("fails when date is missing", () => {
      const res = EventValidator.validate({ ...validInput, date: "" });
      expect(res.isValid).toBe(false);
      expect(res.errors.date).toBe("Event date is required.");
    });

    it("fails when date is not a valid date string", () => {
      const res = EventValidator.validate({ ...validInput, date: "invalid-date-xyz" });
      expect(res.isValid).toBe(false);
      expect(res.errors.date).toBe("Event date must be a valid date.");
    });
  });

  describe("location validation", () => {
    it("fails when location is empty or undefined", () => {
      const res = EventValidator.validate({ ...validInput, location: "" });
      expect(res.isValid).toBe(false);
      expect(res.errors.location).toBe("Location is required.");

      const resUndefined = EventValidator.validate({ ...validInput, location: undefined });
      expect(resUndefined.isValid).toBe(false);
      expect(resUndefined.errors.location).toBe("Location is required.");
    });

    it("fails when location exceeds 200 characters", () => {
      const longLoc = "L".repeat(205);
      const res = EventValidator.validate({ ...validInput, location: longLoc });
      expect(res.isValid).toBe(false);
      expect(res.errors.location).toBe("Location must not exceed 200 characters.");
    });
  });

  describe("expectedGuests validation", () => {
    it("fails when guests is undefined or NaN", () => {
      const res1 = EventValidator.validate({ ...validInput, expectedGuests: undefined });
      expect(res1.isValid).toBe(false);
      expect(res1.errors.expectedGuests).toBe("Expected guest count is required.");

      const res2 = EventValidator.validate({ ...validInput, expectedGuests: ("abc" as unknown as number) });
      expect(res2.isValid).toBe(false);
      expect(res2.errors.expectedGuests).toBe("Expected guest count is required.");
    });

    it("fails when guests is less than 1", () => {
      const res = EventValidator.validate({ ...validInput, expectedGuests: 0 });
      expect(res.isValid).toBe(false);
      expect(res.errors.expectedGuests).toBe("Guest count must be at least 1.");
    });

    it("fails when guests is not a whole integer", () => {
      const res = EventValidator.validate({ ...validInput, expectedGuests: 12.5 });
      expect(res.isValid).toBe(false);
      expect(res.errors.expectedGuests).toBe("Guest count must be a whole number.");
    });

    it("fails when guests exceeds 1,000,000", () => {
      const res = EventValidator.validate({ ...validInput, expectedGuests: 1000001 });
      expect(res.isValid).toBe(false);
      expect(res.errors.expectedGuests).toBe("Guest count cannot exceed 1,000,000.");
    });
  });

  describe("totalBudget validation", () => {
    it("fails when totalBudget is undefined or NaN", () => {
      const res1 = EventValidator.validate({ ...validInput, totalBudget: undefined });
      expect(res1.isValid).toBe(false);
      expect(res1.errors.totalBudget).toBe("Total budget is required.");

      const res2 = EventValidator.validate({ ...validInput, totalBudget: ("bad" as unknown as number) });
      expect(res2.isValid).toBe(false);
      expect(res2.errors.totalBudget).toBe("Total budget is required.");
    });

    it("fails when totalBudget is negative", () => {
      const res = EventValidator.validate({ ...validInput, totalBudget: -100 });
      expect(res.isValid).toBe(false);
      expect(res.errors.totalBudget).toBe("Total budget cannot be negative.");
    });

    it("fails when totalBudget exceeds 10,000,000,000", () => {
      const res = EventValidator.validate({ ...validInput, totalBudget: 10000000001 });
      expect(res.isValid).toBe(false);
      expect(res.errors.totalBudget).toBe("Total budget cannot exceed 10,000,000,000.");
    });
  });

  describe("currency validation", () => {
    it("fails when currency is missing or invalid", () => {
      const res1 = EventValidator.validate({ ...validInput, currency: "" });
      expect(res1.isValid).toBe(false);
      expect(res1.errors.currency).toBe("Please select a supported currency.");

      const res2 = EventValidator.validate({ ...validInput, currency: "BTC" });
      expect(res2.isValid).toBe(false);
      expect(res2.errors.currency).toBe("Please select a supported currency.");
    });
  });
});
