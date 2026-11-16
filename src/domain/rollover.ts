import { addMonths, addWeeks, addYears, getDaysInMonth, setDate, startOfMonth } from "date-fns";
import { parseISODate, toISODate } from "./dates";
import type { BillingPeriod, ISODate, Payment, Subscription } from "./types";

const MAX_STEPS = 10_000;

function withAnchorDay(monthStart: Date, anchorDay: number): Date {
  return setDate(monthStart, Math.min(anchorDay, getDaysInMonth(monthStart)));
}

export function advanceDate(
  date: ISODate,
  period: BillingPeriod,
  steps: number,
  anchorDay: number | null,
): ISODate {
  const d = parseISODate(date);
  if (period === "weekly") return toISODate(addWeeks(d, steps));
  const anchor = anchorDay ?? d.getDate();
  const monthStart = startOfMonth(d);
  const target = period === "monthly" ? addMonths(monthStart, steps) : addYears(monthStart, steps);
  return toISODate(withAnchorDay(target, anchor));
}

export function rollForwardDate(
  date: ISODate,
  period: BillingPeriod,
  anchorDay: number | null,
  today: ISODate,
): ISODate {
  if (date >= today) return date;
  for (let step = 1; step <= MAX_STEPS; step++) {
    const next = advanceDate(date, period, step, anchorDay);
    if (next >= today) return next;
  }
  return today;
}

export function rolloverSubscriptions(
  subscriptions: readonly Subscription[],
  today: ISODate,
): Subscription[] {
  const changed: Subscription[] = [];
  for (const sub of subscriptions) {
    if (!sub.autoRenew) continue;
    const next = rollForwardDate(sub.nextPaymentDate, sub.billingPeriod, sub.anchorDay, today);
    const trialOver = sub.trialEndsAt !== null && sub.trialEndsAt < today;
    if (next !== sub.nextPaymentDate || trialOver) {
      changed.push({ ...sub, nextPaymentDate: next, trialEndsAt: trialOver ? null : sub.trialEndsAt });
    }
  }
  return changed;
}

export function passedPaymentDates(sub: Subscription, today: ISODate, limit = 120): ISODate[] {
  const dates: ISODate[] = [];
  for (let k = 0; k < limit; k++) {
    const date = advanceDate(sub.nextPaymentDate, sub.billingPeriod, k, sub.anchorDay);
    if (date >= today) break;
    dates.push(date);
  }
  return dates;
}

export function rolloverWithPayments(
  subscriptions: readonly Subscription[],
  today: ISODate,
  newId: () => string,
  now: Date = new Date(),
): { changed: Subscription[]; payments: Payment[] } {
  const changed = rolloverSubscriptions(subscriptions, today);
  const byId = new Map(subscriptions.map((s) => [s.id, s]));
  const payments: Payment[] = [];
  for (const updated of changed) {
    const before = byId.get(updated.id)!;
    if (!before.isActive) continue;
    for (const paidOn of passedPaymentDates(before, today)) {
      payments.push({
        id: newId(),
        subscriptionId: before.id,
        paidOn,
        amount: before.amount,
        currency: before.currency,
        kind: "auto",
        createdAt: now.toISOString(),
      });
    }
  }
  return { changed, payments };
}

export function anchorDayFor(date: ISODate, period: BillingPeriod): number | null {
  return period === "weekly" ? null : parseISODate(date).getDate();
}
