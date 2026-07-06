/**
 * Install handoff tier model and strategy selection.
 *
 * Tier 1 — Real Android Package Installer (Cancel / Install)
 * Tier 2 — OS download notification / system surface → one tap to installer
 * Tier 3 — Downloads / file manager to APK location
 * Tier 4 — Browser-only instructions / share fallback
 */

import type { BrowserProfile } from "./browser";

export type InstallHandoffTier = 1 | 2 | 3 | 4;

export type InstallHandoffAction =
  | "web-share"
  | "persist-to-downloads"
  | "blob-anchor-open"
  | "blob-navigation"
  | "instructions-only";

export type InstallHandoffPlan = {
  /** Highest tier this environment can target */
  targetTier: InstallHandoffTier;
  /** Ordered steps to attempt under user gesture */
  steps: InstallHandoffAction[];
  /** Why Tier 1 is not achievable in pure web for this profile */
  tier1Limitation: string;
};

export function selectInstallHandoffPlan(profile: BrowserProfile): InstallHandoffPlan {
  if (profile.isMetaInApp) {
    return {
      targetTier: 4,
      steps: ["instructions-only"],
      tier1Limitation:
        "Meta in-app browsers block reliable APK install handoff; open in Chrome.",
    };
  }

  if (profile.isAndroid) {
    const steps: InstallHandoffAction[] = [];

    if (profile.supportsWebShareFiles) {
      steps.push("web-share");
    }

    // Persist verified RAM blob to Download Manager — zero additional CDN bytes.
    // Chrome/Samsung typically surface a completion notification → Package Installer.
    steps.push("persist-to-downloads");
    steps.push("blob-anchor-open");

    return {
      targetTier: 2,
      steps,
      tier1Limitation:
        "Fetch-to-RAM leaves no content:// URI; Package Installer requires OS-owned file or native FileProvider bridge.",
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
      return "Package Installer";
    case 2:
      return "OS download notification";
    case 3:
      return "Downloads folder";
    case 4:
      return "Instructions only";
  }
}
