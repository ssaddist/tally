import { daysBetween } from "./dates";
import { advanceDate, anchorDayFor } from "./rollover";
import type { ISODate, Payment, Subscription } from "./types";

export function isOverdue(sub: Subscription, today: ISODate): boolean {
  return !sub.autoRenew && sub.isActive && sub.nextPaymentDate < today;
}

export function overdueDays(sub: Subscription, today: ISODate): number {
  return Math.max(0, daysBetween(sub.nextPaymentDate, today));
}

export function overdueSubscriptions(subs: readonly Subscription[], today: ISODate): Subscription[] {
  return subs
    .filter((s) => isOverdue(s, today))
    .sort((a, b) => a.nextPaymentDate.localeCompare(b.nextPaymentDate));
}

export function nextDateAfterRenewal(sub: Subscription, paidOn: ISODate): { nextPaymentDate: ISODate; anchorDay: number | null } {
  if (paidOn <= sub.nextPaymentDate) {
    return {
      nextPaymentDate: advanceDate(sub.nextPaymentDate, sub.billingPeriod, 1, sub.anchorDay),
      anchorDay: sub.anchorDay,
    };
  }
  const anchorDay = anchorDayFor(paidOn, sub.billingPeriod);
  return { nextPaymentDate: advanceDate(paidOn, sub.billingPeriod, 1, anchorDay), anchorDay };
}

export function renewSubscription(
  sub: Subscription,
  paidOn: ISODate,
  amount: number,
  newId: () => string,
  now: Date = new Date(),
): { sub: Subscription; payment: Payment } {
  const { nextPaymentDate, anchorDay } = nextDateAfterRenewal(sub, paidOn);
  const stamp = now.toISOString();
  return {
    sub: { ...sub, nextPaymentDate, anchorDay, trialEndsAt: null, updatedAt: stamp },
    payment: {
      id: newId(),
      subscriptionId: sub.id,
      paidOn,
      amount,
      currency: sub.currency,
      kind: "manual",
      createdAt: stamp,
    },
  };
}

export function dueForOverdueReminder(subs: readonly Subscription[], today: ISODate): Subscription[] {
  return overdueSubscriptions(subs, today).filter((s) => s.lastOverdueNotifiedFor !== s.nextPaymentDate);
}

export function markOverdueNotified(sub: Subscription): Subscription {
  return { ...sub, lastOverdueNotifiedFor: sub.nextPaymentDate };
}

export function paymentTotals(payments: readonly Payment[]): { currency: string; amount: number }[] {
  const map = new Map<string, number>();
  for (const p of payments) map.set(p.currency, (map.get(p.currency) ?? 0) + p.amount);
  return [...map.entries()].map(([currency, amount]) => ({ currency, amount }));
}
