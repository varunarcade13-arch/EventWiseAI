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

const formatterCache = new Map<string, Intl.NumberFormat>();

export function clearCurrencyFormatters(): void {
  formatterCache.clear();
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
    const key = `${locale}_${currency}_${includeDecimals}`;
    let formatter = formatterCache.get(key);
    if (!formatter) {
      formatter = new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: includeDecimals ? 2 : 0,
        minimumFractionDigits: includeDecimals ? 2 : 0,
      });
      formatterCache.set(key, formatter);
    }
    return formatter.format(safeAmount);
  } catch {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${safeAmount.toLocaleString()}`;
  }
}

