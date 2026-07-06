/**
 * APK distribution configuration
 *
 * SAME-ORIGIN SLOT:
 *   public/downloads/osmani-tv.apk
 *   → https://osmani-tv-landing.vercel.app/downloads/osmani-tv.apk
 *
 * EXTERNAL CDN (recommended for ~90 MB):
 *   Set externalUrl below. Overrides same-origin path when non-empty.
 */
export const APK_CONFIG = {
  localPath: "/downloads/osmani-tv.apk",

  /** CDN / object-storage URL. Empty = use same-origin slot. */
  externalUrl: "",

  /** Filename saved on the user's device */
  fileName: "Osmani-TV-Max.apk",

  version: "2.4.1",
  size: "90 MB",
  packageId: "com.burudanitv.app",

  /** Minimum valid APK size in bytes (reject HTML/error pages) */
  minBytes: 100_000,
} as const;

export const APP_PACKAGE_ID = APK_CONFIG.packageId;

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
