import { endOfMonth, startOfMonth } from "date-fns";
import { toISODate } from "./dates";
import { advanceDate } from "./rollover";
import type { ISODate, Subscription } from "./types";

const MAX_OCCURRENCES = 1000;

export function occurrencesBetween(sub: Subscription, from: ISODate, to: ISODate): ISODate[] {
  const result: ISODate[] = [];
  for (let k = 0; k < MAX_OCCURRENCES; k++) {
    const date = advanceDate(sub.nextPaymentDate, sub.billingPeriod, k, sub.anchorDay);
    if (date > to) break;
    if (date >= from) result.push(date);
  }
  return result;
}

export interface CalendarPayment {
  date: ISODate;
  sub: Subscription;
}

export function paymentsInMonth(subs: readonly Subscription[], monthDate: Date): CalendarPayment[] {
  const from = toISODate(startOfMonth(monthDate));
  const to = toISODate(endOfMonth(monthDate));
  return subs
    .filter((s) => s.isActive)
    .flatMap((sub) => occurrencesBetween(sub, from, to).map((date) => ({ date, sub })))
    .sort((a, b) => a.date.localeCompare(b.date) || a.sub.name.localeCompare(b.sub.name));
}
