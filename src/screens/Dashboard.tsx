import { useMemo, useState } from "react";
import { RenewDialog } from "../components/RenewDialog";
import { Link } from "react-router-dom";
import { SpendChart } from "../components/SpendChart";
import { SubscriptionRow } from "../components/SubscriptionRow";
import { Button, Card, EmptyState, Label, LinkButton, PageHeader, SectionTitle } from "../components/ui";
import { overdueSubscriptions } from "../domain/renewal";
import type { Subscription } from "../domain/types";
import { computeTotals, monthlyByCategory } from "../domain/currency";
import { byNextPayment, upcoming } from "../domain/reminders";
import { useI18n } from "../i18n/I18nProvider";
import { useAppData } from "../state/AppData";

const UPCOMING_DAYS = 7;

export function Dashboard() {
  const { subscriptions, settings, today } = useAppData();
  const tr = useI18n();
  const { t } = tr;
  const base = settings.baseCurrency;

  const active = useMemo(() => subscriptions.filter((s) => s.isActive).sort(byNextPayment), [subscriptions]);
  const trials = useMemo(() => active.filter((s) => s.trialEndsAt !== null), [active]);
  const overdue = useMemo(() => overdueSubscriptions(subscriptions, today), [subscriptions, today]);
  const [renewing, setRenewing] = useState<Subscription | null>(null);
  const totals = useMemo(
    () => computeTotals(subscriptions, base, settings.exchangeRates),
    [subscriptions, base, settings.exchangeRates],
  );
  const soon = useMemo(() => upcoming(subscriptions, today, UPCOMING_DAYS), [subscriptions, today]);
  const byCategory = useMemo(
    () => monthlyByCategory(subscriptions, base, settings.exchangeRates, t("category.uncategorized")),
    [subscriptions, base, settings.exchangeRates, t],
  );

  const addButton = (
    <LinkButton to="/subscriptions/new" variant="primary">
      {t("list.add")}
    </LinkButton>
  );

  if (subscriptions.length === 0) {
    return (
      <>
        <PageHeader title={t("dashboard.title")} />
        <Card>
          <EmptyState message={t("dashboard.empty")} action={addButton} />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title={t("dashboard.title")} actions={addButton} />

      <dl className="m-0 mb-4 grid grid-cols-2 gap-x-6 border-t border-border pt-5 pb-8 md:grid-cols-[3fr_2fr]">
        <div>
          <dt><Label>{t("dashboard.perMonth")}</Label></dt>
          <dd className="figure m-0 mt-2 break-words">{tr.money(totals.monthly, base)}</dd>
        </div>
        <div className="border-l border-border pl-6">
          <dt><Label>{t("dashboard.perYear")}</Label></dt>
          <dd className="figure m-0 mt-2 break-words text-muted">{tr.money(totals.yearly, base)}</dd>
        </div>
      </dl>

      {totals.missingRates.length > 0 && (
        <p className="panel m-0 mb-4 border-warning text-body" role="status">
          {t("dashboard.missingRates", { codes: totals.missingRates.join(", ") })}{" "}
          <Link to="/settings" className="text-text underline">
            {t("dashboard.addRates")}
          </Link>
        </p>
      )}

      {overdue.length > 0 && (
        <Card className="mb-4 border-danger">
          <SectionTitle>{t("dashboard.renewNeeded")}</SectionTitle>
          <p className="m-0 mb-2 text-label text-muted">{t("dashboard.renewHint")}</p>
          <ul className="m-0 list-none p-0">
            {overdue.map((s) => (
              <SubscriptionRow
                key={s.id}
                sub={s}
                today={today}
                action={
                  <Button variant="primary" onClick={() => setRenewing(s)}>
                    {t("renew.button")}
                  </Button>
                }
              />
            ))}
          </ul>
        </Card>
      )}

      {trials.length > 0 && (
        <Card className="mb-4 border-warning">
          <SectionTitle>{t("dashboard.trials")}</SectionTitle>
          <p className="m-0 mb-2 text-label text-muted">{t("dashboard.trialsHint")}</p>
          <ul className="m-0 list-none p-0">
            {trials.map((s) => (
              <SubscriptionRow key={s.id} sub={s} today={today} />
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-x-12 lg:grid-cols-[3fr_2fr]">
        <Card>
          <SectionTitle>{t("dashboard.upcoming", { n: UPCOMING_DAYS })}</SectionTitle>
          {soon.length === 0 ? (
            <EmptyState message={t("dashboard.upcomingEmpty")} />
          ) : (
            <ul className="m-0 list-none p-0">
              {soon.map((s) => (
                <SubscriptionRow key={s.id} sub={s} today={today} />
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionTitle>{t("dashboard.byCategory")}</SectionTitle>
          {byCategory.length === 0 ? (
            <EmptyState message={t("dashboard.byCategoryEmpty")} />
          ) : (
            <SpendChart data={byCategory} currency={base} />
          )}
        </Card>
      </div>

      <Card>
        <SectionTitle>{t("dashboard.active")}</SectionTitle>
        {active.length === 0 ? (
          <EmptyState message={t("dashboard.activeEmpty")} />
        ) : (
          <ul className="m-0 list-none p-0">
            {active.map((s) => (
              <SubscriptionRow key={s.id} sub={s} today={today} />
            ))}
          </ul>
        )}
      </Card>

      <RenewDialog sub={renewing} onClose={() => setRenewing(null)} />
    </>
  );
}
