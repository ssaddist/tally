import { describe, expect, it } from "vitest";
import { createTranslator } from "../i18n/translate";
import { buildOverdueMessages, buildReminderMessages } from "./reminderMessages";
import { makeSub } from "./testUtils";

const en = createTranslator("en");
const ru = createTranslator("ru");

describe("reminder messages", () => {
  it("sends one message per subscription when there are few", () => {
    const msgs = buildReminderMessages([makeSub({ name: "Netflix", nextPaymentDate: "2026-03-11" })], "2026-03-10", en);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.title).toBe("Netflix renews tomorrow");
  });

  it("uses a dedicated message for ending free trials", () => {
    const sub = makeSub({ name: "Claude", nextPaymentDate: "2026-03-12", trialEndsAt: "2026-03-12" });
    const [msg] = buildReminderMessages([sub], "2026-03-10", ru);
    expect(msg!.title).toBe("Claude: пробный период заканчивается через 2 дня");
    expect(msg!.body).toMatch(/^Отмените до 12 мар/);
  });

  it("tells about overdue manual subscriptions", () => {
    const [msg] = buildOverdueMessages([makeSub({ name: "VPN", nextPaymentDate: "2026-03-08" })], ru);
    expect(msg!.title).toBe("VPN: срок оплаты прошёл");
    expect(msg!.body).toMatch(/^Оплата была нужна 8 мар/);
  });

  it("summarises when many are due, with Russian plural forms", () => {
    const subs = ["A", "B", "C", "D", "E"].map((name, i) => makeSub({ id: name, name, nextPaymentDate: `2026-03-1${i}` }));
    expect(buildReminderMessages(subs, "2026-03-10", en)).toEqual([
      { title: "5 subscriptions renew soon", body: "A, B, C and 2 more." },
    ]);
    expect(buildReminderMessages(subs, "2026-03-10", ru)[0]!.title).toBe("Скоро списания по 5 подпискам");
  });
});
