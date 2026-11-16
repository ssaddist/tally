import { useEffect } from "react";
import { todayISO } from "../domain/dates";
import { createTranslator } from "../i18n/translate";
import { buildOverdueMessages, buildReminderMessages } from "../domain/reminderMessages";
import { dueForReminder, markNotified } from "../domain/reminders";
import { dueForOverdueReminder, markOverdueNotified } from "../domain/renewal";
import { rolloverWithPayments } from "../domain/rollover";
import { useAppData } from "../state/AppData";
import { getNotifier } from "./notifier";

export const REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000;
const DAY_CHANGE_POLL_MS = 60 * 1000;

export function useReminderScheduler(): void {
  const { status, runExclusive } = useAppData();

  useEffect(() => {
    if (status !== "ready") return;
    const notifier = getNotifier();

    const check = () =>
      runExclusive(async (repo, today) => {
        const { changed, payments } = rolloverWithPayments(await repo.listSubscriptions(), today, () =>
          crypto.randomUUID(),
        );
        if (changed.length) await repo.saveSubscriptions(changed);
        if (payments.length) await repo.addPayments(payments);

        const [subs, settings] = await Promise.all([repo.listSubscriptions(), repo.getSettings()]);
        const due = dueForReminder(subs, today, settings.reminderDaysBefore);
        const overdue = dueForOverdueReminder(subs, today);
        if (due.length + overdue.length === 0 || !(await notifier.ensurePermission())) return;

        const tr = createTranslator(settings.language);
        const messages = [...buildOverdueMessages(overdue, tr), ...buildReminderMessages(due, today, tr)];
        for (const msg of messages) await notifier.send(msg.title, msg.body);
        if (due.length) await repo.saveSubscriptions(due.map(markNotified));
        if (overdue.length) {
          const fresh = new Map((await repo.listSubscriptions()).map((s) => [s.id, s]));
          await repo.saveSubscriptions(overdue.map((s) => markOverdueNotified(fresh.get(s.id) ?? s)));
        }
      }).catch((e) => console.warn("Reminder check failed", e));

    let lastDay = todayISO();
    const checkIfNewDay = () => {
      const now = todayISO();
      if (now === lastDay) return;
      lastDay = now;
      void check();
    };

    void check();
    const timer = window.setInterval(check, REMINDER_INTERVAL_MS);
    const dayTimer = window.setInterval(checkIfNewDay, DAY_CHANGE_POLL_MS);
    window.addEventListener("focus", checkIfNewDay);
    document.addEventListener("visibilitychange", checkIfNewDay);
    return () => {
      window.clearInterval(timer);
      window.clearInterval(dayTimer);
      window.removeEventListener("focus", checkIfNewDay);
      document.removeEventListener("visibilitychange", checkIfNewDay);
    };
  }, [status, runExclusive]);
}
