import { describe, expect, it } from "vitest";
import {
  dueForOverdueReminder,
  isOverdue,
  markOverdueNotified,
  nextDateAfterRenewal,
  overdueDays,
  paymentTotals,
  renewSubscription,
} from "./renewal";
import { rolloverSubscriptions, rolloverWithPayments } from "./rollover";
import { makeSub } from "./testUtils";

const manual = (o = {}) => makeSub({ autoRenew: false, nextPaymentDate: "2026-03-10", anchorDay: 10, ...o });

describe("manual renewal", () => {
  it("does not roll manual subscriptions forward; they become overdue", () => {
    const sub = manual();
    expect(rolloverSubscriptions([sub], "2026-03-15")).toEqual([]);
    expect(isOverdue(sub, "2026-03-15")).toBe(true);
    expect(overdueDays(sub, "2026-03-15")).toBe(5);
    expect(isOverdue(sub, "2026-03-10")).toBe(false);
    expect(isOverdue({ ...sub, isActive: false }, "2026-03-15")).toBe(false);
    expect(isOverdue({ ...sub, autoRenew: true }, "2026-03-15")).toBe(false);
  });

  it("keeps the schedule when paid early or on time", () => {
    expect(nextDateAfterRenewal(manual(), "2026-03-08")).toEqual({ nextPaymentDate: "2026-04-10", anchorDay: 10 });
    expect(nextDateAfterRenewal(manual(), "2026-03-10").nextPaymentDate).toBe("2026-04-10");
  });

  it("starts a new period on the payment day when paid late", () => {
    expect(nextDateAfterRenewal(manual(), "2026-03-15")).toEqual({ nextPaymentDate: "2026-04-15", anchorDay: 15 });
    const weekly = manual({ billingPeriod: "weekly", anchorDay: null });
    expect(nextDateAfterRenewal(weekly, "2026-03-12").nextPaymentDate).toBe("2026-03-19");
  });

  it("logs a manual payment and clears a trial", () => {
    const { sub, payment } = renewSubscription(manual({ trialEndsAt: "2026-03-10" }), "2026-03-10", 999, () => "p1");
    expect(sub).toMatchObject({ nextPaymentDate: "2026-04-10", trialEndsAt: null });
    expect(payment).toMatchObject({ id: "p1", subscriptionId: "id-1", paidOn: "2026-03-10", amount: 999, kind: "manual" });
  });

  it("sends one overdue reminder per due date", () => {
    const sub = manual();
    expect(dueForOverdueReminder([sub], "2026-03-11")).toHaveLength(1);
    const notified = markOverdueNotified(sub);
    expect(dueForOverdueReminder([notified], "2026-03-12")).toHaveLength(0);
    const { sub: renewed } = renewSubscription(notified, "2026-03-12", 100, () => "p");
    expect(dueForOverdueReminder([renewed], "2026-04-13")).toHaveLength(1);
  });
});

describe("automatic payment history", () => {
  it("logs every passed charge of active auto-renewing plans", () => {
    let n = 0;
    const auto = makeSub({ id: "a", nextPaymentDate: "2026-01-15", anchorDay: 15, amount: 500 });
    const paused = makeSub({ id: "p", nextPaymentDate: "2026-01-15", anchorDay: 15, isActive: false });
    const { changed, payments } = rolloverWithPayments([auto, paused, manual({ id: "m" })], "2026-03-20", () => `x${n++}`);
    expect(changed.map((s) => s.id)).toEqual(["a", "p"]);
    expect(payments.map((p) => [p.subscriptionId, p.paidOn, p.kind])).toEqual([
      ["a", "2026-01-15", "auto"],
      ["a", "2026-02-15", "auto"],
      ["a", "2026-03-15", "auto"],
    ]);
  });

  it("sums payments per currency", () => {
    const p = (amount: number, currency: string) =>
      ({ id: "", subscriptionId: "", paidOn: "2026-01-01", amount, currency, kind: "manual", createdAt: "" }) as const;
    expect(paymentTotals([p(100, "USD"), p(250, "USD"), p(300, "EUR")])).toEqual([
      { currency: "USD", amount: 350 },
      { currency: "EUR", amount: 300 },
    ]);
  });
});
