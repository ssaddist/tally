import type { Payment, Settings, Subscription } from "../domain/types";

export interface Repository {
  listSubscriptions(): Promise<Subscription[]>;
  saveSubscription(sub: Subscription): Promise<void>;
  saveSubscriptions(subs: readonly Subscription[]): Promise<void>;
  deleteSubscription(id: string): Promise<void>;
  listPayments(): Promise<Payment[]>;
  addPayments(payments: readonly Payment[]): Promise<void>;
  deletePayment(id: string): Promise<void>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
  replaceAll(settings: Settings, subs: readonly Subscription[], payments: readonly Payment[]): Promise<void>;
}
