import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../config/download", () => ({
  APK_CONFIG: {
    minBytes: 100_000,
    externalUrl: "https://osmani-tv-apk-download.b-cdn.net/Osmani%20TV%20Mx.apk",
  },
  APK_RELEASE: {
    expectedSizeBytes: null,
    sha256: null,
    minBytes: 100_000,
  },
  isSameOriginApk: (url: string) => {
    try {
      return new URL(url).origin === "http://localhost:5173";
    } catch {
      return false;
    }
  },
  isCrossOriginCdnApk: (url: string) =>
    url.includes("b-cdn.net"),
}));

import {
  isHtmlContentType,
  validateApkHead,
  validateApkBlob,
  probeApkAvailability,
} from "./apkValidation";

describe("isHtmlContentType", () => {
  it("detects text/html", () => {
    expect(isHtmlContentType("text/html; charset=utf-8")).toBe(true);
  });
  it("rejects apk type", () => {
    expect(isHtmlContentType("application/vnd.android.package-archive")).toBe(
      false,
    );
  });
});

describe("validateApkHead", () => {
  it("rejects 404", () => {
    const r = validateApkHead(404, null, null);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toContain("404");
  });

  it("rejects HTML content-type", () => {
    const r = validateApkHead(200, "text/html", "5000");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toContain("HTML");
  });

  it("rejects tiny content-length", () => {
    const r = validateApkHead(200, "application/octet-stream", "500");
    expect(r.valid).toBe(false);
  });

  it("accepts valid head", () => {
    const r = validateApkHead(200, "application/vnd.android.package-archive", "90834935");
    expect(r.valid).toBe(true);
  });
});

describe("probeApkAvailability", () => {
  it("uses HEAD when CORS allows cross-origin probe", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: {
        get: (name: string) => {
          if (name === "content-type") return "application/octet-stream";
          if (name === "content-length") return "90834935";
          return null;
        },
      },
    }) as unknown as typeof fetch;

    const r = await probeApkAvailability(
      "https://osmani-tv-apk-download.b-cdn.net/Osmani%20TV%20Mx.apk",
    );
    expect(r.valid).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://osmani-tv-apk-download.b-cdn.net/Osmani%20TV%20Mx.apk",
      { method: "HEAD", cache: "no-store" },
    );
  });

  it("falls back to configured CDN metadata when HEAD fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("CORS blocked")) as unknown as typeof fetch;

    const r = await probeApkAvailability(
      "https://osmani-tv-apk-download.b-cdn.net/Osmani%20TV%20Mx.apk",
    );
    expect(r.valid).toBe(true);
  });
});

describe("validateApkBlob", () => {
  it("rejects HTML blob", async () => {
    const blob = new Blob(["<!DOCTYPE html>"], { type: "text/html" });
    const r = await validateApkBlob(blob);
    expect(r.valid).toBe(false);
  });

  it("rejects tiny blob", async () => {
    const blob = new Blob(["tiny"], { type: "application/octet-stream" });
    const r = await validateApkBlob(blob);
    expect(r.valid).toBe(false);
  });

  it("rejects non-zip magic", async () => {
    const data = new Uint8Array(200_000).fill(0x41);
    const blob = new Blob([data], { type: "application/octet-stream" });
    const r = await validateApkBlob(blob);
    expect(r.valid).toBe(false);
  });

  it("accepts PK zip header", async () => {
    const data = new Uint8Array(200_000);
    data[0] = 0x50;
    data[1] = 0x4b;
    data[2] = 0x03;
    data[3] = 0x04;
    const blob = new Blob([data], {
      type: "application/vnd.android.package-archive",
    });
    const r = await validateApkBlob(blob);
    expect(r.valid).toBe(true);
  });

  it("rejects SPA html disguised as blob", async () => {
    const html = "<!DOCTYPE html><html>".padEnd(150_000, " ");
    const blob = new Blob([html], { type: "application/octet-stream" });
    const r = await validateApkBlob(blob);
    expect(r.valid).toBe(false);
  });
});

describe("getBrowserProfile", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile",
      share: undefined,
      canShare: undefined,
    });
  });

  it("detects Chrome Android", async () => {
    const { getBrowserProfile } = await import("./browser");
    const p = getBrowserProfile();
    expect(p.isChrome).toBe(true);
    expect(p.isAndroid).toBe(true);
    expect(p.supportsAutoDownload).toBe(true);
  });

  it("detects Meta IAB and blocks auto download", async () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 FBAN/FB4A Instagram",
      share: undefined,
      canShare: undefined,
    });
    const { getBrowserProfile } = await import("./browser");
    const p = getBrowserProfile();
    expect(p.isMetaInApp).toBe(true);
    expect(p.supportsAutoDownload).toBe(false);
  });

  it("detects Samsung Internet", async () => {
    vi.stubGlobal("navigator", {
      userAgent: "SamsungBrowser/24.0 Chrome/120",
      share: undefined,
      canShare: undefined,
    });
    const { getBrowserProfile } = await import("./browser");
    const p = getBrowserProfile();
    expect(p.isSamsungInternet).toBe(true);
  });
});
