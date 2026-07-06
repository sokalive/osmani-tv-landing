import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  attemptExternalBrowserHandoff,
  buildExternalChromeIntentUrl,
  buildLandingUrlWithIabMarker,
  clearIabEscapeState,
  hasIabEscapeAttempted,
  hasIabReturnMarker,
  shouldAttemptIabExternalHandoff,
} from "./externalBrowser";
import type { BrowserProfile } from "./browser";

function metaProfile(): BrowserProfile {
  return {
    isAndroid: true,
    isMetaInApp: true,
    isInstagram: false,
    isFacebook: true,
    isChrome: false,
    isSamsungInternet: false,
    supportsAutoDownload: false,
    supportsWebShareFiles: false,
    label: "Facebook",
  };
}

describe("externalBrowser", () => {
  beforeEach(() => {
    clearIabEscapeState();
    vi.stubGlobal("window", {
      location: {
        href: "https://osmani-tv-landing.vercel.app/",
        assign: vi.fn(),
      },
    });
    vi.stubGlobal("sessionStorage", {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return (this as { store: Record<string, string> }).store[key] ?? null;
      },
      setItem(key: string, value: string) {
        (this as { store: Record<string, string> }).store[key] = value;
      },
      removeItem(key: string) {
        delete (this as { store: Record<string, string> }).store[key];
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds Chrome intent URL with fallback", () => {
    const intent = buildExternalChromeIntentUrl(
      "https://osmani-tv-landing.vercel.app/?from_iab=1",
    );
    expect(intent).toContain("intent://osmani-tv-landing.vercel.app/");
    expect(intent).toContain("package=com.android.chrome");
    expect(intent).toContain("browser_fallback_url=");
  });

  it("marks IAB return URL to prevent redirect loops", () => {
    const marked = buildLandingUrlWithIabMarker();
    expect(marked).toContain("from_iab=1");
  });

  it("detects from_iab query marker", () => {
    vi.stubGlobal("window", {
      location: { href: "https://osmani-tv-landing.vercel.app/?from_iab=1" },
    });
    expect(hasIabReturnMarker()).toBe(true);
  });

  it("attempts external handoff once", () => {
    let assigned = "";
    const location = { href: "https://osmani-tv-landing.vercel.app/" };
    Object.defineProperty(location, "href", {
      get() {
        return "https://osmani-tv-landing.vercel.app/";
      },
      set(v: string) {
        assigned = v;
      },
      configurable: true,
    });
    vi.stubGlobal("window", { location });
    expect(shouldAttemptIabExternalHandoff(metaProfile())).toBe(true);
    expect(
      attemptExternalBrowserHandoff("https://osmani-tv-landing.vercel.app/?from_iab=1"),
    ).toBe(true);
    expect(assigned).toContain("intent://");
    expect(hasIabEscapeAttempted()).toBe(true);
    expect(shouldAttemptIabExternalHandoff(metaProfile())).toBe(false);
  });
});
