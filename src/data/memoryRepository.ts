import type { Payment, Settings, Subscription } from "../domain/types";
import type { Repository } from "./repository";
import { decodeSettings } from "./settingsCodec";

const KEY = "subscription-monitor:preview";

export class MemoryRepository implements Repository {
  private subs = new Map<string, Subscription>();
  private settings: Settings = decodeSettings({});
  private payments = new Map<string, Payment>();

  constructor() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          subs: Subscription[];
          settings: Record<string, unknown>;
          payments?: Payment[];
        };
        parsed.subs.forEach((s) =>
          this.subs.set(s.id, {
            ...s,
            trialEndsAt: s.trialEndsAt ?? null,
            autoRenew: s.autoRenew ?? true,
            lastOverdueNotifiedFor: s.lastOverdueNotifiedFor ?? null,
          }),
        );
        parsed.payments?.forEach((p) => this.payments.set(p.id, p));
        this.settings = decodeSettings(parsed.settings);
      }
    } catch {}
  }

  private persist(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify({ subs: [...this.subs.values()], settings: this.settings, payments: [...this.payments.values()] }));
    } catch {}
  }

  async listSubscriptions(): Promise<Subscription[]> {
    return [...this.subs.values()].map((s) => ({ ...s }));
  }
  async saveSubscription(sub: Subscription): Promise<void> {
    this.subs.set(sub.id, { ...sub });
    this.persist();
  }
  async saveSubscriptions(subs: readonly Subscription[]): Promise<void> {
    subs.forEach((s) => this.subs.set(s.id, { ...s }));
    this.persist();
  }
  async deleteSubscription(id: string): Promise<void> {
    this.subs.delete(id);
    for (const p of this.payments.values()) if (p.subscriptionId === id) this.payments.delete(p.id);
    this.persist();
  }
  async listPayments(): Promise<Payment[]> {
    return [...this.payments.values()].sort(
      (a, b) => b.paidOn.localeCompare(a.paidOn) || b.createdAt.localeCompare(a.createdAt),
    );
  }
  async addPayments(payments: readonly Payment[]): Promise<void> {
    payments.forEach((p) => this.payments.set(p.id, { ...p }));
    this.persist();
  }
  async deletePayment(id: string): Promise<void> {
    this.payments.delete(id);
    this.persist();
  }
  async getSettings(): Promise<Settings> {
    return structuredClone(this.settings);
  }
  async saveSettings(settings: Settings): Promise<void> {
    this.settings = structuredClone(settings);
    this.persist();
  }
  async replaceAll(settings: Settings, subs: readonly Subscription[], payments: readonly Payment[]): Promise<void> {
    this.subs = new Map(subs.map((s) => [s.id, { ...s }]));
    this.payments = new Map(payments.map((p) => [p.id, { ...p }]));
    this.settings = structuredClone(settings);
    this.persist();
  }
}
