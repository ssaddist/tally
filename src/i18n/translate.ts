import { enUS, ru as ruLocale, uk as ukLocale, type Locale } from "date-fns/locale";
import { format } from "date-fns";
import { parseISODate } from "../domain/dates";
import { formatMoney } from "../domain/money";
import type { Language } from "../domain/types";
import { en, type Entry, type MessageKey } from "./en";
import { ru } from "./ru";
import { uk } from "./uk";

export type { MessageKey } from "./en";
export type Params = Record<string, string | number>;

const DICTS: Record<Language, Record<MessageKey, Entry>> = { en, ru, uk };
const INTL_LOCALE: Record<Language, string> = { en: "en-US", ru: "ru-RU", uk: "uk-UA" };
const DATE_LOCALE: Record<Language, Locale> = { en: enUS, ru: ruLocale, uk: ukLocale };

const pluralRules = new Map<Language, Intl.PluralRules>();
function pluralCategory(lang: Language, n: number): Intl.LDMLPluralRule {
  let rules = pluralRules.get(lang);
  if (!rules) {
    rules = new Intl.PluralRules(INTL_LOCALE[lang]);
    pluralRules.set(lang, rules);
  }
  return rules.select(n);
}

function interpolate(text: string, params: Params): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
}

export interface Translator {
  lang: Language;
  t(key: MessageKey, params?: Params): string;
  money(minor: number, currency: string): string;
  date(iso: string, pattern?: string): string;
  dateLocale: Locale;
  intlLocale: string;
}

export function createTranslator(lang: Language): Translator {
  const dict = DICTS[lang];
  return {
    lang,
    t(key, params = {}) {
      const entry = dict[key] ?? en[key];
      if (typeof entry === "string") return interpolate(entry, params);
      const n = Number(params.n ?? 0);
      const form = entry[pluralCategory(lang, n) as keyof typeof entry] ?? entry.other;
      return interpolate(form, params);
    },
    money: (minor, currency) => formatMoney(minor, currency, INTL_LOCALE[lang]),
    date: (iso, pattern = "d MMM yyyy") => format(parseISODate(iso), pattern, { locale: DATE_LOCALE[lang] }),
    dateLocale: DATE_LOCALE[lang],
    intlLocale: INTL_LOCALE[lang],
  };
}

export function detectLanguage(): Language {
  const langs = typeof navigator === "undefined" ? [] : navigator.languages ?? [navigator.language];
  for (const l of langs) {
    if (/^uk\b/i.test(l)) return "uk";
    if (/^(ru|be|kk)\b/i.test(l)) return "ru";
  }
  return "en";
}
