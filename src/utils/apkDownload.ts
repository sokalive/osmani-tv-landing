import { APK_CONFIG } from "../config/download";
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

/** Separated install handoff concepts — never merge into one fake state */
export type InstallHandoffResult = {
  /** What the browser actually did */
  action: "instructions-only" | "share-chooser-offered";
  /** Whether APK bytes are still in page memory */
  blobInMemory: boolean;
  /** Whether browser download manager received the file */
  browserDownloadStarted: boolean;
  /** Web Share API with files is available (not installer) */
  shareAvailable: boolean;
  /** Package installer cannot be launched from JavaScript */
  packageInstallerAvailable: false;
  message: string;
};

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
  const total = contentLength ? parseInt(contentLength, 10) : null;

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

/**
 * Default OPEN / INSTALL action: instructions only.
 * Does NOT use navigator.share unless explicitly requested via shareApkFile().
 */
export function getInstallInstructions(
  blobInMemory: boolean,
  browserDownloadStarted: boolean,
): InstallHandoffResult {
  const shareAvailable = blobInMemory ? false : false; // computed separately when needed

  let message: string;
  if (blobInMemory && browserDownloadStarted) {
    message =
      "Your APK download completed. Open your notification shade or Downloads folder, then tap Osmani-TV-Max.apk. Allow installs from this browser if Android asks.";
  } else if (browserDownloadStarted) {
    message =
      "The APK was sent to your browser download manager. Open your notification shade or Downloads folder, then tap Osmani-TV-Max.apk to install.";
  } else {
    message =
      "Download the APK first, then open your notification shade or Downloads folder to install.";
  }

  return {
    action: "instructions-only",
    blobInMemory,
    browserDownloadStarted,
    shareAvailable,
    packageInstallerAvailable: false,
    message,
  };
}

/** Optional secondary action — opens share chooser, NOT package installer */
export async function shareApkFile(blob: Blob): Promise<InstallHandoffResult> {
  if (!isShareAvailableForApk(blob)) {
    return getInstallInstructions(true, true);
  }
  const file = new File([blob], APK_CONFIG.fileName, {
    type: "application/vnd.android.package-archive",
  });
  try {
    await navigator.share({ files: [file], title: APK_CONFIG.fileName });
    return {
      action: "share-chooser-offered",
      blobInMemory: true,
      browserDownloadStarted: true,
      shareAvailable: true,
      packageInstallerAvailable: false,
      message:
        "Share sheet opened. If an installer or file manager appears, select it. Otherwise use your Downloads folder.",
    };
  } catch {
    return getInstallInstructions(true, true);
  }
}
