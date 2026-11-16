import { currencyDigits } from "./money";
import { toMonthly, toYearly } from "./normalize";
import type { ExchangeRates, Subscription } from "./types";

export function rateFor(currency: string, base: string, rates: ExchangeRates): number | null {
  if (currency === base) return 1;
  const rate = rates[currency];
  return typeof rate === "number" && Number.isFinite(rate) && rate > 0 ? rate : null;
}

export function convertMinor(
  amountMinor: number,
  from: string,
  base: string,
  rates: ExchangeRates,
): number | null {
  if (from === base) return amountMinor;
  const rate = rateFor(from, base, rates);
  if (rate === null) return null;
  const major = amountMinor / 10 ** currencyDigits(from);
  return major * rate * 10 ** currencyDigits(base);
}

export interface Totals {
  monthly: number;
  yearly: number;
  missingRates: string[];
}

export function computeTotals(
  subscriptions: readonly Subscription[],
  base: string,
  rates: ExchangeRates,
): Totals {
  let monthly = 0;
  let yearly = 0;
  const missing = new Set<string>();
  for (const sub of subscriptions) {
    if (!sub.isActive) continue;
    const converted = convertMinor(sub.amount, sub.currency, base, rates);
    if (converted === null) {
      missing.add(sub.currency);
      continue;
    }
    monthly += toMonthly(converted, sub.billingPeriod);
    yearly += toYearly(converted, sub.billingPeriod);
  }
  return { monthly, yearly, missingRates: [...missing].sort() };
}

export function monthlyByCategory(
  subscriptions: readonly Subscription[],
  base: string,
  rates: ExchangeRates,
  uncategorizedLabel = "Uncategorized",
): { category: string; monthly: number }[] {
  const map = new Map<string, number>();
  for (const sub of subscriptions) {
    if (!sub.isActive) continue;
    const converted = convertMinor(sub.amount, sub.currency, base, rates);
    if (converted === null) continue;
    const key = sub.category?.trim() || uncategorizedLabel;
    map.set(key, (map.get(key) ?? 0) + toMonthly(converted, sub.billingPeriod));
  }
  return [...map.entries()]
    .map(([category, monthly]) => ({ category, monthly }))
    .sort((a, b) => b.monthly - a.monthly);
}
