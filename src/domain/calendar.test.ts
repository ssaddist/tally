import { describe, expect, it } from "vitest";
import { occurrencesBetween, paymentsInMonth } from "./calendar";
import { makeSub } from "./testUtils";

describe("payment calendar", () => {
  it("projects weekly payments inside a month", () => {
    const sub = makeSub({ billingPeriod: "weekly", anchorDay: null, nextPaymentDate: "2026-03-03" });
    expect(occurrencesBetween(sub, "2026-03-01", "2026-03-31")).toEqual([
      "2026-03-03",
      "2026-03-10",
      "2026-03-17",
      "2026-03-24",
      "2026-03-31",
    ]);
  });

  it("projects monthly and yearly payments into future months", () => {
    const monthly = makeSub({ id: "m", nextPaymentDate: "2026-01-31", anchorDay: 31 });
    const yearly = makeSub({ id: "y", billingPeriod: "yearly", nextPaymentDate: "2026-02-10", anchorDay: 10 });
    expect(paymentsInMonth([monthly, yearly], new Date(2026, 1, 1)).map((p) => [p.sub.id, p.date])).toEqual([
      ["y", "2026-02-10"],
      ["m", "2026-02-28"],
    ]);
    expect(paymentsInMonth([monthly, yearly], new Date(2026, 2, 1)).map((p) => p.date)).toEqual(["2026-03-31"]);
  });

  it("skips paused subscriptions and dates before the next payment", () => {
    const paused = makeSub({ isActive: false, nextPaymentDate: "2026-03-05" });
    const later = makeSub({ id: "l", nextPaymentDate: "2026-04-05", anchorDay: 5 });
    expect(paymentsInMonth([paused, later], new Date(2026, 2, 1))).toEqual([]);
  });
});
