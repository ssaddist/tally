import { daysBetween } from "./dates";
import type { ISODate, Subscription } from "./types";

export function daysUntil(sub: Pick<Subscription, "nextPaymentDate">, today: ISODate): number {
  return daysBetween(today, sub.nextPaymentDate);
}

export function upcoming(
  subscriptions: readonly Subscription[],
  today: ISODate,
  days: number,
): Subscription[] {
  return subscriptions
    .filter((s) => {
      if (!s.isActive) return false;
      const d = daysUntil(s, today);
      return d >= 0 && d <= days;
    })
    .sort(byNextPayment);
}

export function dueForReminder(
  subscriptions: readonly Subscription[],
  today: ISODate,
  reminderDaysBefore: number,
): Subscription[] {
  return upcoming(subscriptions, today, reminderDaysBefore).filter(
    (s) => s.lastNotifiedFor !== s.nextPaymentDate,
  );
}

export function markNotified(sub: Subscription): Subscription {
  return { ...sub, lastNotifiedFor: sub.nextPaymentDate };
}

export function byNextPayment(a: Subscription, b: Subscription): number {
  return (
    a.nextPaymentDate.localeCompare(b.nextPaymentDate) || a.name.localeCompare(b.name)
  );
}

export const WARNING_DAYS = 2;
