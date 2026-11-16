import { describe, expect, it } from "vitest";
import { dueForReminder, markNotified, upcoming } from "./reminders";
import { rolloverSubscriptions } from "./rollover";
import { makeSub } from "./testUtils";

const TODAY = "2026-03-10";

describe("upcoming", () => {
  it("includes active subscriptions due in the window, soonest first", () => {
    const subs = [
      makeSub({ id: "later", nextPaymentDate: "2026-03-17" }),
      makeSub({ id: "today", nextPaymentDate: "2026-03-10" }),
      makeSub({ id: "outside", nextPaymentDate: "2026-03-18" }),
      makeSub({ id: "paused", nextPaymentDate: "2026-03-11", isActive: false }),
    ];
    expect(upcoming(subs, TODAY, 7).map((s) => s.id)).toEqual(["today", "later"]);
  });
});

describe("notification de-duplication", () => {
  it("selects subscriptions due within reminderDaysBefore", () => {
    const subs = [
      makeSub({ id: "in2", nextPaymentDate: "2026-03-12" }),
      makeSub({ id: "in3", nextPaymentDate: "2026-03-13" }),
    ];
    expect(dueForReminder(subs, TODAY, 2).map((s) => s.id)).toEqual(["in2"]);
  });

  it("with 0 days only notifies on the payment day", () => {
    const subs = [
      makeSub({ id: "today", nextPaymentDate: TODAY }),
      makeSub({ id: "tomorrow", nextPaymentDate: "2026-03-11" }),
    ];
    expect(dueForReminder(subs, TODAY, 0).map((s) => s.id)).toEqual(["today"]);
  });

  it("does not notify twice for the same payment date", () => {
    const sub = makeSub({ nextPaymentDate: "2026-03-11" });
    const first = dueForReminder([sub], TODAY, 2);
    expect(first).toHaveLength(1);
    const notified = markNotified(first[0]!);
    expect(notified.lastNotifiedFor).toBe("2026-03-11");
    expect(dueForReminder([notified], TODAY, 2)).toHaveLength(0);
    expect(dueForReminder([notified], "2026-03-11", 2)).toHaveLength(0);
  });

  it("notifies again for the next payment date after rollover", () => {
    const notified = markNotified(makeSub({ nextPaymentDate: "2026-03-11", anchorDay: 11 }));
    const [rolled] = rolloverSubscriptions([notified], "2026-04-10");
    expect(rolled!.nextPaymentDate).toBe("2026-04-11");
    expect(dueForReminder([rolled!], "2026-04-10", 2)).toHaveLength(1);
  });

  it("skips paused subscriptions", () => {
    const sub = makeSub({ nextPaymentDate: "2026-03-11", isActive: false });
    expect(dueForReminder([sub], TODAY, 2)).toHaveLength(0);
  });
});
