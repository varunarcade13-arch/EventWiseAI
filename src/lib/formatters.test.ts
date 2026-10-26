import { describe, expect, it } from "vitest";
import { formatDate, formatDaysRemaining, formatPercentage } from "./formatters";

describe("formatters", () => {
  it("formats dates into readable format", () => {
    expect(formatDate("2027-02-15")).toContain("2027");
    expect(formatDate("")).toBe("Date not set");
    expect(formatDate("invalid-date")).toBe("Invalid date");
  });

  it("formats days remaining for past, today, and future dates", () => {
    const past = formatDaysRemaining(-5);
    expect(past.label).toBe("5 days ago");
    expect(past.isPast).toBe(true);

    const pastOne = formatDaysRemaining(-1);
    expect(pastOne.label).toBe("1 day ago");

    const today = formatDaysRemaining(0);
    expect(today.label).toBe("Today!");
    expect(today.isToday).toBe(true);

    const futureOne = formatDaysRemaining(1);
    expect(futureOne.label).toBe("1 day left");
    expect(futureOne.isPast).toBe(false);

    const future = formatDaysRemaining(10);
    expect(future.label).toBe("10 days left");
  });

  it("formats percentage correctly", () => {
    expect(formatPercentage(75.4)).toBe("75%");
    expect(formatPercentage(88.9)).toBe("89%");
    expect(formatPercentage(NaN)).toBe("0%");
  });
});
