import { describe, expect, it } from "vitest";
import { createBackup, parseBackup } from "./backup";
import { makeSub } from "./testUtils";
import { DEFAULT_SETTINGS } from "./types";

describe("backup import validation", () => {
  const valid = createBackup(
    { ...DEFAULT_SETTINGS, exchangeRates: { EUR: 1.08 } },
    [makeSub({ id: "a", cancelUrl: "https://example.com/cancel" }), makeSub({ id: "b", billingPeriod: "weekly", anchorDay: null })],
  );

  it("round-trips an exported backup", () => {
    const result = parseBackup(JSON.stringify(valid));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.subscriptions).toHaveLength(2);
      expect(result.data.settings.exchangeRates).toEqual({ EUR: 1.08 });
    }
  });

  it("rejects non-JSON and foreign files", () => {
    expect(parseBackup("not json").ok).toBe(false);
    expect(parseBackup(JSON.stringify({ hello: 1 })).ok).toBe(false);
    expect(parseBackup("[]").ok).toBe(false);
  });

  it("reports invalid subscription fields", () => {
    const bad = structuredClone(valid) as unknown as { subscriptions: Record<string, unknown>[] };
    bad.subscriptions[0]!.amount = 12.5;
    bad.subscriptions[0]!.nextPaymentDate = "2026-02-30";
    bad.subscriptions[1]!.cancelUrl = "javascript:alert(1)";
    const result = parseBackup(JSON.stringify(bad));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join("\n")).toMatch(/amount/);
      expect(result.errors.join("\n")).toMatch(/nextPaymentDate/);
      expect(result.errors.join("\n")).toMatch(/cancelUrl/);
    }
  });

  it("rejects duplicate ids and bad settings", () => {
    const bad = structuredClone(valid) as unknown as {
      subscriptions: Record<string, unknown>[];
      settings: Record<string, unknown>;
    };
    bad.subscriptions[1]!.id = "a";
    bad.settings.reminderDaysBefore = 9;
    bad.settings.exchangeRates = { EUR: -1 };
    const result = parseBackup(JSON.stringify(bad));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const text = result.errors.join("\n");
      expect(text).toMatch(/duplicated/);
      expect(text).toMatch(/reminderDaysBefore/);
      expect(text).toMatch(/EUR/);
    }
  });

  it("accepts older backups without payment history and validates payments", () => {
    const withPayments = createBackup(DEFAULT_SETTINGS, [makeSub({ id: "a" })], [
      { id: "p1", subscriptionId: "a", paidOn: "2026-01-15", amount: 999, currency: "USD", kind: "manual", createdAt: "2026-01-15T10:00:00.000Z" },
    ]);
    const ok = parseBackup(JSON.stringify(withPayments));
    expect(ok.ok && ok.data.payments).toHaveLength(1);

    const legacy = JSON.parse(JSON.stringify(withPayments));
    delete legacy.payments;
    delete legacy.subscriptions[0].autoRenew;
    const old = parseBackup(JSON.stringify(legacy));
    expect(old.ok && old.data.payments).toEqual([]);
    expect(old.ok && old.data.subscriptions[0]!.autoRenew).toBe(true);

    const orphan = JSON.parse(JSON.stringify(withPayments));
    orphan.payments[0].subscriptionId = "missing";
    orphan.payments[0].kind = "refund";
    const bad = parseBackup(JSON.stringify(orphan));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors.join("\n")).toMatch(/kind/);
  });

  it("derives a missing anchorDay for monthly subscriptions", () => {
    const copy = structuredClone(valid) as unknown as { subscriptions: Record<string, unknown>[] };
    delete copy.subscriptions[0]!.anchorDay;
    const result = parseBackup(JSON.stringify(copy));
    expect(result.ok && result.data.subscriptions[0]!.anchorDay).toBe(15);
  });
});
