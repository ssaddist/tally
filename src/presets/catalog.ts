import type { BillingPeriod } from "../domain/types";

export const PRESET_CATEGORIES = [
  "video",
  "music",
  "ai",
  "cloud",
  "productivity",
  "design",
  "dev",
  "gaming",
  "vpn",
  "social",
  "education",
  "shopping",
] as const;
export type PresetCategory = (typeof PRESET_CATEGORIES)[number];

export interface PresetPlan {
  label: string;
  amount: number | null;
  currency: string;
  period: BillingPeriod;
}

export interface Preset {
  id: string;
  name: string;
  category: PresetCategory;
  cancelUrl: string | null;
  plans: PresetPlan[];
  keywords?: string[];
}

const m = (label: string, amount: number | null, currency = "USD"): PresetPlan => ({
  label,
  amount,
  currency,
  period: "monthly",
});
const y = (label: string, amount: number | null, currency = "USD"): PresetPlan => ({
  label,
  amount,
  currency,
  period: "yearly",
});

const APPLE_SUBS = "https://apps.apple.com/account/subscriptions";
const MS_SERVICES = "https://account.microsoft.com/services";

export const PRESETS: Preset[] = [
  { id: "netflix", name: "Netflix", category: "video", cancelUrl: "https://www.netflix.com/cancelplan",
    plans: [m("Standard with ads", 799), m("Standard", 1799), m("Premium", 2499)] },
  { id: "youtube-premium", name: "YouTube Premium", category: "video", cancelUrl: "https://www.youtube.com/paid_memberships",
    plans: [m("Individual", 1399), m("Family", 2299), m("Student", 799)], keywords: ["youtube", "ютуб"] },
  { id: "disney-plus", name: "Disney+", category: "video", cancelUrl: "https://www.disneyplus.com/account/subscription",
    plans: [m("Basic", 999), m("Premium", 1599)], keywords: ["disney"] },
  { id: "apple-tv", name: "Apple TV+", category: "video", cancelUrl: APPLE_SUBS, plans: [m("Apple TV+", 1299)] },
  { id: "hbo-max", name: "HBO Max", category: "video", cancelUrl: "https://www.hbomax.com/account",
    plans: [m("Basic with ads", 1099), m("Standard", 1849), m("Premium", 2299)], keywords: ["max", "hbo"] },
  { id: "crunchyroll", name: "Crunchyroll", category: "video", cancelUrl: "https://www.crunchyroll.com/account/membership",
    plans: [m("Fan", 799), m("Mega Fan", 1199)], keywords: ["anime"] },
  { id: "megogo", name: "MEGOGO", category: "video", cancelUrl: "https://megogo.net",
    plans: [m("Subscription", null, "UAH")], keywords: ["мегого"] },
  { id: "sweet-tv", name: "SWEET.TV", category: "video", cancelUrl: "https://sweet.tv",
    plans: [m("Subscription", null, "UAH")], keywords: ["sweet", "світ"] },
  { id: "kyivstar-tv", name: "Kyivstar TV", category: "video", cancelUrl: "https://tv.kyivstar.ua",
    plans: [m("Subscription", null, "UAH")], keywords: ["київстар", "киевстар"] },

  { id: "spotify", name: "Spotify Premium", category: "music", cancelUrl: "https://www.spotify.com/account/subscription/",
    plans: [m("Individual", 1199), m("Duo", 1699), m("Family", 1999), m("Student", 599)], keywords: ["spotify", "спотифай"] },
  { id: "apple-music", name: "Apple Music", category: "music", cancelUrl: APPLE_SUBS,
    plans: [m("Individual", 1099), m("Family", 1699), m("Student", 599)] },
  { id: "youtube-music", name: "YouTube Music", category: "music", cancelUrl: "https://www.youtube.com/paid_memberships",
    plans: [m("Individual", 1099), m("Family", 1699)] },
  { id: "deezer", name: "Deezer", category: "music", cancelUrl: "https://www.deezer.com/account/subscription",
    plans: [m("Premium", 1199, "EUR"), m("Family", 1999, "EUR")] },
  { id: "tidal", name: "TIDAL", category: "music", cancelUrl: "https://account.tidal.com/subscription",
    plans: [m("Individual", 1099), m("Family", 1699)] },
  { id: "soundcloud", name: "SoundCloud Go+", category: "music", cancelUrl: "https://soundcloud.com/settings/subscriptions",
    plans: [m("Go+", 1099)], keywords: ["soundcloud"] },

  { id: "chatgpt", name: "ChatGPT", category: "ai", cancelUrl: "https://chatgpt.com/#settings/Account",
    plans: [m("Plus", 2000), m("Pro", 20000)], keywords: ["openai", "gpt"] },
  { id: "claude", name: "Claude", category: "ai", cancelUrl: "https://claude.ai/settings/billing",
    plans: [m("Pro", 2000), m("Max 5x", 10000), m("Max 20x", 20000)], keywords: ["anthropic"] },
  { id: "google-ai-pro", name: "Google AI Pro", category: "ai", cancelUrl: "https://one.google.com/settings",
    plans: [m("AI Pro", 1999)], keywords: ["gemini", "google one"] },
  { id: "perplexity", name: "Perplexity Pro", category: "ai", cancelUrl: "https://www.perplexity.ai/settings/account",
    plans: [m("Pro", 2000), y("Pro", 20000)], keywords: ["perplexity"] },
  { id: "midjourney", name: "Midjourney", category: "ai", cancelUrl: "https://www.midjourney.com/account",
    plans: [m("Basic", 1000), m("Standard", 3000), m("Pro", 6000)] },
  { id: "github-copilot", name: "GitHub Copilot", category: "ai", cancelUrl: "https://github.com/settings/copilot",
    plans: [m("Pro", 1000), y("Pro", 10000), m("Pro+", 3900)], keywords: ["copilot"] },
  { id: "cursor", name: "Cursor", category: "ai", cancelUrl: "https://cursor.com/dashboard",
    plans: [m("Pro", 2000), m("Ultra", 20000)] },

  { id: "icloud", name: "iCloud+", category: "cloud", cancelUrl: APPLE_SUBS,
    plans: [m("50 GB", 99), m("200 GB", 299), m("2 TB", 999)], keywords: ["icloud", "apple"] },
  { id: "apple-one", name: "Apple One", category: "cloud", cancelUrl: APPLE_SUBS,
    plans: [m("Individual", 1995), m("Family", 2595)] },
  { id: "google-one", name: "Google One", category: "cloud", cancelUrl: "https://one.google.com/settings",
    plans: [m("100 GB", 199), y("100 GB", 1999), m("2 TB", 999)], keywords: ["google drive"] },
  { id: "dropbox", name: "Dropbox", category: "cloud", cancelUrl: "https://www.dropbox.com/account/plan",
    plans: [m("Plus", 1199), y("Plus", 11988)] },
  { id: "microsoft-365", name: "Microsoft 365", category: "productivity", cancelUrl: MS_SERVICES,
    plans: [m("Personal", 999), y("Personal", 9999), y("Family", 12999)], keywords: ["office", "onedrive", "word", "excel"] },

  { id: "notion", name: "Notion", category: "productivity", cancelUrl: "https://www.notion.so",
    plans: [m("Plus", 1200), y("Plus", 12000)] },
  { id: "todoist", name: "Todoist Pro", category: "productivity", cancelUrl: "https://app.todoist.com/app/settings/subscription",
    plans: [m("Pro", 500), y("Pro", 4800)], keywords: ["todoist"] },
  { id: "1password", name: "1Password", category: "vpn", cancelUrl: "https://my.1password.com",
    plans: [y("Individual", 3588), y("Families", 5988)], keywords: ["password"] },
  { id: "bitwarden", name: "Bitwarden Premium", category: "vpn", cancelUrl: "https://vault.bitwarden.com/#/settings/subscription",
    plans: [y("Premium", 1000)], keywords: ["bitwarden", "password"] },

  { id: "adobe-cc", name: "Adobe Creative Cloud", category: "design", cancelUrl: "https://account.adobe.com/plans",
    plans: [m("Creative Cloud Pro", 6999), m("Photography", 1999), m("Photoshop", 2299)], keywords: ["adobe", "photoshop", "lightroom"] },
  { id: "figma", name: "Figma", category: "design", cancelUrl: "https://www.figma.com/settings",
    plans: [m("Professional", 2000)] },
  { id: "canva", name: "Canva Pro", category: "design", cancelUrl: "https://www.canva.com/settings/billing-and-teams",
    plans: [m("Pro", 1500), y("Pro", 12000)], keywords: ["canva"] },

  { id: "github-pro", name: "GitHub Pro", category: "dev", cancelUrl: "https://github.com/settings/billing",
    plans: [m("Pro", 400)], keywords: ["github"] },
  { id: "jetbrains", name: "JetBrains", category: "dev", cancelUrl: "https://account.jetbrains.com/licenses",
    plans: [y("All Products Pack", 28900), y("IntelliJ IDEA Ultimate", 16900)], keywords: ["intellij", "webstorm", "pycharm"] },

  { id: "xbox-game-pass", name: "Xbox Game Pass", category: "gaming", cancelUrl: MS_SERVICES,
    plans: [m("Ultimate", 2999), m("PC Game Pass", 1649)], keywords: ["xbox", "game pass"] },
  { id: "ps-plus", name: "PlayStation Plus", category: "gaming", cancelUrl: "https://store.playstation.com",
    plans: [m("Essential", 999), y("Essential", 7999), y("Extra", 13499), y("Premium", 15999)], keywords: ["playstation", "psn", "ps plus"] },
  { id: "nintendo-online", name: "Nintendo Switch Online", category: "gaming", cancelUrl: "https://accounts.nintendo.com",
    plans: [y("Individual", 1999), y("+ Expansion Pack", 4999)], keywords: ["nintendo", "switch"] },
  { id: "ea-play", name: "EA Play", category: "gaming", cancelUrl: "https://myaccount.ea.com",
    plans: [m("EA Play", 599), y("EA Play", 3999)] },

  { id: "nordvpn", name: "NordVPN", category: "vpn", cancelUrl: "https://my.nordaccount.com/billing/",
    plans: [m("Monthly", 1299)], keywords: ["nord", "vpn"] },
  { id: "expressvpn", name: "ExpressVPN", category: "vpn", cancelUrl: "https://www.expressvpn.com/subscriptions",
    plans: [m("Monthly", 1295)], keywords: ["vpn"] },
  { id: "surfshark", name: "Surfshark", category: "vpn", cancelUrl: "https://my.surfshark.com",
    plans: [m("Monthly", 1595)], keywords: ["vpn"] },
  { id: "proton", name: "Proton", category: "vpn", cancelUrl: "https://account.proton.me/dashboard",
    plans: [m("VPN Plus", 999, "EUR"), m("Mail Plus", 499, "EUR"), m("Proton Unlimited", 1299, "EUR")], keywords: ["protonmail", "proton vpn"] },

  { id: "telegram-premium", name: "Telegram Premium", category: "social", cancelUrl: null,
    plans: [m("Premium", 499)], keywords: ["telegram", "телеграм"] },
  { id: "discord-nitro", name: "Discord Nitro", category: "social", cancelUrl: "https://discord.com/channels/@me",
    plans: [m("Nitro", 999), m("Nitro Basic", 299)], keywords: ["discord"] },
  { id: "x-premium", name: "X Premium", category: "social", cancelUrl: "https://x.com/settings/manage_subscriptions",
    plans: [m("Premium", 800), m("Premium+", 4000)], keywords: ["twitter"] },
  { id: "linkedin-premium", name: "LinkedIn Premium", category: "social", cancelUrl: "https://www.linkedin.com/premium/manage/",
    plans: [m("Career", 2999)], keywords: ["linkedin"] },

  { id: "duolingo", name: "Duolingo Super", category: "education", cancelUrl: "https://www.duolingo.com/settings/super",
    plans: [m("Super", 1299)], keywords: ["duolingo"] },
  { id: "coursera-plus", name: "Coursera Plus", category: "education", cancelUrl: "https://www.coursera.org/account-settings",
    plans: [m("Monthly", 5900), y("Annual", 39900)], keywords: ["coursera"] },

  { id: "amazon-prime", name: "Amazon Prime", category: "shopping", cancelUrl: "https://www.amazon.com/mc",
    plans: [m("Prime", 1499), y("Prime", 13900)], keywords: ["amazon", "prime video"] },
];

export function findPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}

export function searchPresets(query: string, category: PresetCategory | "all" = "all"): Preset[] {
  const q = query.trim().toLowerCase();
  return PRESETS.filter((p) => category === "all" || p.category === category).filter(
    (p) => !q || p.name.toLowerCase().includes(q) || p.keywords?.some((k) => k.toLowerCase().includes(q)),
  );
}

export function cheapestPlan(p: Preset): PresetPlan | undefined {
  return p.plans
    .filter((pl) => pl.amount !== null)
    .sort((a, b) => (a.amount ?? 0) / (a.period === "yearly" ? 12 : 1) - (b.amount ?? 0) / (b.period === "yearly" ? 12 : 1))[0];
}
