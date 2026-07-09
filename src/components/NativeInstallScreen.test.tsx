import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NativeInstallScreen } from "../components/NativeInstallScreen";
import { APK_CONFIG } from "../config/download";

describe("NativeInstallScreen", () => {
  it("renders native UI with APK file card as primary interaction", () => {
    const html = renderToStaticMarkup(<NativeInstallScreen />);

    expect(html).toContain("OSMANI TV");
    expect(html).toContain("Burudani");
    expect(html).toContain("Bila Kikomo");
    expect(html).toContain("Osmani TV Mx");
    expect(html).toContain("Version 2.4.1");
    expect(html).toContain(`href="${APK_CONFIG.externalUrl}"`);
    expect(html).toContain("Osmani TV Mx.apk");
    expect(html).toContain("91 MB • APK");
    expect(html).toContain("Gusa faili kufungua");
    expect(html).toContain("Live TV");
    expect(html).not.toContain("INSTALL APK");
    expect(html).not.toContain("APK INAPAKULIWA");
    expect(html).not.toContain("Inaanza kupakua");
  });
});
