import Database from "@tauri-apps/plugin-sql";
import type { BillingPeriod, Payment, PaymentKind, Settings, Subscription } from "../domain/types";
import type { Repository } from "./repository";
import { decodeSettings } from "./settingsCodec";

const DB_URL = "sqlite:subscriptions.db";

interface SubscriptionRow {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billing_period: BillingPeriod;
  next_payment_date: string;
  anchor_day: number | null;
  category: string | null;
  notes: string | null;
  cancel_url: string | null;
  is_active: number;
  trial_ends_at: string | null;
  auto_renew: number;
  last_overdue_notified_for: string | null;
  last_notified_for: string | null;
  created_at: string;
  updated_at: string;
}

function fromRow(r: SubscriptionRow): Subscription {
  return {
    id: r.id,
    name: r.name,
    amount: Number(r.amount),
    currency: r.currency,
    billingPeriod: r.billing_period,
    nextPaymentDate: r.next_payment_date,
    anchorDay: r.anchor_day === null ? null : Number(r.anchor_day),
    category: r.category,
    notes: r.notes,
    cancelUrl: r.cancel_url,
    isActive: Number(r.is_active) === 1,
    trialEndsAt: r.trial_ends_at,
    autoRenew: Number(r.auto_renew) !== 0,
    lastOverdueNotifiedFor: r.last_overdue_notified_for,
    lastNotifiedFor: r.last_notified_for,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const UPSERT_SQL = `
INSERT INTO subscriptions (
  id, name, amount, currency, billing_period, next_payment_date, anchor_day,
  category, notes, cancel_url, is_active, last_notified_for, created_at, updated_at, trial_ends_at,
  auto_renew, last_overdue_notified_for
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  amount = excluded.amount,
  currency = excluded.currency,
  billing_period = excluded.billing_period,
  next_payment_date = excluded.next_payment_date,
  anchor_day = excluded.anchor_day,
  category = excluded.category,
  notes = excluded.notes,
  cancel_url = excluded.cancel_url,
  is_active = excluded.is_active,
  last_notified_for = excluded.last_notified_for,
  updated_at = excluded.updated_at,
  trial_ends_at = excluded.trial_ends_at,
  auto_renew = excluded.auto_renew,
  last_overdue_notified_for = excluded.last_overdue_notified_for`;

interface PaymentRow {
  id: string;
  subscription_id: string;
  paid_on: string;
  amount: number;
  currency: string;
  kind: PaymentKind;
  created_at: string;
}

const paymentFromRow = (r: PaymentRow): Payment => ({
  id: r.id,
  subscriptionId: r.subscription_id,
  paidOn: r.paid_on,
  amount: Number(r.amount),
  currency: r.currency,
  kind: r.kind,
  createdAt: r.created_at,
});

function toParams(s: Subscription): unknown[] {
  return [
    s.id,
    s.name,
    s.amount,
    s.currency,
    s.billingPeriod,
    s.nextPaymentDate,
    s.anchorDay,
    s.category,
    s.notes,
    s.cancelUrl,
    s.isActive ? 1 : 0,
    s.lastNotifiedFor,
    s.createdAt,
    s.updatedAt,
    s.trialEndsAt,
    s.autoRenew ? 1 : 0,
    s.lastOverdueNotifiedFor,
  ];
}

export class SqliteRepository implements Repository {
  private constructor(private readonly db: Database) {}

  static async open(): Promise<SqliteRepository> {
    return new SqliteRepository(await Database.load(DB_URL));
  }

  async listSubscriptions(): Promise<Subscription[]> {
    const rows = await this.db.select<SubscriptionRow[]>(
      "SELECT * FROM subscriptions ORDER BY next_payment_date, name",
    );
    return rows.map(fromRow);
  }

  async saveSubscription(sub: Subscription): Promise<void> {
    await this.db.execute(UPSERT_SQL, toParams(sub));
  }

  async saveSubscriptions(subs: readonly Subscription[]): Promise<void> {
    for (const s of subs) await this.saveSubscription(s);
  }

  async deleteSubscription(id: string): Promise<void> {
    await this.db.execute("DELETE FROM payments WHERE subscription_id = $1", [id]);
    await this.db.execute("DELETE FROM subscriptions WHERE id = $1", [id]);
  }

  async listPayments(): Promise<Payment[]> {
    const rows = await this.db.select<PaymentRow[]>("SELECT * FROM payments ORDER BY paid_on DESC, created_at DESC");
    return rows.map(paymentFromRow);
  }

  async addPayments(payments: readonly Payment[]): Promise<void> {
    for (const p of payments) {
      await this.db.execute(
        "INSERT OR REPLACE INTO payments (id, subscription_id, paid_on, amount, currency, kind, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [p.id, p.subscriptionId, p.paidOn, p.amount, p.currency, p.kind, p.createdAt],
      );
    }
  }

  async deletePayment(id: string): Promise<void> {
    await this.db.execute("DELETE FROM payments WHERE id = $1", [id]);
  }

  async getSettings(): Promise<Settings> {
    const rows = await this.db.select<{ key: string; value: string }[]>("SELECT key, value FROM settings");
    const values: Record<string, unknown> = {};
    for (const { key, value } of rows) {
      try {
        values[key] = JSON.parse(value);
      } catch {}
    }
    return decodeSettings(values);
  }

  async saveSettings(settings: Settings): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      await this.db.execute(
        "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [key, JSON.stringify(value)],
      );
    }
  }

  async replaceAll(settings: Settings, subs: readonly Subscription[], payments: readonly Payment[]): Promise<void> {
    const previousSubs = await this.listSubscriptions();
    const previousSettings = await this.getSettings();
    const previousPayments = await this.listPayments();
    try {
      await this.writeAll(settings, subs, payments);
    } catch (error) {
      try {
        await this.writeAll(previousSettings, previousSubs, previousPayments);
      } catch {}
      throw error;
    }
  }

  private async writeAll(settings: Settings, subs: readonly Subscription[], payments: readonly Payment[]): Promise<void> {
    await this.db.execute("DELETE FROM payments");
    await this.db.execute("DELETE FROM subscriptions");
    await this.saveSubscriptions(subs);
    await this.addPayments(payments);
    await this.saveSettings(settings);
  }
}
