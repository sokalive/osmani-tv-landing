/**
 * Install handoff tier model and strategy selection.
 *
 * Tier 1 — Real Android Package Installer (Cancel / Install) via native app bridge
 * Tier 2 — Browser anchor download save (NOT Android DownloadManager API)
 * Tier 3 — Blob URL open attempt
 * Tier 4 — Instructions only
 */

import type { BrowserProfile } from "./browser";
import { isInstallRoute } from "../config/installBridge";

export type InstallHandoffTier = 1 | 2 | 3 | 4;

export type InstallHandoffAction =
  | "native-app-bridge"
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
  options: { installRoute?: boolean; browserFetchComplete?: boolean } = {},
): InstallHandoffPlan {
  const installRoute = options.installRoute ?? isInstallRoute();

  if (profile.isMetaInApp) {
    return {
      targetTier: 4,
      steps: installRoute ? ["cdn-navigation"] : ["instructions-only"],
      tier1Limitation:
        "Meta in-app browsers block reliable APK install handoff; open in Chrome.",
    };
  }

  if (profile.isAndroid) {
    if (installRoute) {
      return {
        targetTier: 1,
        steps: ["native-app-bridge", "cdn-navigation"],
        tier1Limitation: "",
      };
    }

    if (!options.browserFetchComplete) {
      return {
        targetTier: 1,
        steps: ["native-app-bridge"],
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
        "Verified APK is in browser memory only; anchor download saves one local copy for the browser download UI.",
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
      return "Package Installer via native bridge";
    case 2:
      return "Browser download save";
    case 3:
      return "Blob open attempt";
    case 4:
      return "Instructions only";
  }
}
