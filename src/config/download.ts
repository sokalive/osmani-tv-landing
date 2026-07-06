/**
 * APK distribution configuration
 *
 * HOSTING OPTIONS (choose one):
 *
 * 1. Same-origin (Vercel static file)
 *    Place the real APK at: public/downloads/osmani-tv.apk
 *    It will be served from: https://osmani-tv-landing.vercel.app/downloads/osmani-tv.apk
 *    Note: ~90 MB APKs in Git are not recommended (slow clones/deploys).
 *    Use for small APKs or testing only.
 *
 * 2. External CDN / object storage (recommended for production)
 *    Set EXTERNAL_APK_URL to your CDN URL (S3, R2, Bunny, etc.).
 *    When set, it overrides the local path below.
 *    Example: "https://cdn.example.com/releases/osmani-tv-v2.4.1.apk"
 */
export const APK_CONFIG = {
  /** Same-origin path served from public/downloads/ */
  localPath: "/downloads/osmani-tv.apk",

  /**
   * Optional external CDN URL. When non-empty, this is used instead of localPath.
   * Leave empty to use same-origin hosting.
   */
  externalUrl: "",

  fileName: "osmani-tv.apk",
  version: "2.4.1",
  size: "90 MB",
  packageId: "com.burudanitv.app",
} as const;

export const APP_PACKAGE_ID = APK_CONFIG.packageId;

/** Resolves the effective APK download URL at runtime. */
export function resolveApkUrl(): string {
  if (APK_CONFIG.externalUrl) {
    return APK_CONFIG.externalUrl;
  }
  return new URL(APK_CONFIG.localPath, window.location.origin).href;
}

/** Whether the URL is same-origin (enables fetch progress tracking). */
export function isSameOriginApk(url: string): boolean {
  try {
    return new URL(url).origin === window.location.origin;
  } catch {
    return false;
  }
}
