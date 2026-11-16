import { addDays, addMonths, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ServiceAvatar } from "../components/ServiceAvatar";
import { Button, Card, Chevron, EmptyState, IconButton, Label, LinkButton, PageHeader } from "../components/ui";
import { paymentsInMonth, type CalendarPayment } from "../domain/calendar";
import { convertMinor } from "../domain/currency";
import { parseISODate, toISODate } from "../domain/dates";
import { useI18n } from "../i18n/I18nProvider";
import { useAppData } from "../state/AppData";

const MAX_PER_CELL = 3;

export function Calendar() {
  const { subscriptions, settings, today } = useAppData();
  const tr = useI18n();
  const { t } = tr;
  const currentMonth = startOfMonth(parseISODate(today));
  const [month, setMonth] = useState(currentMonth);

  const payments = useMemo(() => paymentsInMonth(subscriptions, month), [subscriptions, month]);
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarPayment[]>();
    for (const p of payments) map.set(p.date, [...(map.get(p.date) ?? []), p]);
    return map;
  }, [payments]);
  const total = useMemo(
    () =>
      payments.reduce((sum, p) => {
        const v = convertMinor(p.sub.amount, p.sub.currency, settings.baseCurrency, settings.exchangeRates);
        return v === null ? sum : sum + v;
      }, 0),
    [payments, settings],
  );

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    const list: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) list.push(d);
    return list;
  }, [month]);

  if (subscriptions.length === 0) {
    return (
      <>
        <PageHeader title={t("calendar.title")} />
        <Card>
          <EmptyState
            message={t("calendar.noSubs")}
            action={
              <LinkButton to="/subscriptions/new" variant="primary">
                {t("list.add")}
              </LinkButton>
            }
          />
        </Card>
      </>
    );
  }

  const monthTitle = format(month, "LLLL yyyy", { locale: tr.dateLocale });
  const atCurrent = month.getTime() <= currentMonth.getTime();

  return (
    <>
      <PageHeader title={t("calendar.title")} />
      <Card>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <IconButton
              label={t("calendar.prev")}
              disabled={atCurrent}
              onClick={() => setMonth((m) => addMonths(m, -1))}
            >
              <Chevron dir="left" />
            </IconButton>
            <h2 className="m-0 min-w-[144px] flex-1 text-center text-h2 font-semibold first-letter:uppercase sm:flex-none">
              {monthTitle}
            </h2>
            <IconButton label={t("calendar.next")} onClick={() => setMonth((m) => addMonths(m, 1))}>
              <Chevron dir="right" />
            </IconButton>
            {!atCurrent && (
              <Button variant="ghost" onClick={() => setMonth(currentMonth)}>
                {t("calendar.today")}
              </Button>
            )}
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4 sm:block sm:border-0 sm:pt-0 sm:text-right">
            <Label>
              {t("calendar.monthTotal")} · {t("calendar.paymentsCount", { n: payments.length })}
            </Label>
            <p className="figure m-0">{tr.money(total, settings.baseCurrency)}</p>
          </div>
        </div>

        <div className="hidden sm:block">
          <div className="grid grid-cols-7 gap-1">
            {days.slice(0, 7).map((d) => (
              <div key={d.toISOString()} className="px-1 pb-1 text-label text-muted first-letter:uppercase">
                {format(d, "EEEEEE", { locale: tr.dateLocale })}
              </div>
            ))}
            {days.map((d) => {
              const iso = toISODate(d);
              const items = byDate.get(iso) ?? [];
              const inMonth = isSameMonth(d, month);
              const isToday = iso === today;
              return (
                <div
                  key={iso}
                  className={`min-h-[88px] rounded-[3px] border p-1 ${
                    isToday ? "border-text" : "border-border"
                  } ${inMonth ? "bg-transparent" : "bg-transparent opacity-40"}`}
                >
                  <div className={`text-label ${isToday ? "font-semibold text-accent" : "text-muted"}`}>
                    {d.getDate()}
                  </div>
                  {inMonth &&
                    items.slice(0, MAX_PER_CELL).map((p) => (
                      <Link
                        key={p.sub.id}
                        to={`/subscriptions/${p.sub.id}`}
                        title={`${p.sub.name} · ${tr.money(p.sub.amount, p.sub.currency)}`}
                        className="mt-1 flex items-center gap-1 truncate rounded-[2px] text-label text-text no-underline hover:underline"
                      >
                        <ServiceAvatar name={p.sub.name} size={16} />
                        <span className="truncate">{p.sub.name}</span>
                      </Link>
                    ))}
                  {inMonth && items.length > MAX_PER_CELL && (
                    <div className="mt-1 text-label text-muted">{t("calendar.more", { n: items.length - MAX_PER_CELL })}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="sm:hidden">
          {payments.length === 0 ? (
            <EmptyState message={t("calendar.empty")} />
          ) : (
            <ul className="m-0 list-none p-0">
              {payments.map((p) => (
                <li key={`${p.date}-${p.sub.id}`} className="border-t border-border first:border-t-0">
                  <Link
                    to={`/subscriptions/${p.sub.id}`}
                    className="flex items-center gap-2 py-2 text-text no-underline"
                  >
                    <ServiceAvatar name={p.sub.name} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-semibold">{p.sub.name}</span>
                      <span className="text-label text-muted">{tr.date(p.date, "d MMMM, EEEE")}</span>
                    </span>
                    <span>{tr.money(p.sub.amount, p.sub.currency)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        {payments.length === 0 && <p className="m-0 mt-4 hidden text-muted sm:block">{t("calendar.empty")}</p>}
      </Card>
    </>
  );
}
