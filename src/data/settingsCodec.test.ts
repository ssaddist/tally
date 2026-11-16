import { describe, expect, it } from "vitest";
import { decodeSettings } from "./settingsCodec";

describe("languageChosen", () => {
  it("is false on a fresh install", () => {
    expect(decodeSettings({}).languageChosen).toBe(false);
  });

  it("is kept when stored", () => {
    expect(decodeSettings({ language: "uk", languageChosen: true }).languageChosen).toBe(true);
    expect(decodeSettings({ language: "uk", languageChosen: false }).languageChosen).toBe(false);
  });

  it("treats installs from before the picker as already chosen", () => {
    expect(decodeSettings({ language: "ru" }).languageChosen).toBe(true);
  });
});
