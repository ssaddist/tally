import type { Payment, Settings, Subscription } from "./types";
import { validatePayment, validateSettings, validateSubscription } from "./validation";

export const BACKUP_APP_ID = "subscription-monitor";
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
export const MAX_SUBSCRIPTIONS = 5000;
export const MAX_PAYMENTS = 100_000;

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  settings: Settings;
  subscriptions: Subscription[];
  payments: Payment[];
}

export type BackupResult =
  | { ok: true; data: BackupFile }
  | { ok: false; errors: string[] };

export function createBackup(
  settings: Settings,
  subscriptions: readonly Subscription[],
  payments: readonly Payment[] = [],
  now: Date = new Date(),
): BackupFile {
  return {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    settings,
    subscriptions: [...subscriptions],
    payments: [...payments],
  };
}

const MAX_REPORTED_ERRORS = 20;

export function parseBackup(text: string): BackupResult {
  if (text.length > MAX_BACKUP_BYTES) return { ok: false, errors: ["File is too large (max 5 MB)."] };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, errors: ["File is not valid JSON."] };
  }
  return validateBackup(raw);
}

export function validateBackup(raw: unknown): BackupResult {
  const errors: string[] = [];
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: ["Backup must be a JSON object."] };
  }
  const obj = raw as Record<string, unknown>;
  if (obj.app !== BACKUP_APP_ID) errors.push("This is not a Tally backup.");
  if (obj.version !== BACKUP_VERSION) errors.push(`Unsupported backup version: ${String(obj.version).slice(0, 20)}.`);
  if (errors.length) return { ok: false, errors };

  const settings = validateSettings(obj.settings, errors);

  const subscriptions: Subscription[] = [];
  if (!Array.isArray(obj.subscriptions)) {
    errors.push("subscriptions must be an array");
  } else if (obj.subscriptions.length > MAX_SUBSCRIPTIONS) {
    errors.push(`Too many subscriptions (max ${MAX_SUBSCRIPTIONS}).`);
  } else {
    const ids = new Set<string>();
    obj.subscriptions.forEach((item, i) => {
      const sub = validateSubscription(item, `subscriptions[${i}]`, errors);
      if (!sub) return;
      if (ids.has(sub.id)) errors.push(`subscriptions[${i}].id is duplicated`);
      ids.add(sub.id);
      subscriptions.push(sub);
    });
  }

  const payments: Payment[] = [];
  if (obj.payments !== undefined) {
    if (!Array.isArray(obj.payments)) errors.push("payments must be an array");
    else if (obj.payments.length > MAX_PAYMENTS) errors.push(`Too many payments (max ${MAX_PAYMENTS}).`);
    else {
      const subIds = new Set(subscriptions.map((s) => s.id));
      const payIds = new Set<string>();
      obj.payments.forEach((item, i) => {
        const p = validatePayment(item, `payments[${i}]`, errors);
        if (!p) return;
        if (payIds.has(p.id)) errors.push(`payments[${i}].id is duplicated`);
        else if (!subIds.has(p.subscriptionId)) errors.push(`payments[${i}] refers to an unknown subscription`);
        payIds.add(p.id);
        payments.push(p);
      });
    }
  }

  if (errors.length || !settings) {
    const shown = errors.slice(0, MAX_REPORTED_ERRORS);
    if (errors.length > shown.length) shown.push(`…and ${errors.length - shown.length} more`);
    return { ok: false, errors: shown };
  }
  return {
    ok: true,
    data: {
      app: BACKUP_APP_ID,
      version: BACKUP_VERSION,
      exportedAt: typeof obj.exportedAt === "string" ? obj.exportedAt : "",
      settings,
      subscriptions,
      payments,
    },
  };
}
