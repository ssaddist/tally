import { describe, expect, it } from "vitest";
import { advanceDate, anchorDayFor, rollForwardDate, rolloverSubscriptions } from "./rollover";
import { makeSub } from "./testUtils";

describe("advanceDate", () => {
  it("adds weeks", () => {
    expect(advanceDate("2026-01-01", "weekly", 1, null)).toBe("2026-01-08");
    expect(advanceDate("2026-12-28", "weekly", 1, null)).toBe("2027-01-04");
  });

  it("clamps to the end of short months and returns to the anchor day", () => {
    expect(advanceDate("2026-01-31", "monthly", 1, 31)).toBe("2026-02-28");
    expect(advanceDate("2026-02-28", "monthly", 1, 31)).toBe("2026-03-31");
    expect(advanceDate("2026-03-31", "monthly", 1, 31)).toBe("2026-04-30");
  });

  it("handles leap days for yearly subscriptions", () => {
    expect(advanceDate("2028-02-29", "yearly", 1, 29)).toBe("2029-02-28");
    expect(advanceDate("2029-02-28", "yearly", 3, 29)).toBe("2032-02-29");
  });

  it("falls back to the date's own day without an anchor", () => {
    expect(advanceDate("2026-05-10", "monthly", 2, null)).toBe("2026-07-10");
  });
});

describe("rollForwardDate", () => {
  it("leaves today and future dates unchanged", () => {
    expect(rollForwardDate("2026-03-10", "monthly", 10, "2026-03-10")).toBe("2026-03-10");
    expect(rollForwardDate("2026-04-01", "monthly", 1, "2026-03-10")).toBe("2026-04-01");
  });

  it("moves a past monthly date to the first date on or after today", () => {
    expect(rollForwardDate("2026-01-15", "monthly", 15, "2026-03-20")).toBe("2026-04-15");
    expect(rollForwardDate("2026-01-15", "monthly", 15, "2026-03-15")).toBe("2026-03-15");
  });

  it("skips many missed periods at once", () => {
    expect(rollForwardDate("2020-06-01", "weekly", null, "2026-01-05")).toBe("2026-01-05");
    expect(rollForwardDate("2020-06-02", "weekly", null, "2026-01-01")).toBe("2026-01-06");
    expect(rollForwardDate("2023-02-10", "yearly", 10, "2026-03-01")).toBe("2027-02-10");
  });

  it("keeps the month-end anchor across several rollovers", () => {
    expect(rollForwardDate("2026-01-31", "monthly", 31, "2026-03-05")).toBe("2026-03-31");
  });
});

describe("rolloverSubscriptions", () => {
  it("returns only changed subscriptions, including paused ones", () => {
    const subs = [
      makeSub({ id: "past", nextPaymentDate: "2026-01-15", anchorDay: 15 }),
      makeSub({ id: "future", nextPaymentDate: "2026-05-01", anchorDay: 1 }),
      makeSub({ id: "paused", nextPaymentDate: "2026-02-01", anchorDay: 1, isActive: false }),
    ];
    const changed = rolloverSubscriptions(subs, "2026-03-02");
    expect(changed.map((s) => [s.id, s.nextPaymentDate])).toEqual([
      ["past", "2026-03-15"],
      ["paused", "2026-04-01"],
    ]);
  });

  it("turns an ended free trial into a regular subscription", () => {
    const trial = makeSub({ id: "t", nextPaymentDate: "2026-03-01", anchorDay: 1, trialEndsAt: "2026-03-01" });
    const [rolled] = rolloverSubscriptions([trial], "2026-03-02");
    expect(rolled).toMatchObject({ nextPaymentDate: "2026-04-01", trialEndsAt: null });
    const running = makeSub({ id: "r", nextPaymentDate: "2026-03-05", trialEndsAt: "2026-03-05" });
    expect(rolloverSubscriptions([running], "2026-03-02")).toEqual([]);
  });

  it("does not mutate the input", () => {
    const sub = makeSub({ nextPaymentDate: "2026-01-15" });
    rolloverSubscriptions([sub], "2026-03-02");
    expect(sub.nextPaymentDate).toBe("2026-01-15");
  });
});

describe("anchorDayFor", () => {
  it("stores the day of month for monthly/yearly only", () => {
    expect(anchorDayFor("2026-01-31", "monthly")).toBe(31);
    expect(anchorDayFor("2026-01-31", "yearly")).toBe(31);
    expect(anchorDayFor("2026-01-31", "weekly")).toBeNull();
  });
});
