import { describe, expect, it } from "vitest";
import { toMonthly, toYearly } from "./normalize";

describe("billing period normalization", () => {
  it("keeps monthly amounts and multiplies by 12 for a year", () => {
    expect(toMonthly(1000, "monthly")).toBe(1000);
    expect(toYearly(1000, "monthly")).toBe(12000);
  });

  it("spreads a yearly amount over 12 months", () => {
    expect(toMonthly(12000, "yearly")).toBe(1000);
    expect(toYearly(12000, "yearly")).toBe(12000);
  });

  it("uses 52 weeks per year for weekly amounts", () => {
    expect(toYearly(100, "weekly")).toBe(5200);
    expect(toMonthly(100, "weekly")).toBeCloseTo(433.333, 3);
  });

  it("returns zero for zero amounts", () => {
    expect(toMonthly(0, "weekly")).toBe(0);
    expect(toYearly(0, "yearly")).toBe(0);
  });
});
