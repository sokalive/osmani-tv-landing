import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ApkFileCard } from "./ApkFileCard";
import { APK_CONFIG } from "../config/download";

describe("ApkFileCard", () => {
  it("renders a real anchor to the production CDN APK without download attribute", () => {
    const html = renderToStaticMarkup(<ApkFileCard />);

    expect(html).toContain(`href="${APK_CONFIG.externalUrl}"`);
    expect(html).toContain("Osmani TV Mx.apk");
    expect(html).toContain("91 MB • APK");
    expect(html).toContain("Gusa faili kufungua");
    expect(html).toContain('aria-label="Fungua faili Osmani TV Mx.apk, ukubwa 91 MB"');
    expect(html).not.toContain('download="');
    expect(html).not.toContain("APK INAPAKULIWA");
    expect(html).not.toContain("INSTALL APK");
  });
});
