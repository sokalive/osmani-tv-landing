import { describe, expect, it } from "vitest";
import {
  getInstallButtonLabel,
  getStatusMessage,
  isBrowserHandoffState,
  isBusyState,
} from "./downloadState";

describe("downloadState (APK-first)", () => {
  it("INSTALL APK is the default idle label", () => {
    expect(getInstallButtonLabel("idle")).toBe("INSTALL APK");
  });

  it("truthful Swahili status labels without fake percentages", () => {
    expect(getStatusMessage("starting")).toBe("Inaanza kupakua…");
    expect(getStatusMessage("browser_handoff")).toContain("APK inapakuliwa");
    expect(getStatusMessage("idle")).toBe("Bonyeza ili kupakua na kusakinisha");
  });

  it("browser_handoff is the OS download manager state", () => {
    expect(isBrowserHandoffState("browser_handoff")).toBe(true);
    expect(isBrowserHandoffState("idle")).toBe(false);
  });

  it("starting is busy but not handoff complete", () => {
    expect(isBusyState("starting")).toBe(true);
    expect(getInstallButtonLabel("starting")).toBe("INAANZA…");
    expect(getInstallButtonLabel("browser_handoff")).toBe("APK INAPAKULIWA…");
  });

  it("no OPEN / INSTALL state exists", () => {
    expect(getInstallButtonLabel("idle")).not.toContain("OPEN");
    expect(getInstallButtonLabel("browser_handoff")).not.toContain("OPEN");
  });
});
