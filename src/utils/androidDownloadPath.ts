import type { BrowserProfile } from "./browser";
import {
  hasIabEscapeAttempted,
  hasIabReturnMarker,
} from "./externalBrowser";

export type AndroidDownloadPath =
  | "iab-external-browser"
  | "direct-cdn-navigation";

/**
 * Select exactly one CDN transfer owner for the current browser context.
 *
 * Facebook/Meta IAB: external Chrome handoff once, then direct CDN navigation.
 * Chrome / Samsung / other Android: direct CDN navigation (OS download manager).
 */
export function selectAndroidDownloadPath(
  profile: BrowserProfile,
): AndroidDownloadPath {
  if (profile.isMetaInApp && profile.isAndroid) {
    if (!hasIabReturnMarker() && !hasIabEscapeAttempted()) {
      return "iab-external-browser";
    }
    return "direct-cdn-navigation";
  }

  if (profile.isAndroid) {
    return "direct-cdn-navigation";
  }

  return "direct-cdn-navigation";
}

export function pathUsesCdnNavigation(path: AndroidDownloadPath): boolean {
  return path === "direct-cdn-navigation";
}
