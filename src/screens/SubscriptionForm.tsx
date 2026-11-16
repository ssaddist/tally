import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, EmptyState, LinkButton, PageHeader } from "../components/ui";
import { formatAmountInput } from "../domain/money";
import {
  emptyForm,
  FIELD_LIMITS,
  formFromSubscription,
  subscriptionFromForm,
  validateForm,
  type SubscriptionFormValues,
} from "../domain/subscriptionForm";
import { BILLING_PERIODS, type BillingPeriod } from "../domain/types";
import { LIMITS } from "../domain/validation";
import { useI18n } from "../i18n/I18nProvider";
import { findPreset, type Preset, type PresetPlan } from "../presets/catalog";
import { useAppData } from "../state/AppData";

const COMMON_CURRENCIES = ["USD", "EUR", "GBP", "UAH", "PLN", "CHF", "CAD", "JPY"];

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="m-0 mt-1 text-label text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="m-0 mt-1 text-label text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function applyPlan(values: SubscriptionFormValues, plan: PresetPlan): SubscriptionFormValues {
  return {
    ...values,
    amount: plan.amount === null ? "" : formatAmountInput(plan.amount, plan.currency),
    currency: plan.currency,
    billingPeriod: plan.period,
  };
}

export function SubscriptionForm() {
  const { id, presetId } = useParams();
  const navigate = useNavigate();
  const tr = useI18n();
  const { t } = tr;
  const { getSubscription, saveSubscription, settings, subscriptions, today } = useAppData();
  const existing = id ? getSubscription(id) : undefined;
  const preset: Preset | undefined = presetId ? findPreset(presetId) : undefined;

  const [planIndex, setPlanIndex] = useState(0);
  const [values, setValues] = useState<SubscriptionFormValues>(() => {
    if (existing) return formFromSubscription(existing);
    const blank = emptyForm(settings.baseCurrency, today);
    if (!preset) return blank;
    return applyPlan(
      { ...blank, name: preset.name, category: t(`category.${preset.category}`), cancelUrl: preset.cancelUrl ?? "" },
      preset.plans[0]!,
    );
  });
  const initial = useRef(values);
  const [touched, setTouched] = useState<Partial<Record<keyof SubscriptionFormValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const errors = useMemo(() => validateForm(values), [values]);
  const categories = useMemo(
    () => [...new Set(subscriptions.map((s) => s.category).filter((c): c is string => !!c))].sort(),
    [subscriptions],
  );
  const currencies = useMemo(
    () => [...new Set([settings.baseCurrency, ...Object.keys(settings.exchangeRates), ...COMMON_CURRENCIES])],
    [settings],
  );

  if ((id && !existing) || (presetId && presetId !== "custom" && !preset)) {
    return (
      <>
        <PageHeader title={t("form.titleAdd")} />
        <Card>
          <EmptyState
            message={t("form.notFound")}
            action={<LinkButton to="/subscriptions">{t("form.backToList")}</LinkButton>}
          />
        </Card>
      </>
    );
  }

  const set = <K extends keyof SubscriptionFormValues>(key: K, value: SubscriptionFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const blur = (key: keyof SubscriptionFormValues) => () => {
    if (values[key] !== initial.current[key]) setTouched((tt) => ({ ...tt, [key]: true }));
  };
  const errorFor = (key: keyof SubscriptionFormValues): string | undefined => {
    const code = submitted || touched[key] ? errors[key] : undefined;
    return code ? t(`error.${code}`, { max: FIELD_LIMITS[key] ?? 0 }) : undefined;
  };
  const a11y = (key: keyof SubscriptionFormValues) => {
    const err = errorFor(key);
    return { "aria-invalid": err ? true : undefined, "aria-describedby": err ? `${key}-error` : undefined };
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      const sub = subscriptionFromForm(values, today, existing, () => crypto.randomUUID());
      await saveSubscription(sub);
      navigate(`/subscriptions/${sub.id}`, { replace: true });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title={existing ? t("form.titleEdit", { name: existing.name }) : t("form.titleAdd")} />
      <Card>
        <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {preset && (
            <div className="sm:col-span-2">
              {preset.plans.length > 1 && (
                <>
                  <span className="label">{t("form.plan")}</span>
                  <div className="mb-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t("form.plan")}>
                    {preset.plans.map((plan, i) => (
                      <button
                        key={i}
                        type="button"
                        role="radio"
                        aria-checked={planIndex === i}
                        onClick={() => {
                          setPlanIndex(i);
                          setValues((v) => applyPlan(v, plan));
                        }}
                        className={`cursor-pointer rounded-[3px] border px-2 py-1 text-left font-[inherit] ${
                          planIndex === i ? "border-text bg-surface-2 text-text" : "border-border bg-transparent text-muted hover:text-text"
                        }`}
                      >
                        <span className="block text-body font-semibold">{plan.label}</span>
                        <span className="block text-label">
                          {plan.amount === null
                            ? t(`period.${plan.period}`)
                            : `${tr.money(plan.amount, plan.currency)} ${t(`suffix.${plan.period}`)}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              <p className="m-0 text-label text-muted">{t("form.priceNote")}</p>
            </div>
          )}

          <div className="sm:col-span-2">
            <Field id="name" label={t("form.name")} error={errorFor("name")}>
              <input
                id="name"
                className="field"
                value={values.name}
                maxLength={LIMITS.name}
                autoFocus={!preset}
                onChange={(e) => set("name", e.target.value)}
                onBlur={blur("name")}
                {...a11y("name")}
              />
            </Field>
          </div>

          <Field id="amount" label={t("form.amount")} error={errorFor("amount")}>
            <input
              id="amount"
              className="field"
              inputMode="decimal"
              placeholder="9.99"
              value={values.amount}
              autoFocus={!!preset && values.amount === ""}
              onChange={(e) => set("amount", e.target.value)}
              onBlur={blur("amount")}
              {...a11y("amount")}
            />
          </Field>

          <Field id="currency" label={t("form.currency")} error={errorFor("currency")}>
            <input
              id="currency"
              className="field uppercase"
              list="currency-options"
              maxLength={3}
              value={values.currency}
              onChange={(e) => set("currency", e.target.value.toUpperCase())}
              onBlur={blur("currency")}
              {...a11y("currency")}
            />
            <datalist id="currency-options">
              {currencies.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>

          <Field id="billingPeriod" label={t("form.period")}>
            <select
              id="billingPeriod"
              className="field"
              value={values.billingPeriod}
              onChange={(e) => set("billingPeriod", e.target.value as BillingPeriod)}
            >
              {BILLING_PERIODS.map((p) => (
                <option key={p} value={p}>
                  {t(`period.${p}`)}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id="nextPaymentDate"
            label={values.isTrial ? t("form.trialEnds") : t("form.nextPayment")}
            error={errorFor("nextPaymentDate")}
            hint={values.isTrial ? t("form.trialHint") : t("form.nextPaymentHint")}
          >
            <input
              id="nextPaymentDate"
              type="date"
              className="field"
              value={values.nextPaymentDate}
              onChange={(e) => set("nextPaymentDate", e.target.value)}
              onBlur={blur("nextPaymentDate")}
              {...a11y("nextPaymentDate")}
            />
          </Field>

          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={values.isTrial}
              onChange={(e) => set("isTrial", e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            {t("form.trial")}
          </label>

          <div className="sm:col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={values.autoRenew}
                onChange={(e) => set("autoRenew", e.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              {t("form.autoRenew")}
            </label>
            {!values.autoRenew && <p className="m-0 mt-1 text-label text-muted">{t("form.autoRenewHint")}</p>}
          </div>

          <Field id="category" label={t("form.category")} error={errorFor("category")}>
            <input
              id="category"
              className="field"
              list="category-options"
              maxLength={LIMITS.category}
              value={values.category}
              onChange={(e) => set("category", e.target.value)}
              onBlur={blur("category")}
              {...a11y("category")}
            />
            <datalist id="category-options">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>

          <Field id="cancelUrl" label={t("form.cancelUrl")} error={errorFor("cancelUrl")}>
            <input
              id="cancelUrl"
              type="url"
              className="field"
              placeholder="https://"
              value={values.cancelUrl}
              onChange={(e) => set("cancelUrl", e.target.value)}
              onBlur={blur("cancelUrl")}
              {...a11y("cancelUrl")}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field id="notes" label={t("form.notes")} error={errorFor("notes")}>
              <textarea
                id="notes"
                className="field min-h-[96px] resize-y"
                maxLength={LIMITS.notes}
                value={values.notes}
                onChange={(e) => set("notes", e.target.value)}
                onBlur={blur("notes")}
                {...a11y("notes")}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            {t("form.active")}
          </label>

          {saveError && (
            <p className="m-0 text-danger sm:col-span-2" role="alert">
              {t("form.saveError", { msg: saveError })}
            </p>
          )}

          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" variant="primary" disabled={saving}>
              {existing ? t("form.save") : t("form.add")}
            </Button>
            <Button onClick={() => navigate(-1)} disabled={saving}>
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
