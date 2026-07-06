import type { BrowserProfile } from "./browser";

const ESCAPE_SESSION_KEY = "osmani_iab_escape_attempted";
export const FROM_IAB_QUERY_PARAM = "from_iab";

export function hasIabReturnMarker(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get(FROM_IAB_QUERY_PARAM) === "1";
  } catch {
    return false;
  }
}

export function hasIabEscapeAttempted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(ESCAPE_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markIabEscapeAttempted(): void {
  try {
    sessionStorage.setItem(ESCAPE_SESSION_KEY, "1");
  } catch {
    // ignore
  }
}

/** Landing URL marked so returning from an intent fallback does not re-trigger escape. */
export function buildLandingUrlWithIabMarker(): string {
  const url = new URL(window.location.href);
  url.searchParams.set(FROM_IAB_QUERY_PARAM, "1");
  return url.toString();
}

/**
 * Android intent URL that opens the landing page in Chrome when available.
 * Falls back to the same HTTPS URL in the current WebView if Chrome is absent.
 */
export function buildExternalChromeIntentUrl(targetUrl: string): string {
  const parsed = new URL(targetUrl);
  const pathWithQuery = `${parsed.host}${parsed.pathname}${parsed.search}`;
  const fallback = encodeURIComponent(targetUrl);
  return (
    `intent://${pathWithQuery}` +
    `#Intent;scheme=https;package=com.android.chrome;` +
    `S.browser_fallback_url=${fallback};end`
  );
}

/** Generic external-browser VIEW intent when Chrome package is unavailable. */
export function buildGenericExternalBrowserIntentUrl(targetUrl: string): string {
  const parsed = new URL(targetUrl);
  const pathWithQuery = `${parsed.host}${parsed.pathname}${parsed.search}`;
  const fallback = encodeURIComponent(targetUrl);
  return (
    `intent://${pathWithQuery}` +
    `#Intent;scheme=https;action=android.intent.action.VIEW;` +
    `category=android.intent.category.BROWSABLE;` +
    `S.browser_fallback_url=${fallback};end`
  );
}

export function shouldAttemptIabExternalHandoff(profile: BrowserProfile): boolean {
  return (
    profile.isMetaInApp &&
    profile.isAndroid &&
    !hasIabReturnMarker() &&
    !hasIabEscapeAttempted()
  );
}

/**
 * One-shot Meta/Facebook in-app browser escape to Chrome (or system browser).
 * Returns true when navigation was initiated.
 */
export function attemptExternalBrowserHandoff(
  targetUrl: string = buildLandingUrlWithIabMarker(),
): boolean {
  if (typeof window === "undefined") return false;
  markIabEscapeAttempted();
  window.location.href = buildExternalChromeIntentUrl(targetUrl);
  return true;
}

export function clearIabEscapeState(): void {
  try {
    sessionStorage.removeItem(ESCAPE_SESSION_KEY);
  } catch {
    // ignore
  }
}
