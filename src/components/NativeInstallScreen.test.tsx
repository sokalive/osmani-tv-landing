import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NativeInstallScreen } from "../components/NativeInstallScreen";

describe("NativeInstallScreen", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { location: { href: "https://example.test/" } });
  });

  it("renders reference UI markers", () => {
    const html = renderToStaticMarkup(
      <NativeInstallScreen
        state="idle"
        message="Bonyeza ili kupakua na kusakinisha"
        onInstall={() => undefined}
      />,
    );

    expect(html).toContain("OSMANI TV");
    expect(html).toContain("Burudani");
    expect(html).toContain("Bila Kikomo");
    expect(html).toContain("Osmani TV Mx");
    expect(html).toContain("APK • 90.83 MB");
    expect(html).toContain("Version 2.4.1");
    expect(html).toContain("INSTALL APK");
    expect(html).toContain("Live TV");
    expect(html).toContain("Filamu");
    expect(html).toContain("Series");
    expect(html).toContain("Zaidi");
  });
});
