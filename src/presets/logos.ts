import {
  si1password,
  siApple,
  siAppletv,
  siApplemusic,
  siBitwarden,
  siClaude,
  siCoursera,
  siCrunchyroll,
  siCursor,
  siDeezer,
  siDiscord,
  siDropbox,
  siDuolingo,
  siEa,
  siExpressvpn,
  siFigma,
  siGithub,
  siGithubcopilot,
  siGoogle,
  siGooglegemini,
  siHbomax,
  siIcloud,
  siJetbrains,
  siNetflix,
  siNordvpn,
  siNotion,
  siPerplexity,
  siPlaystation,
  siProton,
  siSoundcloud,
  siSpotify,
  siSurfshark,
  siTelegram,
  siTidal,
  siTodoist,
  siX,
  siYoutube,
  siYoutubemusic,
  type SimpleIcon,
} from "simple-icons";
import { PRESETS, type Preset } from "./catalog";

const LOGOS: Record<string, SimpleIcon> = {
  netflix: siNetflix,
  "youtube-premium": siYoutube,
  "apple-tv": siAppletv,
  "hbo-max": siHbomax,
  crunchyroll: siCrunchyroll,
  spotify: siSpotify,
  "apple-music": siApplemusic,
  "youtube-music": siYoutubemusic,
  deezer: siDeezer,
  tidal: siTidal,
  soundcloud: siSoundcloud,
  claude: siClaude,
  "google-ai-pro": siGooglegemini,
  perplexity: siPerplexity,
  "github-copilot": siGithubcopilot,
  cursor: siCursor,
  icloud: siIcloud,
  "apple-one": siApple,
  "google-one": siGoogle,
  dropbox: siDropbox,
  notion: siNotion,
  todoist: siTodoist,
  "1password": si1password,
  bitwarden: siBitwarden,
  figma: siFigma,
  "github-pro": siGithub,
  jetbrains: siJetbrains,
  "ps-plus": siPlaystation,
  "ea-play": siEa,
  nordvpn: siNordvpn,
  expressvpn: siExpressvpn,
  surfshark: siSurfshark,
  proton: siProton,
  "telegram-premium": siTelegram,
  "discord-nitro": siDiscord,
  "x-premium": siX,
  duolingo: siDuolingo,
  "coursera-plus": siCoursera,
};

export interface Logo {
  path: string;
  background: string;
  foreground: string;
}

function luminance(hex: string): number {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function logoForPreset(presetId: string): Logo | null {
  const icon = LOGOS[presetId];
  if (!icon) return null;
  const l = luminance(icon.hex);
  const foreground = (l + 0.05) / 0.05 > 1.05 / (l + 0.05) ? "#000000" : "#FFFFFF";
  return { path: icon.path, background: `#${icon.hex}`, foreground };
}

export function presetForName(name: string): Preset | undefined {
  const n = name.trim().toLowerCase();
  if (!n) return undefined;
  return (
    PRESETS.find((p) => p.name.toLowerCase() === n) ??
    PRESETS.find((p) => n.startsWith(p.name.toLowerCase())) ??
    PRESETS.find((p) => p.name.toLowerCase().startsWith(n) && n.length >= 3)
  );
}

export function logoForName(name: string): Logo | null {
  const preset = presetForName(name);
  return preset ? logoForPreset(preset.id) : null;
}
