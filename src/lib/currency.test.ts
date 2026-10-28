import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearCurrencyFormatters, formatCurrency, getCurrencySymbol } from "./currency";

describe("currency utilities", () => {
  beforeEach(() => {
    clearCurrencyFormatters();
  });

  it("returns appropriate currency symbols", () => {
    expect(getCurrencySymbol("INR")).toBe("₹");
    expect(getCurrencySymbol("USD")).toBe("$");
    expect(getCurrencySymbol("EUR")).toBe("€");
    expect(getCurrencySymbol("GBP")).toBe("£");
    expect(getCurrencySymbol("OTHER" as unknown as import("@/types/event").CurrencyCode)).toBe("₹");
  });

  it("formats INR currency with Indian numbering system", () => {
    const formatted = formatCurrency(1500000, "INR");
    expect(formatted).toContain("15,00,000");
  });

  it("formats USD, EUR, and GBP currencies", () => {
    const usd = formatCurrency(50000, "USD");
    expect(usd).toContain("50,000");

    const eur = formatCurrency(50000, "EUR");
    expect(eur).toBeDefined();

    const gbp = formatCurrency(50000, "GBP");
    expect(gbp).toContain("50,000");
  });

  it("handles decimal formatting option", () => {
    const withDecimals = formatCurrency(1234.5, "USD", true);
    expect(withDecimals).toContain("1,234.50");
  });

  it("handles non-finite and zero amounts safely", () => {
    expect(formatCurrency(0, "INR")).toContain("0");
    expect(formatCurrency(NaN, "INR")).toContain("0");
    expect(formatCurrency(-500, "INR")).toContain("500");
  });

  it("handles default parameters", () => {
    const formatted = formatCurrency(2500);
    expect(formatted).toBeDefined();
    expect(formatted).toContain("2,500");
  });

  it("falls back gracefully when Intl.NumberFormat throws", () => {
    const spy = vi.spyOn(Intl, "NumberFormat").mockImplementationOnce(() => {
      throw new Error("Intl error");
    });
    const result = formatCurrency(1500, "INR");
    expect(result).toBe("₹1,500");
    spy.mockRestore();
  });
});
