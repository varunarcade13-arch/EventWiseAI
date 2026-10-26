import { CurrencyCode } from "@/types/event";

export function getCurrencySymbol(currency: CurrencyCode): string {
  switch (currency) {
    case "INR":
      return "₹";
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    default:
      return "₹";
  }
}

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = "INR",
  includeDecimals: boolean = false
): string {
  const safeAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0;

  let locale = "en-IN";
  if (currency === "USD") locale = "en-US";
  else if (currency === "EUR") locale = "de-DE";
  else if (currency === "GBP") locale = "en-GB";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: includeDecimals ? 2 : 0,
      minimumFractionDigits: includeDecimals ? 2 : 0,
    }).format(safeAmount);
  } catch {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${safeAmount.toLocaleString()}`;
  }
}
