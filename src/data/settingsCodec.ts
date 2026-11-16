import { isCurrencyCode } from "../domain/money";
import { DEFAULT_SETTINGS, type Settings } from "../domain/types";
import { isLanguage, isTheme, isValidRate, isValidReminderDays } from "../domain/validation";
import { detectLanguage } from "../i18n/translate";

export function decodeSettings(values: Record<string, unknown>): Settings {
  const rates: Record<string, number> = {};
  const rawRates = values.exchangeRates;
  if (rawRates && typeof rawRates === "object" && !Array.isArray(rawRates)) {
    for (const [code, rate] of Object.entries(rawRates)) {
      if (isCurrencyCode(code) && isValidRate(rate)) rates[code] = rate;
    }
  }
  return {
    reminderDaysBefore: isValidReminderDays(values.reminderDaysBefore)
      ? values.reminderDaysBefore
      : DEFAULT_SETTINGS.reminderDaysBefore,
    baseCurrency: isCurrencyCode(values.baseCurrency) ? values.baseCurrency : DEFAULT_SETTINGS.baseCurrency,
    exchangeRates: rates,
    theme: isTheme(values.theme) ? values.theme : DEFAULT_SETTINGS.theme,
    language: isLanguage(values.language) ? values.language : detectLanguage(),
    languageChosen:
      values.languageChosen === true || (values.languageChosen === undefined && isLanguage(values.language)),
  };
}
