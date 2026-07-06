import { APK_CONFIG } from "../config/download";
import type { BrowserProfile } from "./browser";
import {
  isHtmlContentType,
  validateApkBlob,
  validateApkSha256,
} from "./apkValidation";

export type DownloadProgress = {
  loaded: number;
  total: number | null;
  percent: number | null;
};

export type DownloadResult = {
  blob: Blob | null;
  method: "fetch-blob" | "native-anchor" | "navigation";
};

export type InstallHandoffAction =
  | "blob-anchor-open"
  | "blob-navigation"
  | "web-share"
  | "instructions-only";

export type InstallHandoffResult = {
  action: InstallHandoffAction;
  blobInMemory: boolean;
  /** True only when a second browser download manager entry was intentionally started */
  browserDownloadStarted: boolean;
  shareAvailable: boolean;
  packageInstallerAvailable: false;
  message: string;
};

let retainedInstallObjectUrl: string | null = null;

export function revokeInstallObjectUrl(): void {
  if (retainedInstallObjectUrl) {
    URL.revokeObjectURL(retainedInstallObjectUrl);
    retainedInstallObjectUrl = null;
  }
}

function getOrCreateInstallObjectUrl(blob: Blob): string {
  if (!retainedInstallObjectUrl) {
    retainedInstallObjectUrl = URL.createObjectURL(
      new Blob([blob], { type: "application/vnd.android.package-archive" }),
    );
  }
  return retainedInstallObjectUrl;
}

export async function downloadApkWithProgress(
  url: string,
  onProgress: (progress: DownloadProgress) => void,
  signal?: AbortSignal,
): Promise<DownloadResult> {
  const response = await fetch(url, { cache: "no-store", signal });

  if (!response.ok) {
    throw new Error(`APK unavailable (HTTP ${response.status})`);
  }

  const responseType = response.headers.get("content-type");
  if (isHtmlContentType(responseType)) {
    throw new Error("Invalid APK response: received HTML instead of APK bytes");
  }

  const contentLength = response.headers.get("content-length");
  const total = contentLength
    ? parseInt(contentLength, 10)
    : APK_CONFIG.expectedSizeBytes;

  if (total !== null && total < APK_CONFIG.minBytes) {
    throw new Error(`Invalid APK response: file too small (${total} bytes)`);
  }

  if (!response.body) {
    const blob = await response.blob();
    const validation = await validateApkBlob(blob);
    if (!validation.valid) throw new Error(validation.reason);
    const hashCheck = await validateApkSha256(blob);
    if (!hashCheck.valid) throw new Error(hashCheck.reason);
    onProgress({ loaded: blob.size, total: blob.size, percent: 100 });
    return { blob, method: "fetch-blob" };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  onProgress({ loaded: 0, total, percent: total ? 0 : null });

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      loaded += value.length;
      onProgress({
        loaded,
        total,
        percent: total ? Math.min(100, Math.round((loaded / total) * 100)) : null,
      });
    }
  }

  const blob = new Blob(chunks as BlobPart[], {
    type: "application/vnd.android.package-archive",
  });

  const validation = await validateApkBlob(blob);
  if (!validation.valid) throw new Error(validation.reason);

  const hashCheck = await validateApkSha256(blob);
  if (!hashCheck.valid) throw new Error(hashCheck.reason);

  return { blob, method: "fetch-blob" };
}

export function triggerNativeDownload(url: string, fileName: string): DownloadResult {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  return { blob: null, method: "native-anchor" };
}

export function triggerNavigationDownload(url: string): DownloadResult {
  window.location.assign(url);
  return { blob: null, method: "navigation" };
}

/**
 * Persists a verified blob to the browser download manager.
 * Only call from explicit user install handoff when in-memory open paths fail —
 * never after fetch completion (that duplicates the CDN download).
 */
export function saveBlobToDevice(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export function isShareAvailableForApk(blob: Blob): boolean {
  const file = new File([blob], APK_CONFIG.fileName, {
    type: "application/vnd.android.package-archive",
  });
  return (
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  );
}

function openBlobWithAnchor(objectUrl: string): void {
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.type = "application/vnd.android.package-archive";
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export function getInstallInstructionsFallback(
  blobInMemory: boolean,
): InstallHandoffResult {
  const message = blobInMemory
    ? `If the Android installer did not open, check your notification shade or Downloads folder for ${APK_CONFIG.fileName}, or use Share APK below.`
    : "Download the APK first, then open your notification shade or Downloads folder to install.";

  return {
    action: "instructions-only",
    blobInMemory,
    browserDownloadStarted: false,
    shareAvailable: false,
    packageInstallerAvailable: false,
    message,
  };
}

/**
 * Strongest validated install handoff from a verified in-memory APK blob.
 * Must run inside a user gesture (button tap). Does not start a CDN re-download.
 */
export async function attemptInstallHandoff(
  blob: Blob,
  profile: BrowserProfile,
): Promise<InstallHandoffResult> {
  const objectUrl = getOrCreateInstallObjectUrl(blob);
  const shareAvailable = isShareAvailableForApk(blob);

  try {
    openBlobWithAnchor(objectUrl);
    return {
      action: "blob-anchor-open",
      blobInMemory: true,
      browserDownloadStarted: false,
      shareAvailable,
      packageInstallerAvailable: false,
      message:
        "Attempting to open the Android package installer. If nothing happens, try Share APK or open Downloads.",
    };
  } catch {
    // fall through
  }

  if (profile.isAndroid) {
    try {
      window.location.assign(objectUrl);
      return {
        action: "blob-navigation",
        blobInMemory: true,
        browserDownloadStarted: false,
        shareAvailable,
        packageInstallerAvailable: false,
        message: "Opening APK for install…",
      };
    } catch {
      // fall through
    }
  }

  if (shareAvailable) {
    const file = new File([blob], APK_CONFIG.fileName, {
      type: "application/vnd.android.package-archive",
    });
    try {
      await navigator.share({ files: [file], title: APK_CONFIG.fileName });
      return {
        action: "web-share",
        blobInMemory: true,
        browserDownloadStarted: false,
        shareAvailable: true,
        packageInstallerAvailable: false,
        message:
          "Share sheet opened. Choose a package installer or file manager if offered.",
      };
    } catch {
      // user dismissed share sheet
    }
  }

  return getInstallInstructionsFallback(true);
}

/** Optional secondary action — opens share chooser, NOT package installer */
export async function shareApkFile(blob: Blob): Promise<InstallHandoffResult> {
  if (!isShareAvailableForApk(blob)) {
    return getInstallInstructionsFallback(true);
  }
  const file = new File([blob], APK_CONFIG.fileName, {
    type: "application/vnd.android.package-archive",
  });
  try {
    await navigator.share({ files: [file], title: APK_CONFIG.fileName });
    return {
      action: "web-share",
      blobInMemory: true,
      browserDownloadStarted: false,
      shareAvailable: true,
      packageInstallerAvailable: false,
      message:
        "Share sheet opened. If an installer or file manager appears, select it.",
    };
  } catch {
    return getInstallInstructionsFallback(true);
  }
}
