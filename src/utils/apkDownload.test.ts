import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  attemptInstallHandoff,
  downloadApkWithProgress,
  hasPersistedArtifactToDownloads,
  resetInstallHandoffState,
} from "./apkDownload";

describe("apkDownload install handoff", () => {
  beforeEach(() => {
    resetInstallHandoffState();
  });

  afterEach(() => {
    resetInstallHandoffState();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses anchor-browser-download on Android after verified fetch", async () => {
    const blob = new Blob([new Uint8Array([0x50, 0x4b, 0x03, 0x04])], {
      type: "application/vnd.android.package-archive",
    });
    const clickSpy = vi.fn();
    vi.stubGlobal("document", {
      createElement: () => ({
        href: "",
        download: "",
        rel: "",
        style: { display: "" },
        click: clickSpy,
      }),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
    });
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:apk-test"),
      revokeObjectURL: vi.fn(),
    });

    const result = await attemptInstallHandoff(
      blob,
      {
        isAndroid: true,
        isMetaInApp: false,
        isInstagram: false,
        isFacebook: false,
        isChrome: true,
        isSamsungInternet: false,
        supportsAutoDownload: true,
        supportsWebShareFiles: false,
        label: "Chrome",
      },
      { browserFetchComplete: true },
    );

    expect(result.action).toBe("anchor-browser-download");
    expect(result.tier).toBe(2);
    expect(clickSpy).toHaveBeenCalled();
    expect(hasPersistedArtifactToDownloads()).toBe(true);
  });

  it("uses cdn-navigation on Android without verified blob", async () => {
    const assignSpy = vi.fn();
    vi.stubGlobal("window", { location: { assign: assignSpy, href: "" } });
    const result = await attemptInstallHandoff(
      null,
      {
        isAndroid: true,
        isMetaInApp: false,
        isInstagram: false,
        isFacebook: false,
        isChrome: true,
        isSamsungInternet: false,
        supportsAutoDownload: true,
        supportsWebShareFiles: false,
        label: "Chrome",
      },
    );
    expect(result.action).toBe("cdn-navigation");
    expect(result.tier).toBe(1);
    expect(assignSpy).toHaveBeenCalled();
  });

  it("fetch completion path does not save via anchor", () => {
    const source = downloadApkWithProgress.toString();
    expect(source).not.toContain("saveVerifiedBlobViaAnchor");
  });
});
