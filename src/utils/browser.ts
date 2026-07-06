export type BrowserProfile = {
  isAndroid: boolean;
  isMetaInApp: boolean;
  isInstagram: boolean;
  isFacebook: boolean;
  isChrome: boolean;
  isSamsungInternet: boolean;
  supportsAutoDownload: boolean;
  supportsWebShareFiles: boolean;
  label: string;
};

function detectMetaInApp(ua: string): boolean {
  return /FBAN|FBAV|FB_IAB|FBIOS/i.test(ua);
}

function detectInstagram(ua: string): boolean {
  return /Instagram/i.test(ua);
}

function detectFacebook(ua: string): boolean {
  return /FBAN|FBAV|FB_IAB/i.test(ua) && !/Instagram/i.test(ua);
}

export function getBrowserProfile(): BrowserProfile {
  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);
  const isMetaInApp = detectMetaInApp(ua);
  const isInstagram = detectInstagram(ua);
  const isFacebook = detectFacebook(ua);
  const isSamsungInternet = /SamsungBrowser/i.test(ua);
  const isChrome =
    /Chrome/i.test(ua) && !/Edg|OPR|SamsungBrowser/i.test(ua);

  const supportsWebShareFiles =
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function";

  // Meta in-app browsers frequently block programmatic downloads without a tap.
  const supportsAutoDownload = !isMetaInApp;

  let label = "Browser";
  if (isInstagram) label = "Instagram";
  else if (isFacebook) label = "Facebook";
  else if (isMetaInApp) label = "Meta in-app browser";
  else if (isSamsungInternet) label = "Samsung Internet";
  else if (isChrome) label = "Chrome";

  return {
    isAndroid,
    isMetaInApp,
    isInstagram,
    isFacebook,
    isChrome,
    isSamsungInternet,
    supportsAutoDownload,
    supportsWebShareFiles,
    label,
  };
}

export function isBackForwardNavigation(): boolean {
  const navEntries = performance.getEntriesByType(
    "navigation",
  ) as PerformanceNavigationTiming[];
  return navEntries.length > 0 && navEntries[0].type === "back_forward";
}
