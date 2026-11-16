import { useEffect, useState } from "react";
import { isISODate } from "../domain/dates";
import { formatAmountInput, parseAmountInput } from "../domain/money";
import { nextDateAfterRenewal } from "../domain/renewal";
import type { Subscription } from "../domain/types";
import { useI18n } from "../i18n/I18nProvider";
import { useAppData } from "../state/AppData";
import { ConfirmDialog } from "./ConfirmDialog";

export function RenewDialog({ sub, onClose }: { sub: Subscription | null; onClose(): void }) {
  const tr = useI18n();
  const { t } = tr;
  const { renew, today } = useAppData();
  const [paidOn, setPaidOn] = useState(today);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sub) return;
    setPaidOn(today);
    setAmount(formatAmountInput(sub.amount, sub.currency));
    setError(null);
  }, [sub, today]);

  const minor = sub ? parseAmountInput(amount, sub.currency) : null;
  const dateOk = isISODate(paidOn) && paidOn <= today;
  const valid = !!sub && dateOk && minor !== null;
  const next = valid ? nextDateAfterRenewal(sub, paidOn).nextPaymentDate : null;

  async function confirm() {
    if (!sub || !valid) return;
    setBusy(true);
    setError(null);
    try {
      await renew(sub.id, paidOn, minor!);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ConfirmDialog
      open={sub !== null}
      title={sub ? t("renew.title", { name: sub.name }) : ""}
      confirmLabel={t("renew.confirm")}
      busy={busy}
      confirmDisabled={!valid}
      onCancel={onClose}
      onConfirm={confirm}
    >
      {sub && (
        <div className="flex flex-col gap-4 text-text">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="renew-date" className="label">
                {t("renew.paidOn")}
              </label>
              <input
                id="renew-date"
                type="date"
                className="field"
                max={today}
                value={paidOn}
                aria-invalid={dateOk ? undefined : true}
                onChange={(e) => setPaidOn(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="renew-amount" className="label">
                {t("renew.amount")}, {sub.currency}
              </label>
              <input
                id="renew-amount"
                className="field"
                inputMode="decimal"
                value={amount}
                aria-invalid={minor === null ? true : undefined}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          {!dateOk && <p className="m-0 text-label text-danger">{t("error.date")}</p>}
          {dateOk && minor === null && <p className="m-0 text-label text-danger">{t("error.amount")}</p>}
          {next && <p className="m-0 text-muted">{t("renew.next", { date: tr.date(next) })}</p>}
          {error && (
            <p className="m-0 text-danger" role="alert">
              {t("renew.error", { msg: error })}
            </p>
          )}
        </div>
      )}
    </ConfirmDialog>
  );
}
