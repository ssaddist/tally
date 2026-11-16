import type { BillingPeriod } from "./types";

const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;

export const PAYMENTS_PER_YEAR: Record<BillingPeriod, number> = {
  weekly: WEEKS_PER_YEAR,
  monthly: MONTHS_PER_YEAR,
  yearly: 1,
};

export function toYearly(amount: number, period: BillingPeriod): number {
  return amount * PAYMENTS_PER_YEAR[period];
}

export function toMonthly(amount: number, period: BillingPeriod): number {
  return toYearly(amount, period) / MONTHS_PER_YEAR;
}
