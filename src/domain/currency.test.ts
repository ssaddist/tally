import { describe, expect, it } from "vitest";
import { computeTotals, convertMinor, monthlyByCategory, rateFor } from "./currency";
import { formatAmountInput, parseAmountInput } from "./money";
import { makeSub } from "./testUtils";

describe("currency conversion", () => {
  const rates = { EUR: 1.1, UAH: 0.025, JPY: 0.0067 };

  it("returns the same amount for the base currency", () => {
    expect(convertMinor(1234, "USD", "USD", {})).toBe(1234);
    expect(rateFor("USD", "USD", {})).toBe(1);
  });

  it("converts with a manual rate", () => {
    expect(convertMinor(1000, "EUR", "USD", rates)).toBeCloseTo(1100);
    expect(convertMinor(40000, "UAH", "USD", rates)).toBeCloseTo(1000);
  });

  it("respects different minor-unit digits (JPY has none)", () => {
    expect(convertMinor(1000, "JPY", "USD", rates)).toBeCloseTo(670);
    expect(convertMinor(1000, "USD", "JPY", { USD: 150 })).toBeCloseTo(1500);
  });

  it("returns null when the rate is missing or invalid", () => {
    expect(convertMinor(1000, "GBP", "USD", rates)).toBeNull();
    expect(convertMinor(1000, "GBP", "USD", { GBP: 0 })).toBeNull();
    expect(convertMinor(1000, "GBP", "USD", { GBP: Number.NaN })).toBeNull();
  });

  it("computes totals over active subscriptions and reports missing rates", () => {
    const subs = [
      makeSub({ id: "a", amount: 1000, currency: "USD", billingPeriod: "monthly" }),
      makeSub({ id: "b", amount: 12000, currency: "EUR", billingPeriod: "yearly" }),
      makeSub({ id: "c", amount: 500, currency: "GBP" }),
      makeSub({ id: "d", amount: 9999, isActive: false }),
    ];
    const totals = computeTotals(subs, "USD", rates);
    expect(totals.monthly).toBeCloseTo(1000 + 1100);
    expect(totals.yearly).toBeCloseTo(12000 + 13200);
    expect(totals.missingRates).toEqual(["GBP"]);
  });

  it("groups monthly spend by category", () => {
    const subs = [
      makeSub({ id: "a", amount: 1000, category: "Video" }),
      makeSub({ id: "b", amount: 500, category: "Video" }),
      makeSub({ id: "c", amount: 300, category: null }),
    ];
    expect(monthlyByCategory(subs, "USD", {})).toEqual([
      { category: "Video", monthly: 1500 },
      { category: "Uncategorized", monthly: 300 },
    ]);
  });
});

describe("amount input parsing", () => {
  it("parses decimal input into minor units", () => {
    expect(parseAmountInput("12.99", "USD")).toBe(1299);
    expect(parseAmountInput("12,5", "EUR")).toBe(1250);
    expect(parseAmountInput("7", "USD")).toBe(700);
    expect(parseAmountInput("1500", "JPY")).toBe(1500);
  });

  it("rejects invalid input", () => {
    expect(parseAmountInput("", "USD")).toBeNull();
    expect(parseAmountInput("-1", "USD")).toBeNull();
    expect(parseAmountInput("1.234", "USD")).toBeNull();
    expect(parseAmountInput("1.5", "JPY")).toBeNull();
    expect(parseAmountInput("abc", "USD")).toBeNull();
  });

  it("formats minor units back for editing", () => {
    expect(formatAmountInput(1299, "USD")).toBe("12.99");
    expect(formatAmountInput(1500, "JPY")).toBe("1500");
  });
});
