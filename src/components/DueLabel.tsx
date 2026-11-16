import { daysUntil, WARNING_DAYS } from "../domain/reminders";
import type { Subscription } from "../domain/types";
import type { Translator } from "../i18n/translate";
import { useI18n } from "../i18n/I18nProvider";

export function dueText(tr: Translator, days: number): string {
  if (days < 0) return tr.t("due.overdueDays", { n: -days });
  if (days === 0) return tr.t("due.today");
  if (days === 1) return tr.t("due.tomorrow");
  return tr.t("due.inDays", { n: days });
}

export function DueLabel({ sub, today }: { sub: Subscription; today: string }) {
  const tr = useI18n();
  const days = daysUntil(sub, today);
  const overdue = sub.isActive && days < 0;
  const soon = sub.isActive && days <= WARNING_DAYS;
  const tone = overdue ? "font-semibold text-danger" : soon ? "font-semibold text-warning" : "";
  return (
    <span className="flex shrink-0 flex-col items-end text-right">
      <span className={tone}>{dueText(tr, days)}</span>
      <span className="text-label text-muted">{tr.date(sub.nextPaymentDate)}</span>
    </span>
  );
}
