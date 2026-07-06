import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  isHtmlContentType,
  validateApkHead,
  validateApkBlob,
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
    const r = validateApkHead(200, "application/vnd.android.package-archive", "90000000");
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
