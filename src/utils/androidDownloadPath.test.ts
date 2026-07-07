import { describe, expect, it } from "vitest";
import { selectAndroidDownloadPath } from "./androidDownloadPath";
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

describe("selectAndroidDownloadPath", () => {
  it("Chrome Android uses direct CDN navigation only", () => {
    expect(
      selectAndroidDownloadPath(
        profile({ isAndroid: true, isChrome: true }),
      ),
    ).toBe("direct-cdn-navigation");
  });

  it("Samsung Internet uses direct CDN navigation", () => {
    expect(
      selectAndroidDownloadPath(
        profile({ isAndroid: true, isSamsungInternet: true }),
      ),
    ).toBe("direct-cdn-navigation");
  });

  it("Meta IAB first attempt uses external browser handoff", () => {
    expect(
      selectAndroidDownloadPath(
        profile({ isAndroid: true, isMetaInApp: true, isFacebook: true }),
      ),
    ).toBe("iab-external-browser");
  });

  it("never selects verified-fetch RAM path", () => {
    const path = selectAndroidDownloadPath(
      profile({ isAndroid: true, isChrome: true }),
    );
    expect(path).not.toBe("verified-fetch");
  });
});
