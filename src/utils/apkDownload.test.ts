import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  attemptInstallHandoff,
  downloadApkWithProgress,
  revokeInstallObjectUrl,
} from "./apkDownload";

describe("apkDownload install handoff", () => {
  beforeEach(() => {
    revokeInstallObjectUrl();
  });

  afterEach(() => {
    revokeInstallObjectUrl();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("attemptInstallHandoff opens blob anchor without download attribute", async () => {
    const blob = new Blob([new Uint8Array([0x50, 0x4b])], {
      type: "application/vnd.android.package-archive",
    });
    const clickSpy = vi.fn();
    const anchor = {
      href: "",
      type: "",
      rel: "",
      style: { display: "" },
      click: clickSpy,
      hasAttribute: (name: string) => name === "download" && false,
    };

    vi.stubGlobal("document", {
      createElement: () => anchor,
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
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

    expect(result.action).toBe("blob-anchor-open");
    expect(result.browserDownloadStarted).toBe(false);
    expect(clickSpy).toHaveBeenCalled();
  });

  it("saveBlobToDevice is not used on fetch completion path", () => {
    const source = downloadApkWithProgress.toString();
    expect(source).not.toContain("saveBlobToDevice");
  });
});
