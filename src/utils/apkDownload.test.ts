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

  it("persists verified blob to Downloads on Android without CDN re-fetch", async () => {
    const blob = new Blob([new Uint8Array([0x50, 0x4b, 0x03, 0x04])], {
      type: "application/vnd.android.package-archive",
    });
    const clickSpy = vi.fn();
    const anchor = { href: "", download: "", rel: "", style: { display: "" }, click: clickSpy };

    vi.stubGlobal("document", {
      createElement: () => anchor,
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
    });
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:apk-test"),
      revokeObjectURL: vi.fn(),
    });

    const result = await attemptInstallHandoff(blob, {
      isAndroid: true,
      isMetaInApp: false,
      isInstagram: false,
      isFacebook: false,
      isChrome: true,
      isSamsungInternet: false,
      supportsAutoDownload: true,
      supportsWebShareFiles: false,
      label: "Chrome",
    });

    expect(result.action).toBe("persist-to-downloads");
    expect(result.tier).toBe(2);
    expect(result.browserDownloadStarted).toBe(true);
    expect(clickSpy).toHaveBeenCalled();
    expect(hasPersistedArtifactToDownloads()).toBe(true);
  });

  it("does not persist twice on repeated OPEN / INSTALL", async () => {
    const blob = new Blob([new Uint8Array([0x50, 0x4b])], {
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

    const profile = {
      isAndroid: true,
      isMetaInApp: false,
      isInstagram: false,
      isFacebook: false,
      isChrome: true,
      isSamsungInternet: false,
      supportsAutoDownload: true,
      supportsWebShareFiles: false,
      label: "Chrome",
    };

    await attemptInstallHandoff(blob, profile);
    await attemptInstallHandoff(blob, profile);
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("fetch completion path does not call persist or saveBlob", () => {
    const source = downloadApkWithProgress.toString();
    expect(source).not.toContain("persistVerifiedBlobToDownloads");
    expect(source).not.toContain("saveBlobToDevice");
  });
});
