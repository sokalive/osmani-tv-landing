import { APK_CONFIG, resolveApkUrl } from "../config/download";

const SESSION_TRANSFER_KEY = "osmani_apk_transfer_started";

/** True when this page session already initiated the single CDN APK transfer. */
export function hasApkTransferStarted(): boolean {
  try {
    return sessionStorage.getItem(SESSION_TRANSFER_KEY) === "1";
  } catch {
    return false;
  }
}

export function markApkTransferStarted(): void {
  try {
    sessionStorage.setItem(SESSION_TRANSFER_KEY, "1");
  } catch {
    // ignore
  }
}

export function clearApkTransferSession(): void {
  try {
    sessionStorage.removeItem(SESSION_TRANSFER_KEY);
  } catch {
    // ignore
  }
}

/**
 * Initiate exactly one CDN APK transfer via top-level navigation.
 * Cross-origin CDN: browser download manager owns the artifact (not JS RAM).
 */
export function initiateApkCdnDownload(): string {
  const url = resolveApkUrl();
  markApkTransferStarted();
  window.location.assign(url);
  return url;
}

export function getApkFileName(): string {
  return APK_CONFIG.fileName;
}

export function formatApkSizeBadge(): string {
  const mb = APK_CONFIG.expectedSizeBytes / 1_000_000;
  return `APK • ${mb.toFixed(2)} MB`;
}
