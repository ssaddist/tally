import { isISODate } from "./dates";
import { isCurrencyCode } from "./money";
import {
  BILLING_PERIODS,
  DEFAULT_SETTINGS,
  LANGUAGES,
  PAYMENT_KINDS,
  type Language,
  type Payment,
  type PaymentKind,
  MAX_REMINDER_DAYS,
  MIN_REMINDER_DAYS,
  THEMES,
  type BillingPeriod,
  type Settings,
  type Subscription,
  type Theme,
} from "./types";

export const LIMITS = {
  name: 100,
  category: 50,
  notes: 2000,
  url: 2048,
} as const;

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function isBillingPeriod(v: unknown): v is BillingPeriod {
  return typeof v === "string" && (BILLING_PERIODS as readonly string[]).includes(v);
}

export function isTheme(v: unknown): v is Theme {
  return typeof v === "string" && (THEMES as readonly string[]).includes(v);
}

export function isLanguage(v: unknown): v is Language {
  return typeof v === "string" && (LANGUAGES as readonly string[]).includes(v);
}

export function isValidReminderDays(v: unknown): v is number {
  return Number.isInteger(v) && (v as number) >= MIN_REMINDER_DAYS && (v as number) <= MAX_REMINDER_DAYS;
}

export function isValidRate(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v > 0 && v < 1e9;
}

type Rec = Record<string, unknown>;
const isRecord = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);

function optionalString(
  obj: Rec,
  key: string,
  max: number,
  path: string,
  errors: string[],
): string | null {
  const v = obj[key];
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string") {
    errors.push(`${path}.${key} must be a string`);
    return null;
  }
  if (v.length > max) errors.push(`${path}.${key} is longer than ${max} characters`);
  return v;
}

function isTimestamp(v: unknown): v is string {
  return typeof v === "string" && v.length <= 40 && !Number.isNaN(Date.parse(v));
}

export function validateSubscription(
  raw: unknown,
  path: string,
  errors: string[],
): Subscription | null {
  if (!isRecord(raw)) {
    errors.push(`${path} must be an object`);
    return null;
  }
  const start = errors.length;
  const { id, name, amount, currency, billingPeriod, nextPaymentDate, isActive } = raw;

  if (typeof id !== "string" || id.length === 0 || id.length > 64) errors.push(`${path}.id is invalid`);
  if (typeof name !== "string" || name.trim() === "") errors.push(`${path}.name is required`);
  else if (name.length > LIMITS.name) errors.push(`${path}.name is too long`);
  if (!Number.isSafeInteger(amount) || (amount as number) < 0)
    errors.push(`${path}.amount must be a non-negative integer (minor units)`);
  if (!isCurrencyCode(currency)) errors.push(`${path}.currency must be an ISO 4217 code`);
  if (!isBillingPeriod(billingPeriod)) errors.push(`${path}.billingPeriod must be weekly, monthly or yearly`);
  if (!isISODate(nextPaymentDate)) errors.push(`${path}.nextPaymentDate must be a yyyy-MM-dd date`);
  if (typeof isActive !== "boolean") errors.push(`${path}.isActive must be true or false`);

  const anchorRaw = raw.anchorDay;
  let anchorDay: number | null = null;
  if (anchorRaw !== undefined && anchorRaw !== null) {
    if (!Number.isInteger(anchorRaw) || (anchorRaw as number) < 1 || (anchorRaw as number) > 31)
      errors.push(`${path}.anchorDay must be 1–31`);
    else anchorDay = anchorRaw as number;
  }

  const category = optionalString(raw, "category", LIMITS.category, path, errors);
  const notes = optionalString(raw, "notes", LIMITS.notes, path, errors);
  const cancelUrl = optionalString(raw, "cancelUrl", LIMITS.url, path, errors);
  if (cancelUrl !== null && !isHttpUrl(cancelUrl)) errors.push(`${path}.cancelUrl must be an http(s) URL`);

  const trialRaw = raw.trialEndsAt;
  if (trialRaw !== undefined && trialRaw !== null && !isISODate(trialRaw))
    errors.push(`${path}.trialEndsAt must be a yyyy-MM-dd date`);

  const autoRenewRaw = raw.autoRenew;
  if (autoRenewRaw !== undefined && typeof autoRenewRaw !== "boolean") errors.push(`${path}.autoRenew must be true or false`);
  const overdueRaw = raw.lastOverdueNotifiedFor;
  if (overdueRaw !== undefined && overdueRaw !== null && !isISODate(overdueRaw))
    errors.push(`${path}.lastOverdueNotifiedFor must be a yyyy-MM-dd date`);

  const lastNotifiedRaw = raw.lastNotifiedFor;
  if (lastNotifiedRaw !== undefined && lastNotifiedRaw !== null && !isISODate(lastNotifiedRaw))
    errors.push(`${path}.lastNotifiedFor must be a yyyy-MM-dd date`);

  const now = new Date().toISOString();
  const createdAt = raw.createdAt ?? now;
  const updatedAt = raw.updatedAt ?? now;
  if (!isTimestamp(createdAt)) errors.push(`${path}.createdAt is not a valid timestamp`);
  if (!isTimestamp(updatedAt)) errors.push(`${path}.updatedAt is not a valid timestamp`);

  if (errors.length > start) return null;

  const period = billingPeriod as BillingPeriod;
  return {
    id: id as string,
    name: (name as string).trim(),
    amount: amount as number,
    currency: currency as string,
    billingPeriod: period,
    nextPaymentDate: nextPaymentDate as string,
    anchorDay:
      period === "weekly"
        ? null
        : (anchorDay ?? Number((nextPaymentDate as string).slice(8, 10))),
    category: category?.trim() || null,
    notes,
    cancelUrl,
    isActive: isActive as boolean,
    trialEndsAt: (trialRaw as string | null | undefined) ?? null,
    autoRenew: autoRenewRaw === undefined ? true : (autoRenewRaw as boolean),
    lastOverdueNotifiedFor: (overdueRaw as string | null | undefined) ?? null,
    lastNotifiedFor: (lastNotifiedRaw as string | null | undefined) ?? null,
    createdAt: createdAt as string,
    updatedAt: updatedAt as string,
  };
}

export function validatePayment(raw: unknown, path: string, errors: string[]): Payment | null {
  if (!isRecord(raw)) {
    errors.push(`${path} must be an object`);
    return null;
  }
  const start = errors.length;
  const { id, subscriptionId, paidOn, amount, currency, kind, createdAt } = raw;
  if (typeof id !== "string" || id.length === 0 || id.length > 64) errors.push(`${path}.id is invalid`);
  if (typeof subscriptionId !== "string" || subscriptionId.length === 0 || subscriptionId.length > 64)
    errors.push(`${path}.subscriptionId is invalid`);
  if (!isISODate(paidOn)) errors.push(`${path}.paidOn must be a yyyy-MM-dd date`);
  if (!Number.isSafeInteger(amount) || (amount as number) < 0) errors.push(`${path}.amount must be a non-negative integer`);
  if (!isCurrencyCode(currency)) errors.push(`${path}.currency must be an ISO 4217 code`);
  if (!(PAYMENT_KINDS as readonly unknown[]).includes(kind)) errors.push(`${path}.kind must be auto or manual`);
  if (!isTimestamp(createdAt)) errors.push(`${path}.createdAt is not a valid timestamp`);
  if (errors.length > start) return null;
  return {
    id: id as string,
    subscriptionId: subscriptionId as string,
    paidOn: paidOn as string,
    amount: amount as number,
    currency: currency as string,
    kind: kind as PaymentKind,
    createdAt: createdAt as string,
  };
}

export function validateSettings(raw: unknown, errors: string[]): Settings | null {
  if (!isRecord(raw)) {
    errors.push("settings must be an object");
    return null;
  }
  const start = errors.length;
  const { reminderDaysBefore, baseCurrency, exchangeRates, theme, language } = raw;
  if (!isValidReminderDays(reminderDaysBefore))
    errors.push(`settings.reminderDaysBefore must be an integer ${MIN_REMINDER_DAYS}–${MAX_REMINDER_DAYS}`);
  if (!isCurrencyCode(baseCurrency)) errors.push("settings.baseCurrency must be an ISO 4217 code");
  if (!isTheme(theme)) errors.push("settings.theme must be light, dark or system");
  if (language !== undefined && !isLanguage(language)) errors.push("settings.language must be ru, uk or en");

  const rates: Record<string, number> = {};
  if (!isRecord(exchangeRates)) {
    errors.push("settings.exchangeRates must be an object");
  } else {
    for (const [code, rate] of Object.entries(exchangeRates)) {
      if (!isCurrencyCode(code)) errors.push(`settings.exchangeRates: "${String(code).slice(0, 10)}" is not a currency code`);
      else if (!isValidRate(rate)) errors.push(`settings.exchangeRates.${code} must be a positive number`);
      else rates[code] = rate;
    }
  }
  if (errors.length > start) return null;
  return {
    reminderDaysBefore: reminderDaysBefore as number,
    baseCurrency: baseCurrency as string,
    exchangeRates: rates,
    theme: theme as Theme,
    language: isLanguage(language) ? language : DEFAULT_SETTINGS.language,
    languageChosen: true,
  };
}
