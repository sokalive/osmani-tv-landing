export const APP_CONFIG = {
  name: "Osmani TV",
  developer: "Osmani Media",
  category: "Entertainment",
  tagline: "Entertainment for Everybody — Osmani TV",
  description:
    "Osmani TV brings premium entertainment to your fingertips. Watch live channels, on-demand movies, and exclusive content in stunning HD quality.",
  rating: 4.7,
  ratingCount: "12.5K",
  downloads: "500K+",
  ageRating: "Everyone",
  version: "2.4.1",
  lastUpdated: "June 2026",
  inAppPurchases: true,
} as const;

export const SCREENSHOTS = [
  { id: 1, alt: "Osmani TV home screen", label: "Home" },
  { id: 2, alt: "Live TV channels", label: "Live TV" },
  { id: 3, alt: "On-demand movies", label: "Movies" },
  { id: 4, alt: "User profile and settings", label: "Profile" },
] as const;

export const CATEGORY_CHIPS = [
  "#1 in entertainment",
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
  { label: "Downloads", value: "500K+" },
  { label: "Download size", value: "90 MB" },
  { label: "Offered by", value: "Osmani Media" },
  { label: "Package ID", value: "com.burudanitv.app" },
] as const;

export const SEO = {
  title: "Osmani TV – Download APK for Android",
  description:
    "Download Osmani TV directly for Android. Stream live TV, movies, and exclusive entertainment in HD.",
  ogImage: "/og-image.svg",
  siteUrl: "https://osmani-tv-landing.vercel.app",
  twitterHandle: "@OsmaniTV",
} as const;
