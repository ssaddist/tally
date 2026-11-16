import type { Subscription } from "./types";

export function makeSub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: "id-1",
    name: "Service",
    amount: 1000,
    currency: "USD",
    billingPeriod: "monthly",
    nextPaymentDate: "2026-01-15",
    anchorDay: 15,
    category: null,
    notes: null,
    cancelUrl: null,
    isActive: true,
    trialEndsAt: null,
    autoRenew: true,
    lastOverdueNotifiedFor: null,
    lastNotifiedFor: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}
