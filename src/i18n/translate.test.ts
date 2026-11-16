import { describe, expect, it } from "vitest";
import { createTranslator } from "./translate";

describe("Ukrainian translator", () => {
  const uk = createTranslator("uk");

  it("uses Ukrainian plural forms", () => {
    expect(uk.t("due.inDays", { n: 1 })).toBe("Через 1 день");
    expect(uk.t("due.inDays", { n: 3 })).toBe("Через 3 дні");
    expect(uk.t("due.inDays", { n: 5 })).toBe("Через 5 днів");
    expect(uk.t("due.inDays", { n: 21 })).toBe("Через 21 день");
  });

  it("formats dates and money for Ukraine", () => {
    expect(uk.date("2026-11-18")).toBe("18 листоп. 2026");
    expect(uk.money(1799, "UAH")).toMatch(/^17,99\s₴$/);
    expect(uk.money(1799, "EUR")).toMatch(/^17,99\sEUR$/);
  });
});
