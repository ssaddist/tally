import { useMemo, useState, type ReactNode } from "react";
import { RenewDialog } from "../components/RenewDialog";
import { useNavigate, useParams } from "react-router-dom";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DueLabel } from "../components/DueLabel";
import { Button, Card, Cross, EmptyState, IconButton, Label, LinkButton, PageHeader, SectionTitle } from "../components/ui";
import { paymentTotals } from "../domain/renewal";
import { convertMinor } from "../domain/currency";
import { toMonthly, toYearly } from "../domain/normalize";
import { useI18n } from "../i18n/I18nProvider";
import { openExternal } from "../services/opener";
import { ServiceAvatar } from "../components/ServiceAvatar";
import { useAppData } from "../state/AppData";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <div className="break-words">{children}</div>
    </div>
  );
}

export function SubscriptionDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { getSubscription, deleteSubscription, setActive, deletePayment, payments, settings, today } = useAppData();
  const sub = getSubscription(id);
  const history = useMemo(() => payments.filter((p) => p.subscriptionId === id), [payments, id]);
  const [renewing, setRenewing] = useState(false);
  const tr = useI18n();
  const { t } = tr;
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!sub) {
    return (
      <>
        <PageHeader title={t("detail.title")} />
        <Card>
          <EmptyState
            message={t("detail.notFound")}
            action={<LinkButton to="/subscriptions">{t("form.backToList")}</LinkButton>}
          />
        </Card>
      </>
    );
  }

  const base = settings.baseCurrency;
  const converted = convertMinor(sub.amount, sub.currency, base, settings.exchangeRates);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title={sub.name}
        actions={
          <>
            {!sub.autoRenew && sub.isActive && (
              <Button variant="primary" onClick={() => setRenewing(true)} disabled={busy}>
                {t("renew.button")}
              </Button>
            )}
            <LinkButton to={`/subscriptions/${sub.id}/edit`}>{t("common.edit")}</LinkButton>
            <Button onClick={() => run(() => setActive(sub.id, !sub.isActive))} disabled={busy}>
              {sub.isActive ? t("detail.pause") : t("detail.resume")}
            </Button>
            <Button variant="danger" onClick={() => setConfirming(true)} disabled={busy}>
              {t("common.delete")}
            </Button>
          </>
        }
      />

      <Card>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <ServiceAvatar name={sub.name} size={48} />
            <div>
              <p className="m-0 text-h1 font-semibold">
                {tr.money(sub.amount, sub.currency)}{" "}
                <span className="text-body font-normal text-muted">{t(`suffix.${sub.billingPeriod}`)}</span>
              </p>
              <p className="m-0 mt-1 text-label text-muted">
                {sub.isActive ? t("detail.active") : t("detail.paused")}
              </p>
              {sub.trialEndsAt && (
                <p className="m-0 mt-1 text-label font-semibold text-warning">
                  {t("detail.trialUntil", { date: tr.date(sub.trialEndsAt) })}
                </p>
              )}
            </div>
          </div>
          <DueLabel sub={sub} today={today} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Row label={t("detail.period")}>{t(`period.${sub.billingPeriod}`)}</Row>
          <Row label={sub.trialEndsAt ? t("detail.firstCharge") : t("detail.nextPayment")}>
            {tr.date(sub.nextPaymentDate)}
          </Row>
          <Row label={t("detail.costIn", { base })}>
            {converted === null ? (
              <span className="text-muted">{t("detail.noRate", { cur: sub.currency })}</span>
            ) : (
              <>
                {tr.money(toMonthly(converted, sub.billingPeriod), base)} {t("suffix.monthly")} ·{" "}
                {tr.money(toYearly(converted, sub.billingPeriod), base)} {t("suffix.yearly")}
              </>
            )}
          </Row>
          <Row label={t("detail.renewal")}>
            {sub.autoRenew ? t("detail.renewAuto") : t("detail.renewManual")}
          </Row>
          <Row label={t("detail.category")}>{sub.category ?? <span className="text-muted">{t("common.none")}</span>}</Row>
          {sub.notes && (
            <div className="sm:col-span-2">
              <Row label={t("detail.notes")}>
                <span className="whitespace-pre-wrap">{sub.notes}</span>
              </Row>
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-border pt-4">
          {sub.cancelUrl ? (
            <div className="flex flex-col items-start gap-2">
              <Button variant="primary" onClick={() => run(() => openExternal(sub.cancelUrl!))}>
                {t("detail.openCancel")}
              </Button>
              <span className="text-label text-muted break-all">{sub.cancelUrl}</span>
            </div>
          ) : (
            <p className="m-0 text-muted">{t("detail.noCancelUrl")}</p>
          )}
        </div>

        {error && (
          <p className="m-0 mt-4 text-danger" role="alert">
            {error}
          </p>
        )}
      </Card>

      <Card className="mt-4">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <SectionTitle>{t("history.title")}</SectionTitle>
          {history.length > 0 && (
            <span className="text-label text-muted">
              {t("history.total")}:{" "}
              <span className="text-body font-semibold text-text">
                {paymentTotals(history)
                  .map((x) => tr.money(x.amount, x.currency))
                  .join(" + ")}
              </span>
            </span>
          )}
        </div>
        {history.length === 0 ? (
          <EmptyState message={t("history.empty")} />
        ) : (
          <ul className="m-0 list-none p-0">
            {history.map((p) => (
              <li key={p.id} className="flex items-center gap-4 border-t border-border py-2 first:border-t-0">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span>{tr.date(p.paidOn)}</span>
                  <span className="text-label text-muted">
                    {p.kind === "auto" ? t("history.auto") : t("history.manual")}
                  </span>
                </span>
                <span className="shrink-0">{tr.money(p.amount, p.currency)}</span>
                <IconButton label={t("history.delete")} onClick={() => run(() => deletePayment(p.id))}>
                  <Cross />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <RenewDialog sub={renewing ? sub : null} onClose={() => setRenewing(false)} />

      <ConfirmDialog
        open={confirming}
        title={t("detail.deleteTitle", { name: sub.name })}
        confirmLabel={t("common.delete")}
        danger
        busy={busy}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          run(async () => {
            await deleteSubscription(sub.id);
            setConfirming(false);
            navigate("/subscriptions", { replace: true });
          })
        }
      >
        {t("detail.deleteBody")}
      </ConfirmDialog>
    </>
  );
}
