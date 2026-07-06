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
  it("targets Tier 2 on Android Chrome with persist after optional share", () => {
    const plan = selectInstallHandoffPlan(
      profile({ isAndroid: true, isChrome: true, supportsWebShareFiles: true }),
    );
    expect(plan.targetTier).toBe(2);
    expect(plan.steps[0]).toBe("web-share");
    expect(plan.steps).toContain("persist-to-downloads");
    expect(plan.tier1Limitation).toContain("content://");
  });

  it("uses persist-to-downloads when Web Share unavailable", () => {
    const plan = selectInstallHandoffPlan(
      profile({ isAndroid: true, isChrome: true }),
    );
    expect(plan.steps[0]).toBe("persist-to-downloads");
  });

  it("Meta IAB is Tier 4 instructions only", () => {
    const plan = selectInstallHandoffPlan(
      profile({ isAndroid: true, isMetaInApp: true, label: "Facebook" }),
    );
    expect(plan.targetTier).toBe(4);
    expect(plan.steps).toEqual(["instructions-only"]);
  });

  it("desktop is Tier 4", () => {
    const plan = selectInstallHandoffPlan(profile({}));
    expect(plan.targetTier).toBe(4);
  });
});
