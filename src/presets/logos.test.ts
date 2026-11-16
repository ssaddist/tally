import { describe, expect, it } from "vitest";
import { PRESETS } from "./catalog";
import { logoForName, logoForPreset, presetForName } from "./logos";

describe("preset logos", () => {
  it("matches subscription names to presets", () => {
    expect(presetForName("Netflix")?.id).toBe("netflix");
    expect(presetForName("spotify premium family")?.id).toBe("spotify");
    expect(presetForName("Spot")?.id).toBe("spotify");
    expect(presetForName("YouTube Music")?.id).toBe("youtube-music");
    expect(presetForName("My gym")).toBeUndefined();
  });

  it("returns a bundled logo with a readable glyph colour", () => {
    const netflix = logoForPreset("netflix")!;
    expect(netflix.background).toBe("#E50914");
    expect(netflix.foreground).toBe("#FFFFFF");
    expect(logoForPreset("spotify")!.foreground).toBe("#000000");
    expect(logoForName("Coffee club")).toBeNull();
  });

  it("covers most of the catalog", () => {
    const withLogo = PRESETS.filter((p) => logoForPreset(p.id)).length;
    expect(withLogo).toBeGreaterThanOrEqual(35);
  });
});
