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
  it("install route targets native bridge first", () => {
    const plan = selectInstallHandoffPlan(
      profile({ isAndroid: true, isChrome: true }),
      { installRoute: true },
    );
    expect(plan.targetTier).toBe(1);
    expect(plan.steps[0]).toBe("native-app-bridge");
  });

  it("after browser fetch uses anchor save not native bridge", () => {
    const plan = selectInstallHandoffPlan(
      profile({ isAndroid: true, isChrome: true }),
      { browserFetchComplete: true },
    );
    expect(plan.steps).toContain("anchor-browser-download");
    expect(plan.steps).not.toContain("native-app-bridge");
  });
});
