/**
 * APK distribution & release metadata
 *
 * Production delivery: Bunny CDN Pull Zone (externalUrl below).
 * Same-origin slot public/downloads/osmani-tv.apk remains for local testing only.
 */
export const APK_RELEASE = {
  /** From project config — not re-verified from APK binary in this release */
  versionName: "2.4.1",

  /** From project config — not re-verified from APK binary in this release */
  versionCode: 241,

  /** Human-readable filename on device (matches Bunny Storage object) */
  fileName: "Osmani TV Mx.apk",

  /** Measured from production CDN artifact 2026-07-06 */
  expectedSizeBytes: 90_834_935,

  /** SHA-256 of production CDN artifact 2026-07-06 */
  sha256: "0bcfbecd167fe09a70b722abe890984e429d22d022075086cf0d50b557cc8e2d",

  releaseDate: "2026-06-01",

  packageId: "com.burudanitv.app",

  minBytes: 100_000,
} as const;

export const APK_CONFIG = {
  localPath: "/downloads/osmani-tv.apk",

  /** Production Bunny CDN URL (verified on Android device) */
  externalUrl:
    "https://osmani-tv-apk-download.b-cdn.net/Osmani%20TV%20Mx.apk",

  fileName: APK_RELEASE.fileName,
  version: APK_RELEASE.versionName,
  size: "90 MB",
  packageId: APK_RELEASE.packageId,
  minBytes: APK_RELEASE.minBytes,
  expectedSizeBytes: APK_RELEASE.expectedSizeBytes,
  sha256: APK_RELEASE.sha256,
} as const;

export const APP_PACKAGE_ID = APK_RELEASE.packageId;

export const RELEASE_MODE = false;

export function resolveApkUrl(): string {
  if (APK_CONFIG.externalUrl) {
    return APK_CONFIG.externalUrl;
  }
  return new URL(APK_CONFIG.localPath, window.location.origin).href;
}

export function isSameOriginApk(url: string): boolean {
  try {
    return new URL(url).origin === window.location.origin;
  } catch {
    return false;
  }
}

/** Cross-origin CDN without CORS cannot be probed via fetch from the browser. */
export function isCrossOriginCdnApk(url: string): boolean {
  return Boolean(APK_CONFIG.externalUrl) && !isSameOriginApk(url);
}
