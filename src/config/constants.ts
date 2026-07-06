export const APP_CONFIG = {
  name: "Osmani TV",
  developer: "Osmani Media",
  category: "Entertainment",
  tagline: "Entertainment for Everybody — Osmani TV",
  description:
    "Osmani TV brings premium entertainment to your fingertips. Watch live channels, on-demand movies, and exclusive content in stunning HD quality.",
  /** Set to null to hide rating until real data is available */
  rating: null as number | null,
  ratingCount: null as string | null,
  downloads: null as string | null,
  ageRating: "Everyone",
  version: "2.4.1",
  lastUpdated: "June 2026",
  inAppPurchases: false,
} as const;

export const CATEGORY_CHIPS = [
  "Entertainment",
  "Streaming content",
  "Live TV",
] as const;

export const WHATS_NEW = {
  version: "2.4.1",
  date: "June 2026",
  items: [
    "Improved streaming performance and reduced buffering",
    "New live channels added to the catalog",
    "Enhanced user interface for easier navigation",
    "Bug fixes and stability improvements",
  ],
} as const;

export const APP_INFO = [
  { label: "Version", value: "2.4.1" },
  { label: "Updated on", value: "June 2026" },
  { label: "Download size", value: "90 MB" },
  { label: "Offered by", value: "Osmani Media" },
  { label: "Package ID", value: "com.burudanitv.app" },
] as const;

export const SEO = {
  title: "Osmani TV – Download APK for Android",
  description:
    "Download Osmani TV directly for Android. Stream live TV, movies, and exclusive entertainment in HD.",
  /** Fallback until social-preview-1200x630.png is uploaded */
  ogImageFallback: "/og-image.svg",
  ogImage: "/assets/osmani/social-preview-1200x630.png",
  siteUrl: "https://osmani-tv-landing.vercel.app",
  twitterHandle: "@OsmaniTV",
} as const;
