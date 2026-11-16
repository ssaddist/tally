import type { Translator } from "../i18n/translate";
import { daysUntil } from "./reminders";
import type { ISODate, Subscription } from "./types";

export interface ReminderMessage {
  title: string;
  body: string;
}

export const MAX_INDIVIDUAL_NOTIFICATIONS = 3;

function when(tr: Translator, days: number): string {
  if (days <= 0) return tr.t("notify.when.today");
  if (days === 1) return tr.t("notify.when.tomorrow");
  return tr.t("notify.when.inDays", { n: days });
}

export function buildOverdueMessages(overdue: readonly Subscription[], tr: Translator): ReminderMessage[] {
  return overdue.map((s) => ({
    title: tr.t("notify.overdueTitle", { name: s.name }),
    body: tr.t("notify.overdueBody", { date: tr.date(s.nextPaymentDate) }),
  }));
}

export function buildReminderMessages(
  due: readonly Subscription[],
  today: ISODate,
  tr: Translator,
): ReminderMessage[] {
  if (due.length === 0) return [];
  if (due.length > MAX_INDIVIDUAL_NOTIFICATIONS) {
    const names = due.map((s) => s.name);
    return [
      {
        title: tr.t("notify.summaryTitle", { n: due.length }),
        body: tr.t("notify.summaryBody", { names: names.slice(0, 3).join(", "), rest: names.length - 3 }),
      },
    ];
  }
  return due.map((s) => {
    const params = {
      name: s.name,
      when: when(tr, daysUntil(s, today)),
      amount: tr.money(s.amount, s.currency),
      date: tr.date(s.nextPaymentDate),
    };
    const isTrial = s.trialEndsAt !== null;
    return {
      title: tr.t(isTrial ? "notify.trialTitle" : "notify.renewTitle", params),
      body: tr.t(isTrial ? "notify.trialBody" : "notify.renewBody", params),
    };
  });
}
