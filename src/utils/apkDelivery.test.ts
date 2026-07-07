import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  clearApkTransferSession,
  formatApkSizeBadge,
  getApkFileName,
  hasApkTransferStarted,
  initiateApkCdnDownload,
  markApkTransferStarted,
} from "./apkDelivery";
import { APK_CONFIG } from "../config/download";

describe("apkDelivery", () => {
  beforeEach(() => {
    clearApkTransferSession();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses the production CDN URL for a single navigation transfer", () => {
    const assignSpy = vi.fn();
    vi.stubGlobal("window", { location: { assign: assignSpy } });

    const url = initiateApkCdnDownload();

    expect(url).toBe(APK_CONFIG.externalUrl);
    expect(assignSpy).toHaveBeenCalledTimes(1);
    expect(assignSpy).toHaveBeenCalledWith(APK_CONFIG.externalUrl);
    expect(hasApkTransferStarted()).toBe(true);
  });

  it("does not initiate a second transfer when session is marked", () => {
    markApkTransferStarted();
    expect(hasApkTransferStarted()).toBe(true);
  });

  it("exposes expected filename and badge", () => {
    expect(getApkFileName()).toBe("Osmani TV Mx.apk");
    expect(formatApkSizeBadge()).toBe("APK • 90.83 MB");
  });
});
