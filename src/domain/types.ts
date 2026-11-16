export const BILLING_PERIODS = ["weekly", "monthly", "yearly"] as const;
export type BillingPeriod = (typeof BILLING_PERIODS)[number];

export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

export const LANGUAGES = ["ru", "uk", "en"] as const;
export type Language = (typeof LANGUAGES)[number];

export type ISODate = string;

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billingPeriod: BillingPeriod;
  nextPaymentDate: ISODate;
  anchorDay: number | null;
  category: string | null;
  notes: string | null;
  cancelUrl: string | null;
  isActive: boolean;
  trialEndsAt: ISODate | null;
  autoRenew: boolean;
  lastOverdueNotifiedFor: ISODate | null;
  lastNotifiedFor: ISODate | null;
  createdAt: string;
  updatedAt: string;
}

export const PAYMENT_KINDS = ["auto", "manual"] as const;
export type PaymentKind = (typeof PAYMENT_KINDS)[number];

export interface Payment {
  id: string;
  subscriptionId: string;
  paidOn: ISODate;
  amount: number;
  currency: string;
  kind: PaymentKind;
  createdAt: string;
}

export type ExchangeRates = Record<string, number>;

export interface Settings {
  reminderDaysBefore: number;
  baseCurrency: string;
  exchangeRates: ExchangeRates;
  theme: Theme;
  language: Language;
  languageChosen: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  reminderDaysBefore: 2,
  baseCurrency: "USD",
  exchangeRates: {},
  theme: "light",
  language: "ru",
  languageChosen: false,
};

export const MIN_REMINDER_DAYS = 0;
export const MAX_REMINDER_DAYS = 7;
