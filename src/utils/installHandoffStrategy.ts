/**
 * Install handoff tier model — landing-only / browser paths.
 *
 * Tier 1 — OS-recognized browser download (direct CDN navigation)
 * Tier 2 — Verified fetch + programmatic anchor save (NOT Android DownloadManager)
 * Tier 3 — Blob URL open attempt / Web Share
 * Tier 4 — Instructions only
 */

import type { BrowserProfile } from "./browser";

export type InstallHandoffTier = 1 | 2 | 3 | 4;

export type InstallHandoffAction =
  | "web-share"
  | "anchor-browser-download"
  | "blob-anchor-open"
  | "cdn-navigation"
  | "instructions-only";

export type InstallHandoffPlan = {
  targetTier: InstallHandoffTier;
  steps: InstallHandoffAction[];
  tier1Limitation: string;
};

export function selectInstallHandoffPlan(
  profile: BrowserProfile,
  options: { browserFetchComplete?: boolean } = {},
): InstallHandoffPlan {
  if (profile.isMetaInApp) {
    return {
      targetTier: 1,
      steps: ["cdn-navigation"],
      tier1Limitation:
        "Open in Chrome for the strongest install path. Tap Download to start the APK in your browser.",
    };
  }

  if (profile.isAndroid) {
    if (!options.browserFetchComplete) {
      return {
        targetTier: 1,
        steps: ["cdn-navigation"],
        tier1Limitation: "",
      };
    }

    const steps: InstallHandoffAction[] = [];
    if (profile.supportsWebShareFiles) {
      steps.push("web-share");
    }
    steps.push("anchor-browser-download");
    steps.push("blob-anchor-open");

    return {
      targetTier: 2,
      steps,
      tier1Limitation:
        "Verified APK is in browser memory; anchor download saves one local copy for the browser download UI.",
    };
  }

  return {
    targetTier: 4,
    steps: ["instructions-only"],
    tier1Limitation: "Non-Android browsers cannot launch Android Package Installer.",
  };
}

export function tierLabel(tier: InstallHandoffTier): string {
  switch (tier) {
    case 1:
      return "Browser OS download";
    case 2:
      return "Browser anchor download save";
    case 3:
      return "Blob open attempt";
    case 4:
      return "Instructions only";
  }
}
