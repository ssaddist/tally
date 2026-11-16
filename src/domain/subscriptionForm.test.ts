import { describe, expect, it } from "vitest";
import { emptyForm, subscriptionFromForm, validateForm } from "./subscriptionForm";

describe("subscription form", () => {
  const base = { ...emptyForm("USD", "2026-03-10"), name: "Netflix", amount: "15.99" };

  it("accepts a valid form", () => {
    expect(validateForm(base)).toEqual({});
  });

  it("reports inline errors", () => {
    const errors = validateForm({ ...base, name: " ", amount: "1.999", currency: "us", cancelUrl: "ftp://x" });
    expect(errors).toEqual({ name: "required", currency: "currency", cancelUrl: "url" });
    expect(validateForm({ ...base, amount: "1.999" }).amount).toBe("amount");
  });

  it("builds a subscription and rolls a past date forward", () => {
    const sub = subscriptionFromForm(
      { ...base, nextPaymentDate: "2026-01-31", currency: "usd" },
      "2026-03-10",
      undefined,
      () => "new-id",
    );
    expect(sub).toMatchObject({
      id: "new-id",
      amount: 1599,
      currency: "USD",
      nextPaymentDate: "2026-03-31",
      anchorDay: 31,
      cancelUrl: null,
      trialEndsAt: null,
    });
  });

  it("keeps a past date for manual plans so they show as overdue", () => {
    const sub = subscriptionFromForm(
      { ...base, autoRenew: false, nextPaymentDate: "2026-03-01" },
      "2026-03-10",
      undefined,
      () => "m",
    );
    expect(sub).toMatchObject({ autoRenew: false, nextPaymentDate: "2026-03-01" });
  });

  it("stores the trial end date as the first charge", () => {
    const sub = subscriptionFromForm(
      { ...base, isTrial: true, nextPaymentDate: "2026-03-17" },
      "2026-03-10",
      undefined,
      () => "t",
    );
    expect(sub.trialEndsAt).toBe("2026-03-17");
    expect(sub.nextPaymentDate).toBe("2026-03-17");
  });
});
