import type { BrowserProfile } from "./browser";
import {
  hasIabEscapeAttempted,
  hasIabReturnMarker,
} from "./externalBrowser";

export type AndroidDownloadPath =
  | "iab-external-browser"
  | "direct-cdn-navigation"
  | "verified-fetch";

export type DownloadPathOptions = {
  /** User explicitly requested verified in-page fetch (retry / advanced). */
  preferVerifiedFetch?: boolean;
  /** Bytes already received via fetch in this session — block overlapping CDN nav. */
  fetchBytesReceived?: number;
};

/**
 * Select exactly one CDN transfer owner for the current browser context.
 *
 * Facebook/Meta IAB: external Chrome handoff once, then direct CDN navigation.
 * Chrome / Samsung / other Android: direct CDN navigation (OS download manager).
 * Verified fetch: optional manual path with in-page SHA/size validation.
 */
export function selectAndroidDownloadPath(
  profile: BrowserProfile,
  options: DownloadPathOptions = {},
): AndroidDownloadPath {
  if (options.fetchBytesReceived && options.fetchBytesReceived > 0) {
    return "verified-fetch";
  }

  if (options.preferVerifiedFetch) {
    return "verified-fetch";
  }

  if (profile.isMetaInApp && profile.isAndroid) {
    if (!hasIabReturnMarker() && !hasIabEscapeAttempted()) {
      return "iab-external-browser";
    }
    return "direct-cdn-navigation";
  }

  if (profile.isAndroid) {
    return "direct-cdn-navigation";
  }

  return "verified-fetch";
}

export function pathUsesCdnNavigation(path: AndroidDownloadPath): boolean {
  return path === "direct-cdn-navigation";
}

export function pathUsesVerifiedFetch(path: AndroidDownloadPath): boolean {
  return path === "verified-fetch";
}
