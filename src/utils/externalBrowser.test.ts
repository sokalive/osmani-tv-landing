import { describe, expect, it, vi } from "vitest";
import {
  buildExternalChromeIntentUrl,
  buildLandingUrlWithIabMarker,
  shouldAttemptIabExternalHandoff,
} from "./externalBrowser";
import type { BrowserProfile } from "./browser";

function profile(overrides: Partial<BrowserProfile>): BrowserProfile {
  return {
    isAndroid: false,
    isMetaInApp: false,
    isInstagram: false,
    isFacebook: false,
    isChrome: false,
    isSamsungInternet: false,
    supportsAutoDownload: true,
    supportsWebShareFiles: false,
    label: "Browser",
    ...overrides,
  };
}

describe("externalBrowser IAB escape", () => {
  it("builds Chrome intent URL with fallback", () => {
    const intent = buildExternalChromeIntentUrl(
      "https://osmani-tv-landing.vercel.app/?from_iab=1",
    );
    expect(intent).toContain("intent://");
    expect(intent).toContain("com.android.chrome");
    expect(intent).toContain("browser_fallback_url");
  });

  it("marks landing URL with from_iab query param", () => {
    vi.stubGlobal("window", {
      location: { href: "https://osmani-tv-landing.vercel.app/" },
    });
    expect(buildLandingUrlWithIabMarker()).toContain("from_iab=1");
    vi.unstubAllGlobals();
  });

  it("attempts IAB escape only on Meta Android before return marker", () => {
    expect(
      shouldAttemptIabExternalHandoff(
        profile({ isAndroid: true, isMetaInApp: true, isFacebook: true }),
      ),
    ).toBe(true);
    expect(
      shouldAttemptIabExternalHandoff(
        profile({ isAndroid: true, isChrome: true }),
      ),
    ).toBe(false);
  });
});
