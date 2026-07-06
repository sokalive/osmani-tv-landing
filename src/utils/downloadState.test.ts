import { describe, expect, it } from "vitest";
import {
  calculateProgressPercent,
  getPrimaryButtonLabel,
  isBrowserHandoffState,
  isVerifiedCompleteState,
  shouldShowDownloadAgain,
} from "./downloadState";
import { formatProgressLabel } from "./formatBytes";

describe("downloadState", () => {
  it("browser_handoff is not verified complete", () => {
    expect(isVerifiedCompleteState("browser_handoff")).toBe(false);
    expect(isBrowserHandoffState("browser_handoff")).toBe(true);
  });

  it("browser_handoff does not show OPEN / INSTALL", () => {
    expect(getPrimaryButtonLabel("browser_handoff")).toBe("DOWNLOAD");
  });

  it("anchor handoff state does not show Download again", () => {
    expect(shouldShowDownloadAgain("browser_handoff")).toBe(false);
  });

  it("verified complete shows OPEN / INSTALL and Download again", () => {
    expect(getPrimaryButtonLabel("completed")).toBe("OPEN / INSTALL");
    expect(shouldShowDownloadAgain("completed")).toBe(true);
  });

  it("calculates real progress from bytes", () => {
    expect(calculateProgressPercent(45_417_468, 90_834_935)).toBe(50);
    expect(calculateProgressPercent(90_834_935, 90_834_935)).toBe(100);
  });

  it("returns null percent when total unknown", () => {
    expect(calculateProgressPercent(1000, null)).toBeNull();
  });
});

describe("formatProgressLabel", () => {
  it("shows percentage and MB when total known", () => {
    const label = formatProgressLabel(43_200_000, 90_834_935, 48);
    expect(label).toContain("48%");
    expect(label).toContain("43.20 MB");
    expect(label).toContain("90.83 MB");
  });
});

describe("download start is not completion", () => {
  it("starting and downloading are not install-ready", () => {
    expect(getPrimaryButtonLabel("starting")).toBe("STARTING…");
    expect(getPrimaryButtonLabel("downloading")).toBe("DOWNLOADING…");
    expect(getPrimaryButtonLabel("verifying")).toBe("VERIFYING…");
    for (const s of ["starting", "downloading", "verifying"] as const) {
      expect(isVerifiedCompleteState(s)).toBe(false);
      expect(shouldShowDownloadAgain(s)).toBe(false);
      expect(getPrimaryButtonLabel(s)).not.toBe("OPEN / INSTALL");
    }
  });

  it("76% progress math matches owner evidence", () => {
    const loaded = 68_880_000;
    const total = 90_834_935;
    expect(calculateProgressPercent(loaded, total)).toBe(76);
  });

  it("OPEN / INSTALL hidden before verified completion", () => {
    for (const s of [
      "idle",
      "starting",
      "downloading",
      "verifying",
      "browser_handoff",
      "error",
    ] as const) {
      expect(isVerifiedCompleteState(s)).toBe(false);
    }
  });

  it("OPEN / INSTALL visible after verified completion", () => {
    expect(isVerifiedCompleteState("completed")).toBe(true);
    expect(isVerifiedCompleteState("install_handoff")).toBe(true);
    expect(getPrimaryButtonLabel("install_handoff")).toBe("OPEN / INSTALL");
  });
});
