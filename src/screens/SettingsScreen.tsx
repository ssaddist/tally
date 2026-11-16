import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Button, Card, Cross, EmptyState, IconButton, PageHeader, SectionTitle } from "../components/ui";
import { createBackup, parseBackup, type BackupFile } from "../domain/backup";
import { isCurrencyCode } from "../domain/money";
import { MAX_REMINDER_DAYS, MIN_REMINDER_DAYS, type Language, type Theme } from "../domain/types";
import { isValidRate } from "../domain/validation";
import { useI18n } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/translate";
import { autostartSupported, getAutostart, setAutostart } from "../services/autostart";
import { defaultBackupName, readBackupFile, saveBackupFile } from "../services/backupFiles";
import { useAppData } from "../state/AppData";

const USES_TRAY = typeof navigator !== "undefined" && !/Mac/.test(navigator.userAgent);

interface RateRow {
  key: number;
  code: string;
  rate: string;
}

let rowKey = 0;
const toRows = (rates: Record<string, number>): RateRow[] =>
  Object.entries(rates)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, rate]) => ({ key: rowKey++, code, rate: String(rate) }));

function parseRate(text: string): number | null {
  const n = Number(text.trim().replace(",", "."));
  return text.trim() !== "" && isValidRate(n) ? n : null;
}

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function SettingsScreen() {
  const { settings, subscriptions, payments, today, updateSettings, replaceAll } = useAppData();
  const tr = useI18n();
  const { t } = tr;

  const [reminderDays, setReminderDays] = useState(settings.reminderDaysBefore);
  const [baseCurrency, setBaseCurrency] = useState(settings.baseCurrency);
  const [theme, setTheme] = useState<Theme>(settings.theme);
  const [language, setLanguage] = useState<Language>(settings.language);
  const [rows, setRows] = useState<RateRow[]>(() => toRows(settings.exchangeRates));
  const [submitted, setSubmitted] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const base = baseCurrency.trim().toUpperCase();
  const baseError = isCurrencyCode(base) ? null : t("error.currency");

  const rowErrors = useMemo(() => {
    const seen = new Set<string>();
    return rows.map((r): MessageKey | null => {
      const code = r.code.trim().toUpperCase();
      if (!isCurrencyCode(code)) return "settings.rateErrorCode";
      if (code === base) return "settings.rateErrorBase";
      if (seen.has(code)) return "settings.rateErrorDup";
      seen.add(code);
      return parseRate(r.rate) === null ? "settings.rateErrorValue" : null;
    });
  }, [rows, base]);

  const [autostart, setAutostartState] = useState(false);
  const [autostartError, setAutostartError] = useState<string | null>(null);
  useEffect(() => {
    getAutostart().then(setAutostartState, () => setAutostartState(false));
  }, []);
  async function toggleAutostart(on: boolean) {
    setAutostartError(null);
    try {
      await setAutostart(on);
      setAutostartState(await getAutostart());
    } catch (err) {
      setAutostartError(message(err));
    }
  }

  const missing = useMemo(() => {
    const have = new Set([base, ...rows.map((r) => r.code.trim().toUpperCase())]);
    return [...new Set(subscriptions.map((s) => s.currency))].filter((c) => !have.has(c)).sort();
  }, [subscriptions, rows, base]);

  const hasErrors = !!baseError || rowErrors.some(Boolean);

  const updateRow = (key: number, patch: Partial<RateRow>) => {
    setSaveState("idle");
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };
  const addRow = (code = "") => {
    setSaveState("idle");
    setRows((rs) => [...rs, { key: rowKey++, code, rate: "" }]);
  };

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (hasErrors) return;
    setSaveState("saving");
    try {
      const exchangeRates: Record<string, number> = {};
      for (const r of rows) exchangeRates[r.code.trim().toUpperCase()] = parseRate(r.rate)!;
      await updateSettings({ reminderDaysBefore: reminderDays, baseCurrency: base, theme, language, exchangeRates });
      setSaveState("saved");
    } catch (err) {
      setSaveError(message(err));
      setSaveState("error");
    }
  }

  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [importing, setImporting] = useState(false);

  async function onExport() {
    setBackupStatus(null);
    setImportErrors([]);
    try {
      const json = JSON.stringify(createBackup(settings, subscriptions, payments), null, 2);
      const saved = await saveBackupFile(json, defaultBackupName(today));
      if (saved) setBackupStatus(t("backup.exported", { n: subscriptions.length, path: saved }));
    } catch (err) {
      setImportErrors([t("backup.exportFailed", { msg: message(err) })]);
    }
  }

  async function onPickImport() {
    setBackupStatus(null);
    setImportErrors([]);
    try {
      const text = await readBackupFile();
      if (text === null) return;
      const result = parseBackup(text);
      if (!result.ok) setImportErrors(result.errors);
      else setPending(result.data);
    } catch (err) {
      setImportErrors([t("backup.readFailed", { msg: message(err) })]);
    }
  }

  async function onConfirmImport() {
    if (!pending) return;
    setImporting(true);
    try {
      await replaceAll(pending.settings, pending.subscriptions, pending.payments);
      const s = pending.settings;
      setReminderDays(s.reminderDaysBefore);
      setBaseCurrency(s.baseCurrency);
      setTheme(s.theme);
      setLanguage(s.language);
      setRows(toRows(s.exchangeRates));
      setBackupStatus(t("backup.imported", { n: pending.subscriptions.length }));
      setPending(null);
    } catch (err) {
      setImportErrors([t("backup.importFailed", { msg: message(err) })]);
      setPending(null);
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <PageHeader title={t("settings.title")} />

      <form onSubmit={onSave} noValidate className="flex flex-col gap-4">
        <Card>
          <SectionTitle>{t("settings.reminders")}</SectionTitle>
          <label htmlFor="reminderDays" className="label">
            {t("settings.reminderLabel")}
          </label>
          <select
            id="reminderDays"
            className="field max-w-[240px]"
            value={reminderDays}
            onChange={(e) => {
              setReminderDays(Number(e.target.value));
              setSaveState("idle");
            }}
          >
            {Array.from({ length: MAX_REMINDER_DAYS - MIN_REMINDER_DAYS + 1 }, (_, i) => i + MIN_REMINDER_DAYS).map(
              (d) => (
                <option key={d} value={d}>
                  {d === 0 ? t("settings.reminderSameDay") : t("settings.reminderDays", { n: d })}
                </option>
              ),
            )}
          </select>
        </Card>

        <Card>
          <SectionTitle>{t("settings.currency")}</SectionTitle>
          <label htmlFor="baseCurrency" className="label">
            {t("settings.baseLabel")}
          </label>
          <input
            id="baseCurrency"
            className="field max-w-[240px] uppercase"
            maxLength={3}
            value={baseCurrency}
            aria-invalid={submitted && baseError ? true : undefined}
            onChange={(e) => {
              setBaseCurrency(e.target.value.toUpperCase());
              setSaveState("idle");
            }}
          />
          {submitted && baseError && <p className="m-0 mt-1 text-label text-danger">{baseError}</p>}

          <h3 className="m-0 mt-6 mb-1 text-body font-semibold">{t("settings.rates")}</h3>
          <p className="m-0 mb-4 text-label text-muted">{t("settings.ratesHint", { base: base || "—" })}</p>

          {rows.length === 0 ? (
            <EmptyState message={t("settings.ratesEmpty")} />
          ) : (
            <ul className="m-0 mb-4 flex list-none flex-col gap-2 p-0">
              {rows.map((r, i) => (
                <li key={r.key} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-muted">1</span>
                    <input
                      className="field w-[72px] shrink-0 uppercase"
                      aria-label={t("settings.rateCode")}
                      maxLength={3}
                      value={r.code}
                      onChange={(e) => updateRow(r.key, { code: e.target.value.toUpperCase() })}
                    />
                    <span className="text-muted">=</span>
                    <input
                      className="field min-w-0 flex-1 sm:w-[140px] sm:flex-none"
                      aria-label={t("settings.rateFor", { code: r.code || "?" })}
                      inputMode="decimal"
                      placeholder="1.00"
                      value={r.rate}
                      aria-invalid={submitted && rowErrors[i] ? true : undefined}
                      onChange={(e) => updateRow(r.key, { rate: e.target.value })}
                    />
                    <span className="shrink-0 text-muted">{base}</span>
                    <IconButton
                      label={`${t("settings.rateRemove")} ${r.code}`.trim()}
                      onClick={() => {
                        setSaveState("idle");
                        setRows((rs) => rs.filter((x) => x.key !== r.key));
                      }}
                    >
                      <Cross />
                    </IconButton>
                  </div>
                  {submitted && rowErrors[i] && <p className="m-0 text-label text-danger">{t(rowErrors[i]!)}</p>}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => addRow()}>{t("settings.addRate")}</Button>
            {missing.map((c) => (
              <Button key={c} variant="ghost" onClick={() => addRow(c)}>
                {t("settings.addMissing", { code: c })}
              </Button>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>{t("settings.appearance")}</SectionTitle>
          <label htmlFor="language" className="label">
            {t("settings.language")}
          </label>
          <select
            id="language"
            className="field mb-4 max-w-[240px]"
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value as Language);
              setSaveState("idle");
            }}
          >
            <option value="uk">Українська</option>
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="label">{t("settings.theme")}</legend>
            {(
              [
                ["light", t("settings.themeLight")],
                ["dark", t("settings.themeDark")],
                ["system", t("settings.themeSystem")],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="theme"
                  value={value}
                  checked={theme === value}
                  onChange={() => {
                    setTheme(value);
                    setSaveState("idle");
                  }}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                {label}
              </label>
            ))}
          </fieldset>
        </Card>

        {autostartSupported() && (
          <Card>
            <SectionTitle>{t("settings.system")}</SectionTitle>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autostart}
                onChange={(e) => void toggleAutostart(e.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              {t("settings.autostart")}
            </label>
            <p className="m-0 mt-1 text-label text-muted">{t(USES_TRAY ? "settings.autostartHintWin" : "settings.autostartHint")}</p>
            <p className="m-0 mt-2 text-label text-muted">{t(USES_TRAY ? "settings.trayHintWin" : "settings.trayHint")}</p>
            {autostartError && (
              <p className="m-0 mt-2 text-label text-danger">{t("settings.autostartError", { msg: autostartError })}</p>
            )}
          </Card>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" variant="primary" disabled={saveState === "saving"}>
            {t("settings.save")}
          </Button>
          <span role="status" className="text-label">
            {saveState === "saved" && <span className="text-accent">{t("settings.saved")}</span>}
            {saveState === "error" && <span className="text-danger">{t("settings.saveError", { msg: saveError ?? "" })}</span>}
            {submitted && hasErrors && saveState !== "saved" && (
              <span className="text-danger">{t("settings.fixFields")}</span>
            )}
          </span>
        </div>
      </form>

      <Card className="mt-4">
        <SectionTitle>{t("backup.title")}</SectionTitle>
        <p className="m-0 mb-4 text-muted">{t("backup.desc")}</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onExport} disabled={subscriptions.length === 0}>
            {t("backup.export")}
          </Button>
          <Button onClick={onPickImport}>{t("backup.import")}</Button>
        </div>
        {subscriptions.length === 0 && (
          <p className="m-0 mt-2 text-label text-muted">{t("backup.nothing")}</p>
        )}
        {backupStatus && (
          <p className="m-0 mt-4 break-all text-accent" role="status">
            {backupStatus}
          </p>
        )}
        {importErrors.length > 0 && (
          <div className="mt-4" role="alert">
            <p className="m-0 mb-1 font-semibold text-danger">{t("backup.problems")}</p>
            <ul className="m-0 pl-4 text-label text-danger">
              {importErrors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={pending !== null}
        title={t("backup.confirmTitle")}
        confirmLabel={t("backup.confirmButton")}
        danger
        busy={importing}
        onCancel={() => setPending(null)}
        onConfirm={onConfirmImport}
      >
        {t("backup.confirmBody", {
          current: subscriptions.length,
          incoming: pending?.subscriptions.length ?? 0,
          date: pending?.exportedAt ? t("backup.exportedOn", { date: pending.exportedAt.slice(0, 10) }) : "",
        })}
      </ConfirmDialog>
    </>
  );
}
