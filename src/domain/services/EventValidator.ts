import { CurrencyCode, EventType } from "@/types/event";

export interface EventValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export class EventValidator {
  private static readonly VALID_TYPES: EventType[] = [
    "wedding",
    "birthday",
    "community",
    "other",
  ];

  private static readonly VALID_CURRENCIES: CurrencyCode[] = [
    "INR",
    "USD",
    "EUR",
    "GBP",
  ];

  public static validate(input: {
    name?: string;
    type?: string;
    date?: string;
    location?: string;
    expectedGuests?: number;
    totalBudget?: number;
    currency?: string;
  }): EventValidationResult {
    const errors: Record<string, string> = {};

    // Name
    const trimmedName = (input.name ?? "").trim();
    if (!trimmedName) {
      errors.name = "Event name is required.";
    } else if (trimmedName.length < 2) {
      errors.name = "Event name must be at least 2 characters.";
    } else if (trimmedName.length > 120) {
      errors.name = "Event name must not exceed 120 characters.";
    }

    // Type
    if (
      !input.type ||
      !this.VALID_TYPES.includes(input.type as EventType)
    ) {
      errors.type = "Please select a valid event type.";
    }

    // Date
    if (!input.date) {
      errors.date = "Event date is required.";
    } else {
      const parsedDate = new Date(input.date);
      if (isNaN(parsedDate.getTime())) {
        errors.date = "Event date must be a valid date.";
      }
    }

    // Location
    const trimmedLocation = (input.location ?? "").trim();
    if (!trimmedLocation) {
      errors.location = "Location is required.";
    } else if (trimmedLocation.length > 200) {
      errors.location = "Location must not exceed 200 characters.";
    }

    // Guests
    if (
      input.expectedGuests === undefined ||
      input.expectedGuests === null ||
      isNaN(Number(input.expectedGuests))
    ) {
      errors.expectedGuests = "Expected guest count is required.";
    } else {
      const guests = Number(input.expectedGuests);
      if (guests < 1) {
        errors.expectedGuests = "Guest count must be at least 1.";
      } else if (!Number.isInteger(guests)) {
        errors.expectedGuests = "Guest count must be a whole number.";
      } else if (guests > 1_000_000) {
        errors.expectedGuests = "Guest count cannot exceed 1,000,000.";
      }
    }

    // Budget
    if (
      input.totalBudget === undefined ||
      input.totalBudget === null ||
      isNaN(Number(input.totalBudget))
    ) {
      errors.totalBudget = "Total budget is required.";
    } else {
      const budget = Number(input.totalBudget);
      if (budget < 0) {
        errors.totalBudget = "Total budget cannot be negative.";
      } else if (budget > 10_000_000_000) {
        errors.totalBudget = "Total budget cannot exceed 10,000,000,000.";
      }
    }

    // Currency
    if (
      !input.currency ||
      !this.VALID_CURRENCIES.includes(input.currency as CurrencyCode)
    ) {
      errors.currency = "Please select a supported currency.";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}
