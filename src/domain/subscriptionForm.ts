import { isISODate } from "./dates";
import { formatAmountInput, isCurrencyCode, parseAmountInput } from "./money";
import { anchorDayFor, rollForwardDate } from "./rollover";
import type { BillingPeriod, Subscription } from "./types";
import { isHttpUrl, LIMITS } from "./validation";

export interface SubscriptionFormValues {
  name: string;
  amount: string;
  currency: string;
  billingPeriod: BillingPeriod;
  nextPaymentDate: string;
  isTrial: boolean;
  autoRenew: boolean;
  category: string;
  cancelUrl: string;
  notes: string;
  isActive: boolean;
}

export type FormErrorCode = "required" | "tooLong" | "currency" | "amount" | "date" | "url";
export type FormErrors = Partial<Record<keyof SubscriptionFormValues, FormErrorCode>>;

export const FIELD_LIMITS: Partial<Record<keyof SubscriptionFormValues, number>> = {
  name: LIMITS.name,
  category: LIMITS.category,
  notes: LIMITS.notes,
  cancelUrl: LIMITS.url,
};

export function emptyForm(currency: string, today: string): SubscriptionFormValues {
  return {
    name: "",
    amount: "",
    currency,
    billingPeriod: "monthly",
    nextPaymentDate: today,
    isTrial: false,
    autoRenew: true,
    category: "",
    cancelUrl: "",
    notes: "",
    isActive: true,
  };
}

export function formFromSubscription(s: Subscription): SubscriptionFormValues {
  return {
    name: s.name,
    amount: formatAmountInput(s.amount, s.currency),
    currency: s.currency,
    billingPeriod: s.billingPeriod,
    nextPaymentDate: s.nextPaymentDate,
    isTrial: s.trialEndsAt !== null,
    autoRenew: s.autoRenew,
    category: s.category ?? "",
    cancelUrl: s.cancelUrl ?? "",
    notes: s.notes ?? "",
    isActive: s.isActive,
  };
}

export function validateForm(v: SubscriptionFormValues): FormErrors {
  const e: FormErrors = {};
  const name = v.name.trim();
  if (!name) e.name = "required";
  else if (name.length > LIMITS.name) e.name = "tooLong";

  const currency = v.currency.trim().toUpperCase();
  if (!isCurrencyCode(currency)) e.currency = "currency";

  if (!v.amount.trim()) e.amount = "required";
  else if (isCurrencyCode(currency) && parseAmountInput(v.amount, currency) === null) e.amount = "amount";

  if (!isISODate(v.nextPaymentDate)) e.nextPaymentDate = "date";
  if (v.category.trim().length > LIMITS.category) e.category = "tooLong";
  const url = v.cancelUrl.trim();
  if (url && !isHttpUrl(url)) e.cancelUrl = "url";
  else if (url.length > LIMITS.url) e.cancelUrl = "tooLong";
  if (v.notes.length > LIMITS.notes) e.notes = "tooLong";
  return e;
}

export function subscriptionFromForm(
  v: SubscriptionFormValues,
  today: string,
  existing: Subscription | undefined,
  newId: () => string,
  now: Date = new Date(),
): Subscription {
  const currency = v.currency.trim().toUpperCase();
  const anchorDay = anchorDayFor(v.nextPaymentDate, v.billingPeriod);
  const nextPaymentDate = v.autoRenew
    ? rollForwardDate(v.nextPaymentDate, v.billingPeriod, anchorDay, today)
    : v.nextPaymentDate;
  const trialEndsAt = v.isTrial && v.nextPaymentDate >= today ? v.nextPaymentDate : null;
  const stamp = now.toISOString();
  return {
    id: existing?.id ?? newId(),
    name: v.name.trim(),
    amount: parseAmountInput(v.amount, currency) ?? 0,
    currency,
    billingPeriod: v.billingPeriod,
    nextPaymentDate,
    anchorDay,
    category: v.category.trim() || null,
    notes: v.notes.trim() || null,
    cancelUrl: v.cancelUrl.trim() || null,
    isActive: v.isActive,
    trialEndsAt,
    autoRenew: v.autoRenew,
    lastOverdueNotifiedFor: existing?.lastOverdueNotifiedFor ?? null,
    lastNotifiedFor: existing?.lastNotifiedFor ?? null,
    createdAt: existing?.createdAt ?? stamp,
    updatedAt: stamp,
  };
}
