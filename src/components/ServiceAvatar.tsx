import { logoForName, logoForPreset } from "../presets/logos";

function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[1]![0]!).toUpperCase();
}

export function ServiceAvatar({ name, presetId, size = 32 }: { name: string; presetId?: string; size?: number }) {
  const logo = presetId ? logoForPreset(presetId) : logoForName(name);
  const box = { width: size, height: size, borderRadius: Math.max(2, Math.round(size / 8)) };

  if (logo) {
    return (
      <span
        aria-hidden="true"
        className="inline-flex shrink-0 items-center justify-center border border-border bg-surface-2"
        style={box}
      >
        <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55} fill="var(--text)">
          <path d={logo.path} />
        </svg>
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center border border-border bg-surface-2 font-display font-bold tracking-[-0.02em] text-text"
      style={{ ...box, fontSize: Math.round(size * 0.38) }}
    >
      {initials(name)}
    </span>
  );
}
