import { APK_CONFIG, APK_RELEASE } from '../config/download';

const LANDING_ORIGIN = 'https://osmani-tv-landing.vercel.app';
const INSTALL_PATH = '/install';
const ANDROID_PACKAGE = APK_RELEASE.packageId;
const BRIDGE_ATTEMPT_KEY = 'osmani_install_bridge_attempted';

export function isInstallRoute(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith(INSTALL_PATH);
}

export function buildLandingInstallHttpsUrl(): string {
  const params = new URLSearchParams({
    apk: APK_CONFIG.externalUrl ?? '',
    sha256: APK_RELEASE.sha256 ?? '',
    size: String(APK_RELEASE.expectedSizeBytes ?? 0),
  });
  return `${LANDING_ORIGIN}${INSTALL_PATH}?${params.toString()}`;
}

export function buildOsmaniCustomInstallUrl(): string {
  const params = new URLSearchParams({
    apk: APK_CONFIG.externalUrl ?? '',
    sha256: APK_RELEASE.sha256 ?? '',
    size: String(APK_RELEASE.expectedSizeBytes ?? 0),
  });
  return `osmani://install?${params.toString()}`;
}

/** Chrome Android intent URL — opens app when installed, else browser fallback. */
export function buildAndroidIntentInstallUrl(fallbackHttpsUrl: string): string {
  const query = new URL(fallbackHttpsUrl).search;
  const fallback = encodeURIComponent(fallbackHttpsUrl);
  return (
    `intent://osmani-tv-landing.vercel.app/install${query}` +
    `#Intent;scheme=https;package=${ANDROID_PACKAGE};` +
    `S.browser_fallback_url=${fallback};end`
  );
}

export function hasAttemptedInstallBridge(): boolean {
  try {
    return sessionStorage.getItem(BRIDGE_ATTEMPT_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markInstallBridgeAttempted(): void {
  try {
    sessionStorage.setItem(BRIDGE_ATTEMPT_KEY, 'true');
  } catch {
    // ignore
  }
}

export function clearInstallBridgeAttempted(): void {
  try {
    sessionStorage.removeItem(BRIDGE_ATTEMPT_KEY);
  } catch {
    // ignore
  }
}

/**
 * Attempt to hand off to the installed Osmani TV app (native bridge).
 * Returns true when navigation was initiated.
 */
export function openNativeInstallBridge(): boolean {
  const httpsUrl = buildLandingInstallHttpsUrl();
  markInstallBridgeAttempted();

  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);

  if (isAndroid) {
    window.location.href = buildAndroidIntentInstallUrl(httpsUrl);
    return true;
  }

  window.location.href = httpsUrl;
  return true;
}
