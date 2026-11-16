import { describe, expect, it } from "vitest";
import { isCurrencyCode } from "../domain/money";
import { isHttpUrl } from "../domain/validation";
import { cheapestPlan, PRESETS, searchPresets } from "./catalog";

describe("preset catalog", () => {
  it("has unique ids and valid data", () => {
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length);
    for (const p of PRESETS) {
      expect(p.plans.length).toBeGreaterThan(0);
      if (p.cancelUrl) expect(isHttpUrl(p.cancelUrl)).toBe(true);
      for (const plan of p.plans) {
        expect(isCurrencyCode(plan.currency)).toBe(true);
        if (plan.amount !== null) expect(Number.isSafeInteger(plan.amount) && plan.amount > 0).toBe(true);
      }
    }
  });

  it("searches by name, keyword and category", () => {
    expect(searchPresets("netf").map((p) => p.id)).toEqual(["netflix"]);
    expect(searchPresets("gemini").map((p) => p.id)).toEqual(["google-ai-pro"]);
    expect(searchPresets("", "ai").every((p) => p.category === "ai")).toBe(true);
    expect(searchPresets("zzzz")).toEqual([]);
  });

  it("picks the cheapest plan per month", () => {
    const perplexity = PRESETS.find((p) => p.id === "perplexity")!;
    expect(cheapestPlan(perplexity)).toMatchObject({ period: "yearly", amount: 20000 });
  });
});
