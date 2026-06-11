export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.burudanitv.app";

export const APP_PACKAGE_ID = "com.burudanitv.app";

export const APP_CONFIG = {
  name: "Osmani TV",
  category: "Entertainment",
  tagline: "Stream your favorite shows anytime, anywhere",
  description:
    "Osmani TV brings premium entertainment to your fingertips. Watch live channels, on-demand movies, and exclusive content in stunning HD quality.",
  rating: 4.7,
  ratingCount: "12.5K",
  downloads: "500K+",
  ageRating: "Everyone",
  developer: "Osmani Media",
  version: "2.4.1",
  lastUpdated: "June 2026",
  size: "28 MB",
} as const;

export const SCREENSHOTS = [
  { id: 1, alt: "Osmani TV home screen", label: "Home" },
  { id: 2, alt: "Live TV channels", label: "Live TV" },
  { id: 3, alt: "On-demand movies", label: "Movies" },
  { id: 4, alt: "User profile and settings", label: "Profile" },
] as const;

export const FEATURES = [
  {
    icon: "📺",
    title: "Live TV Streaming",
    description: "Watch hundreds of live channels in crystal-clear HD quality.",
  },
  {
    icon: "🎬",
    title: "On-Demand Library",
    description: "Access thousands of movies and shows whenever you want.",
  },
  {
    icon: "⚡",
    title: "Lightning Fast",
    description: "Optimized streaming with minimal buffering and data usage.",
  },
  {
    icon: "🔔",
    title: "Smart Notifications",
    description: "Never miss your favorite shows with personalized alerts.",
  },
  {
    icon: "📱",
    title: "Multi-Device Sync",
    description: "Pick up where you left off across all your devices.",
  },
  {
    icon: "🌍",
    title: "Global Content",
    description: "Enjoy international channels and regional favorites.",
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: "Is Osmani TV free to download?",
    answer:
      "Yes, Osmani TV is free to download from the Google Play Store. Some premium content may require a subscription.",
  },
  {
    question: "What devices are supported?",
    answer:
      "Osmani TV works on all Android smartphones and tablets running Android 6.0 or later.",
  },
  {
    question: "Can I watch offline?",
    answer:
      "Yes, you can download select content to watch offline without an internet connection.",
  },
  {
    question: "How do I contact support?",
    answer:
      "Reach our support team at support@osmanitv.com or through the in-app help center.",
  },
] as const;

export const SEO = {
  title: "Osmani TV – Download on Google Play",
  description:
    "Download Osmani TV on Google Play. Stream live TV, movies, and exclusive entertainment in HD. Free download for Android.",
  ogImage: "/og-image.svg",
  siteUrl: "https://osmanitv.com",
  twitterHandle: "@OsmaniTV",
} as const;

export const REDIRECT_DELAY_MS = 1000;
