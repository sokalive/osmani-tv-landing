import { describe, expect, it } from "vitest";
import { selectInstallHandoffPlan } from "./installHandoffStrategy";
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

describe("selectInstallHandoffPlan", () => {
  it("Chrome Android uses CDN navigation for OS download", () => {
    const plan = selectInstallHandoffPlan(
      profile({ isAndroid: true, isChrome: true }),
    );
    expect(plan.targetTier).toBe(1);
    expect(plan.steps).toEqual(["cdn-navigation"]);
  });

  it("Meta IAB uses CDN navigation after external browser path", () => {
    const plan = selectInstallHandoffPlan(
      profile({ isAndroid: true, isMetaInApp: true, isFacebook: true }),
    );
    expect(plan.steps).toEqual(["cdn-navigation"]);
  });

  it("after verified fetch uses anchor save not CDN navigation", () => {
    const plan = selectInstallHandoffPlan(
      profile({ isAndroid: true, isChrome: true }),
      { browserFetchComplete: true },
    );
    expect(plan.steps).toContain("anchor-browser-download");
    expect(plan.steps).not.toContain("native-app-bridge");
  });
});
