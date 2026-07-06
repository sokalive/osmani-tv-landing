import { describe, expect, it, vi } from "vitest";
import {
  buildLandingInstallHttpsUrl,
  buildOsmaniCustomInstallUrl,
  isInstallRoute,
} from "./installBridge";

describe("installBridge", () => {
  it("builds pinned install HTTPS URL", () => {
    const url = buildLandingInstallHttpsUrl();
    expect(url).toContain("https://osmani-tv-landing.vercel.app/install");
    expect(url).toContain("sha256=0bcfbecd167fe09a70b722abe890984e429d22d022075086cf0d50b557cc8e2d");
    expect(url).toContain("size=90834935");
    expect(url).toContain(encodeURIComponent("https://osmani-tv-apk-download.b-cdn.net"));
  });

  it("builds custom scheme install URL", () => {
    const url = buildOsmaniCustomInstallUrl();
    expect(url.startsWith("osmani://install?")).toBe(true);
  });

  it("detects install route pathname", () => {
    vi.stubGlobal("window", {
      location: { pathname: "/install" },
    });
    expect(isInstallRoute()).toBe(true);
    vi.unstubAllGlobals();
  });
});
