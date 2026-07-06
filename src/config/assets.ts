/**
 * Centralized Osmani TV asset manifest.
 * Place real files under public/assets/osmani/ at the paths below.
 * Components must import paths from here — never hardcode asset URLs.
 */
export const ASSET_PATHS = {
  appIcon: "/assets/osmani/app-icon.png",
  screenshots: [
    "/assets/osmani/screenshot-01.png",
    "/assets/osmani/screenshot-02.png",
    "/assets/osmani/screenshot-03.png",
    "/assets/osmani/screenshot-04.png",
    "/assets/osmani/screenshot-05.png",
  ],
  featureGraphic: "/assets/osmani/feature-graphic.png",
  socialPreview: "/assets/osmani/social-preview-1200x630.png",
} as const;

/** Recommended dimensions for owner uploads — see public/assets/osmani/README.md */
export const ASSET_SPECS = {
  appIcon: { width: 512, height: 512, format: "PNG" },
  screenshots: { width: 1080, height: 1920, format: "PNG or WebP" },
  featureGraphic: { width: 1024, height: 500, format: "PNG or JPG" },
  socialPreview: { width: 1200, height: 630, format: "PNG or JPG" },
} as const;

export const SCREENSHOT_LABELS = [
  "Home",
  "Live TV",
  "Movies",
  "Profile",
  "Settings",
] as const;

/** Fixed layout dimensions to prevent CLS when real assets replace placeholders */
export const ASSET_LAYOUT = {
  appIconSize: 72,
  appIconSizeDesktop: 96,
  screenshotWidth: 140,
  screenshotWidthDesktop: 180,
  screenshotAspectRatio: "9 / 19.5",
} as const;
