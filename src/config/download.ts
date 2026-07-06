/**
 * APK distribution & release metadata
 *
 * ═══════════════════════════════════════════════════════════════════
 * RECOMMENDED HOSTING FOR ~90 MB APK: Bunny CDN
 * ═══════════════════════════════════════════════════════════════════
 * This landing repo has NO Bunny credentials configured. The owner
 * already uses Bunny elsewhere in Osmani TV infrastructure — reuse
 * that account to create a dedicated Pull Zone or Storage Zone:
 *
 *   1. Upload "Osmani TV Max.apk" to Bunny Storage (or FTP to zone)
 *   2. Enable public CDN URL, e.g.:
 *      https://osmani-apk.b-cdn.net/releases/Osmani-TV-Max.apk
 *   3. Set externalUrl below to that URL
 *
 * Required CDN headers (configure in Bunny Edge Rules or origin):
 *   Content-Type: application/vnd.android.package-archive
 *   Content-Length: (automatic from file)
 *   Accept-Ranges: bytes
 *   Access-Control-Allow-Origin: https://osmani-tv-landing.vercel.app
 *   (or * if you need fetch progress from the landing page)
 *   Content-Disposition: attachment; filename="Osmani-TV-Max.apk"
 *   Cache-Control: public, max-age=3600, must-revalidate
 *
 * Versioning: include version in path, e.g. /releases/v2.4.1/Osmani-TV-Max.apk
 * Update externalUrl + APK_RELEASE metadata together per release.
 *
 * ═══════════════════════════════════════════════════════════════════
 * ALTERNATIVES (comparison)
 * ═══════════════════════════════════════════════════════════════════
 * | Option            | 90 MB | Progress | Range | Cost   | Notes        |
 * |-------------------|-------|----------|-------|--------|--------------|
 * | Bunny CDN         | ✅    | ✅*      | ✅    | Low    | RECOMMENDED  |
 * | Cloudflare R2     | ✅    | ✅*      | ✅    | Low    | Needs CORS   |
 * | Vercel static     | ⚠️    | ✅       | ✅    | Medium | 100MB limit  |
 * | GitHub repo file  | ❌    | ❌       | ❌    | —      | Do not use   |
 * | GitHub Releases   | ⚠️    | ❌       | ✅    | Free   | No CORS/prog |
 *
 * *Progress requires CORS + Content-Length on cross-origin fetch.
 *
 * SAME-ORIGIN SLOT (testing / small APK only):
 *   public/downloads/osmani-tv.apk
 *   → https://osmani-tv-landing.vercel.app/downloads/osmani-tv.apk
 */
export const APK_RELEASE = {
  /** Human-readable version, e.g. "2.4.1" */
  versionName: "2.4.1",

  /** Android versionCode integer */
  versionCode: 241,

  /** Filename presented to the user's device */
  fileName: "Osmani-TV-Max.apk",

  /**
   * Expected file size in bytes. Set after uploading real APK.
   * null = skip size check. Example for ~90 MB: 94371840
   */
  expectedSizeBytes: null as number | null,

  /**
   * SHA-256 hex digest (lowercase). Set after uploading real APK.
   * null = skip hash check. Calculate: scripts/validate-apk-release.mjs
   */
  sha256: null as string | null,

  /** ISO date string for display */
  releaseDate: "2026-06-01",

  packageId: "com.burudanitv.app",

  /** Reject responses smaller than this (catches HTML error pages) */
  minBytes: 100_000,
} as const;

export const APK_CONFIG = {
  localPath: "/downloads/osmani-tv.apk",

  /**
   * Bunny CDN or other object-storage URL.
   * When non-empty, overrides localPath.
   * Example: "https://osmani-apk.b-cdn.net/releases/Osmani-TV-Max.apk"
   */
  externalUrl: "",

  fileName: APK_RELEASE.fileName,
  version: APK_RELEASE.versionName,
  size: "90 MB",
  packageId: APK_RELEASE.packageId,
  minBytes: APK_RELEASE.minBytes,
  expectedSizeBytes: APK_RELEASE.expectedSizeBytes,
  sha256: APK_RELEASE.sha256,
} as const;

export const APP_PACKAGE_ID = APK_RELEASE.packageId;

/** When true, validate:assets fails if required release files are missing */
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
