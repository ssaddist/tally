import { invoke, isTauri } from "@tauri-apps/api/core";
import { useEffect } from "react";
import { dueText } from "../components/DueLabel";
import { daysUntil, upcoming } from "../domain/reminders";
import { overdueSubscriptions } from "../domain/renewal";
import { useI18n } from "../i18n/I18nProvider";
import { useAppData } from "../state/AppData";

const TRAY_DAYS = 7;

export function useTraySync(): void {
  const { status, subscriptions, today } = useAppData();
  const tr = useI18n();

  useEffect(() => {
    if (status !== "ready" || !isTauri()) return;
    const overdue = overdueSubscriptions(subscriptions, today).map((s) => tr.t("tray.overdue", { name: s.name }));
    const soon = upcoming(subscriptions, today, TRAY_DAYS).map(
      (s) => `${s.name} — ${tr.money(s.amount, s.currency)} · ${dueText(tr, daysUntil(s, today)).toLowerCase()}`,
    );
    const lines = overdue.length + soon.length ? [...overdue, ...soon] : [tr.t("tray.nothing")];
    invoke("update_tray", {
      lines,
      openLabel: tr.t("tray.open"),
      quitLabel: tr.t("tray.quit"),
      tooltip: tr.t("app.name"),
    }).catch((e) => console.warn("Tray update failed", e));
  }, [status, subscriptions, today, tr]);
}
